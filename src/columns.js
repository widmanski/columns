(function ($) {

    "use strict";

    if ($.zepto && !$.fn.removeData) {
        console.log('Error: Zepto is loaded without the data module.');
    }
    // shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              false;
    })();



    $.fn.columns = function (options) {


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
                destroy: function () {

                    // exapand this method to return the html to the original state --> unwrap the columns content, remove inline styles
                    settings = this.data("settings");
                    if ( !settings ) {
                        return;
                    }

                    if ( settings.createColumns ) {
                        this[0].innerHTML = settings.oldHTML;
                        this[0].setAttribute("style", "");
                    }

                    $window.off("."+settings.namespace);
                    $(this).removeData("settings");

                    clearTimeout(resizeTimeout);

                    if ( "cancelAnimationFrame" in window ) {
                        window.cancelAnimationFrame(frameId);
                    }

                    settings.destroyed = true;

                    // console.log("destroy called");

                },

                softDestroy: function() {
                    settings = this.data("settings");
                    if ( !settings ) {
                        return;
                    }

                    $window.off("."+settings.namespace);
                    $(this).removeData("settings");

                    clearTimeout(resizeTimeout);

                    if ( "cancelAnimationFrame" in window ) {
                        window.cancelAnimationFrame(frameId);
                    }

                },

                update: function (key, val) {
                    var self = $(this);

                    settings = settings || self.data("settings") || {};

                    settings[key] = val;

                    self.data("settings", settings);

                }
            };

        if (typeof (options) === "string") {
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

        function transform(el, transform) {
          el.style.webkitTransform   = transform;
          el.style.MozTransform      = transform;
          el.style.msTransform       = transform;
          el.style.transform         = transform;
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

            $.each(functions, function () {
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

                    namespace:      "columns",
                    height:         self.height(),          // container height
                    width:          self.width(),           // container width
                    top:            self.offset().top,      // container offset top
                    left:           self.offset().left,     // container offset left
                    win:            $window.height(),
                    winW:           $window.width(),
                    gutterTop:      0,                      // optional top gutter      
                    cols:           4,                      // number of columns
                    columnHeights:  [],                     // cache column heigths
                    columnTemplate: '<div class="column">{{ content }}</div>',
                    autoWidth:      true,                   // automatically assign the column width
                    createColumns:  true,                   // automatically create columns?
                    proportionalScroll: false,              // makes the columns scroll proportionally using css transforms
                    reverse:        false,                  // makes the shorter columns stick to the top, rather than to the bottom
                    reversedDirection: false,                // makes the even columns scroll the other way
                    requestFrame:   true,
                    destroyed:      false
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

            $.extend(settings, defaultSettings, options)
            // $.extend(settings, defaultSettings);



            if ( settings.createColumns ) {
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

            }

            else {
                settings.columns = self.children();
            }

          
            self.data("settings", settings);


            if ( window.requestAnimationFrame && settings.requestFrame ) {
                
                $window.on("scroll." + settings.namespace, this, onScroll)
                .on("resize." + settings.namespace, this, onResize)
                .on("touchmove." + settings.namespace, this, onScroll)
                .trigger("scroll")
                .trigger("resize");

                onResize();
                onScroll();

                render();
                frameId = requestAnimFrame(loop);

                

            }
            else {


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

            if ( settings.destroyed ) {
                return;
            }
            render();
            frameId = requestAnimFrame(loop);
        }



        function onResize(e) {



            if ( !_self.length ) {
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

            if ( !settings ) return;

                
            settings.width = self.width();
            settings.top = self.offset().top;
            settings.left = self.offset().left;
            settings.win = $window.height();
            settings.winW = $window.width();

            if ( settings.autoWidth ) {
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

            onScroll.call(self, {data: [self]});
        }


        function onScroll() {

            scrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function(){
                scrolling = false;
            });
            
        }

        function render() {

 // key function ###########################################

     

            var self = _self,
                scrollTop = (tests.scrollY) ? window.scrollY : $window.scrollTop(),
                i = 0;

            if ( !settings ) return;
           

            if ( settings.proportionalScroll ) {


                // consider: setting this individually for each column

                var columnRatio = 1,
                colShift = 0,
                colTransform = "",
                colTop = 0;
                // This uses the prortional scrolling mode -- the shorter columns will be moved up to offset for their smaller height
                for (i = 0; i < settings.cols; i++) {
                    columnRatio = settings.columnHeights[i] / settings.height;

                    if ( columnRatio === 1 ) {
                        continue;
                    }

                    colShift = (1-columnRatio) * settings.height * Math.min(1, Math.max(0, (scrollTop - settings.top) / (settings.height - settings.win)));
                    colShift = Math.round(colShift);
                    
                    colTransform = "translate3d(0px," + colShift + "px, 0px)";

                    if ( (scrollTop - settings.top) / (settings.height - settings.win) > 1 ) {
                        colTransform = "none";
                        colTop = colShift;
                    }

                    settings.columns.eq(i).get(0).style.top = colTop +"px";
                    transform(settings.columns.eq(i).get(0), colTransform);

                }
                // in this mode no need for locking columns
                return; 
            }   


            // to do: refactor those syle attributes found below into classes [maybe?] to avoid messing up other properties
            // to do: create an array of all those possible classes

            // if the user didn't reach it yet

            if ( scrollTop < settings.top ) {


                // clean up if user is above the target area

                settings.columns
                .removeClass("is-fixed")
                .removeClass("is-top-fixed")
                .removeClass("is-short")
                .css({
                    "left":     0, 
                    "minHeight": 0, 
                    "top":      settings.gutterTop
                });

                settings.columns.each(function(i, col){
                    removeStyleAttr(col, "position");
                });

                self.removeClass("is-scrolled-past");
                return;
            }


            // if the user scrolled past
            // todo: optimize this section!

            if ( scrollTop + settings.win > settings.top + settings.height ) {

                settings.columns
                .removeClass("is-fixed")
                .removeClass("is-top-fixed")
                .css({
                    "left": 0,
                    //, "top": "auto",                              
                    "transform":            "none",
                    "-webkit-transform":    "none",
                    "-moz-transform":       "none",
                    "-ms-transform":        "none"
                });

           
                for (i = 0; i < settings.cols; i++) {

 // handling for short columns ###########################################
                    
                    if ( settings.columnHeights[i] < settings.win && settings.columnHeights[i] < settings.height ) {

                        // scrolled past the column bottom -- let it go
                        if ( scrollTop + settings.columnHeights[i] > settings.top + settings.height ) {
                            settings.columns.eq(i).css({
                                top: "auto",
                                bottom: 0,
                                position: "absolute"                            
                            });
                        }
                        else {
                            settings.columns.eq(i).css({

                                // minHeight: settings.win,
                                position:   "fixed",
                                top:        settings.gutterTop,
                                "left":     settings.left
                                // top: scrollTop - settings.top + settings.gutterTop //- ( settings.top + settings.height ) 
                            
                            });
                        }
                    }

  // Shorter column ends  ###########################################

                }
                self.addClass("is-scrolled-past");
                return;
            }
            else {
                self.removeClass("is-scrolled-past");
            }

//      top (reverse) lock ###########################################
//      gutterTop not available here

            if ( settings.reverse ) {

                for (i = 0; i < settings.cols; i++) {

                    if ( settings.columnHeights[i] < settings.win && scrollTop > settings.top ) {
                        settings.columns.eq(i).removeClass("is-bottom-fixed").addClass("is-short").css({"left": settings.left, "top": 0});
                        continue;
                    }
                    else {
                        settings.columns.eq(i).removeClass("is-short")
                        .css({
                            "left": 0, 
                            "top": 0
                        });
                    }

                    if ( scrollTop < settings.top ) continue;

                    if ( scrollTop > settings.top + settings.height - settings.columnHeights[i] ) {

                        settings.columns.eq(i).removeClass("is-top-fixed")
                        .css({
                            "left": 0,
                            "top":  settings.height - settings.columnHeights[i]
                        });

                    } else if (settings.columnHeights[i] < settings.height ) {

                        settings.columns.eq(i).addClass("is-top-fixed")
                        .css({
                            "left": settings.left
                        });

                    }

                }


                return;
            }

          




 // default mode ###########################################

            for (i = 0; i < settings.cols; i++) {

                // Handling for short columns continues
                // The column is shorter than the screen, lock it while scrolling
                if ( settings.columnHeights[i] < settings.win && scrollTop > settings.top ) {
                    settings.columns.eq(i).removeClass("is-fixed").addClass("is-short")
                    .css({
                        "left":                 settings.left,                        
                        "transform":            "none",
                        "-webkit-transform":    "none",
                        "-moz-transform":       "none",
                        "-ms-transform":        "none",
                        "position":             "fixed",
                        "top":                  settings.gutterTop
                    });
                    continue;
                }
                else {
                    settings.columns.eq(i).removeClass("is-short").css({
                        "left":     0
                    });
                    removeStyleAttr(settings.columns.eq(i).get(0), "position");
                }

                if ( scrollTop < settings.top ) continue;

// reversed direction scrolling  ###########################################
                // temp: the 2nd column is reversed [do every even column?]

                if ( settings.reversedDirection && i % 2 !== 0 ) {

                    var colShift =  2 * Math.max( scrollTop - settings.top, 0 ) + settings.win - settings.columnHeights[i];
                    
                    colShift = Math.round(colShift);

                    colShift = Math.min ( colShift, -settings.win + settings.height);

                    colTransform = "translate3d(0px," + colShift + "px, 0px)";

                    // toDo: use native JS ? for setting the atributes
                    transform( columns.eq(i).get(0), colTransform );


                    continue;
                }

 // reversed direction ends ###########################################
 // supports gutterTop

                if ( scrollTop > settings.top + settings.columnHeights[i]  + settings.gutterTop - settings.win ) {
                    
                    settings.columns.eq(i).addClass("is-fixed")
                    .css({
                        "top": "auto", 
                        "left": settings.left
                    });

                } else {
                    settings.columns.eq(i).removeClass("is-fixed").css({"left": 0});
                }
            }



        }

        return create.call(this, options);
    };

}(window.jQuery || window.Zepto));