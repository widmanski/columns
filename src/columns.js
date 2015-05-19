(function($) {

    "use strict";

    if ($.zepto && !$.fn.removeData) {
        console.log('Error: Zepto is loaded without the data module.');
    }
    // shim layer with setTimeout fallback
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            false;
    })();

    $.fn.columns = function(options) {

        var
            _self = this,

            tests = {
                scrollY: (window.scrollY >= 0) ? true : false
            },

            frameId,

            resizeTimeout = null,

            scrollTimeout = null,
            scrolling = false,

            settings = {},

            // Cache selectors ###########################################
            $doc = $(document),
            $body = $('body'),
            $window = $(window),

            publicMethods = {
                destroy: function() {

                    // exapand this method to return the html to the original state --> unwrap the columns content, remove inline styles
                    settings = this.data("settings");
                    if (!settings) {
                        return;
                    }

                    if (settings.createColumns) {
                        this[0].innerHTML = settings.oldHTML;
                        this[0].setAttribute("style", "");
                    }

                    $window.off("." + settings.namespace);
                    $(this).removeData("settings");

                    clearTimeout(resizeTimeout);

                    if ("cancelAnimationFrame" in window) {
                        window.cancelAnimationFrame(frameId);
                    }

                    settings.destroyed = true;

                    // console.log("destroy called");

                },

                softDestroy: function() {
                    settings = this.data("settings");
                    if (!settings) {
                        return;
                    }

                    $window.off("." + settings.namespace);
                    $(this).removeData("settings");

                    clearTimeout(resizeTimeout);

                    if ("cancelAnimationFrame" in window) {
                        window.cancelAnimationFrame(frameId);
                    }

                },

                update: function(key, val) {
                    var self = $(this);

                    settings = settings || self.data("settings") || {};

                    settings[key] = val;

                    self.data("settings", settings);

                }
            };

        if (typeof(options) === "string") {
            if (options in publicMethods) {
                publicMethods[options].call(this, (arguments.length > 1) ? arguments.slice(1) : arguments);
                return _self;
            }
        }

        function vAddClass(el, className) {
            if (el.classList) {
                el.classList.add(className);
            } else {
                el.className += ' ' + className;
            }
        }

        function vRemoveClass(el, className) {
            if (el.classList) {
                el.classList.remove(className);
            } else {
                el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
            }
        }

        function transform(el, transformCss) {
            el.style.webkitTransform = transformCss;
            el.style.MozTransform = transformCss;
            el.style.msTransform = transformCss;
            el.style.transform = transformCss;
        }

        function removeStyleAttr(elem, attr) {
            if (elem.style.removeProperty) {
                elem.style.removeProperty(attr);
            } else {
                elem.style.removeAttribute(attr);
            }
        }

        function call(functions, scope, args) {

            if (!$.isArray(functions)) {
                functions = [functions];
            }

            $.each(functions, function() {
                if (typeof this === 'function') {
                    this.call(scope, args);
                }
            });
        }

        // Test in an object is an instance of jQuery or Zepto.
        function instance(object) {
            return object instanceof $ || ($.zepto && $.zepto.isZ(object));
        }

        function create(options) {

            options = options || {};

            var self = this,

                defaultSettings = {

                    namespace:          "columns",
                    height:             self.height(), // container height
                    width:              self.width(), // container width
                    top:                self.offset().top, // container offset top
                    left:               self.offset().left, // container offset left
                    win:                $window.height(),
                    winW:               $window.width(),
                    gutterTop:          0, // optional top gutter      
                    cols:               4, // number of columns
                    columnHeights:      [], // cache column heigths
                    columnTemplate:     '<div class="column">{{ content }}</div>',
                    autoWidth:          true, // automatically assign the column width
                    createColumns:      true, // automatically create columns?
                    proportionalScroll: false, // makes the columns scroll proportionally using css transforms
                    reverse:            false, // makes the shorter columns stick to the top, rather than to the bottom
                    reversedDirection:  false, // makes the even columns scroll the other way
                    requestFrame:       true,
                    destroyed:          false
                        // , autoUpdate:   true
                        // , interval:     null

                },

                cels = self.children(),
                celsCount = cels.length,
                i = 0,

                columnHTML = "",
                columns = [],
                currentCol = 0,
                newHTML = "",
                columnHeights = [];

            options.filter = options.filter || false;

            $.extend(settings, defaultSettings, options);

            if (settings.createColumns) {
                // 1. Group into columns

                settings.oldHTML = self[0].innerHTML;

                for (i = 0; i < celsCount; i++) {
                    columns[currentCol] = (columns[currentCol] || "") + cels[i].outerHTML;
                    currentCol++;
                    if (currentCol === settings.cols) currentCol = 0;
                }

                for (i = 0; i < settings.cols; i++) {
                    columns[i] = columns[i] || "";
                    newHTML += settings.columnTemplate.replace("{{ content }}", columns[i]);
                }

                // Replace the html
                self.html(newHTML);

                settings.columns = self.find(".column");

            } else {
                settings.columns = self.children();
            }

            self.data("settings", settings);

            if (window.requestAnimationFrame && settings.requestFrame) {

                $window.on("scroll." + settings.namespace, this, onScroll)
                    .on("resize." + settings.namespace, this, onResize)
                    .on("touchmove." + settings.namespace, this, onScroll)
                    .trigger("scroll")
                    .trigger("resize");

                onResize();
                onScroll();

                render();
                frameId = requestAnimFrame(loop);

            } else {

                $window.on("scroll." + settings.namespace, this, render)
                    .on("resize." + settings.namespace, this, onResize)
                    .on("touchmove." + settings.namespace, this, render)
                    .trigger("scroll")
                    .trigger("resize");

                onResize();
                render();
            }

            // experimental -- do a resize every 2s
            resizeTimeout = setTimeout(onResize, 2000);

            return self;

        }

        var lastScroll = 0;

        function loop() {

            if (settings.destroyed) {
                return;
            }
            render();
            frameId = requestAnimFrame(loop);
        }

        function onResize(e) {

            if (!_self.length) {
                // the element is missing abort;
                return;
            }

            var self = _self,
                i = 0,
                maxCol = 0,
                colOffset = 0,
                colWidth = 0,
                newCSS = {
                    // todo: base this on the container middle and element offset
                    left: 0
                };

            if (!settings) return;

            settings.width = self.width();
            settings.top = self.offset().top;
            settings.left = self.offset().left;
            settings.win = $window.height();
            settings.winW = $window.width();

            if (settings.autoWidth) {
                newCSS.width = settings.width / settings.cols + "px";
            }

            for (i = 0; i < settings.cols; i++) {

                settings.columns.eq(i).removeAttr("style").removeClass("is-fixed").removeClass("is-short");

                newCSS.marginLeft = colWidth;
                // newCSS.marginLeft = Math.round(settings.width * 1 * ( (i - settings.cols) / settings.cols + 0.5)) + "px";

                settings.columns.eq(i).css(newCSS);
                settings.columnHeights[i] = settings.columns.eq(i).height() + settings.gutterTop;
                maxCol = Math.max(settings.columnHeights[i], maxCol);

                colWidth += settings.columns.eq(i).width();
            }

            self.height(maxCol);

            // move those up in the function
            settings.height = maxCol;

            self.data("settings", settings);

            onScroll.call(self, {
                data: [self]
            });
        }

        function onScroll() {

            scrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                scrolling = false;
            });

        }

        function render() {

            // key function ###########################################

            var self = _self,
                scrollTop = (tests.scrollY) ? window.scrollY : $window.scrollTop(),
                i = 0;

            if (!settings) return;

            if (settings.proportionalScroll) {

                // consider: setting this individually for each column

                var columnRatio = 1,
                    colShift = 0,
                    colTransform = "",
                    colTop = 0;
                // This uses the prortional scrolling mode -- the shorter columns will be moved up to offset for their smaller height
                for (i = 0; i < settings.cols; i++) {
                    columnRatio = settings.columnHeights[i] / settings.height;

                    if (columnRatio === 1) {
                        continue;
                    }

                    colShift = (1 - columnRatio) * settings.height * Math.min(1, Math.max(0, (scrollTop - settings.top) / (settings.height - settings.win)));
                    colShift = Math.round(colShift);

                    colTransform = "translate3d(0px," + colShift + "px, 0px)";

                    if ((scrollTop - settings.top) / (settings.height - settings.win) > 1) {
                        colTransform = "none";
                        colTop = colShift;
                    }

                    settings.columns.eq(i).get(0).style.top = colTop + "px";
                    transform(settings.columns.eq(i).get(0), colTransform);

                }
                // in this mode no need for locking columns
                return;
            }

            // the master branch only handling proportional scrolling

        }

        return create.call(this, options);
    };

}(window.jQuery || window.Zepto));