(function ($) {

    "use strict";

    if ($.zepto && !$.fn.removeData) {
        console.log('Error: Zepto is loaded without the data module.');
    }

    $.fn.columns = function (options) {

        var
        // Cache selectors;
        $doc = $(document),
            $body = $('body'),
            $window = $(window),

            namespace = '.columns',

            publicMethods = {
                destroy: function () {

                    // exapand this method to return the html to the original state --> unwrap the columns content, remove inline styles

                    $(this).removeData("settings");
                    $window.off(namespace);
                    console.log("destroy called");

                },

                update: function (key, val) {
                    var self = $(this),
                        settings = self.data("settings") || {};

                    settings[key] = val;

                    self.data("settings", settings);

                }
            };

        if (typeof (options) === "string") {
            if (options in publicMethods) {
                publicMethods[options].call(this, (arguments.length > 1) ? arguments.slice(1) : arguments);
                return false;
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

                settings = {

                    height:         self.height(),          // container height
                    width:          self.width(),           // container width
                    top:            self.offset().top,      // container offset top
                    left:           self.offset().left,     // container offset left
                    win:            $window.height(),
                    winW:           $window.width(),
                    cols:           4,                      // number of columns
                    columnHeights:  [],                     // cache column heigths
                    columnTemplate: '<div class="column">{{ content }}</div>',
                    autoWidth:      true,                   // automatically assign the column width
                    createColumns:  true,                   // automatically create columns?
                    proportionalScroll: false                // makes the columns scroll proportionally using css transforms

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

            $.extend(settings, options);


            if ( settings.createColumns ) {
                // 1. Group into columns

                for (i = 0; i < celsCount; i++) {
                    columns[currentCol] = (columns[currentCol] || "") + cels[i].outerHTML;
                    currentCol++;
                    if (currentCol === settings.cols) currentCol = 0;
                }

                for (i = 0; i < settings.cols; i++) {
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

            $window.on("scroll" + namespace, this, onScroll)
                .on("resize" + namespace, this, onResize)
                .trigger("scroll")
                .trigger("resize");

            console.log(settings);

            return self;

        }

        function onResize(e) {

            var self = $(e.data[0]),
                settings = self.data("settings"),
                i = 0,
                maxCol = 0,
                colOffset = 0,
                colWidth = 0,
                newCSS = {
                    // todo: base this on the container middle and element offset
                    left: 0
                };

                
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
                settings.columnHeights[i] = settings.columns.eq(i).height();                
                maxCol = Math.max(settings.columnHeights[i], maxCol);

                colWidth += settings.columns.eq(i).width();
            }

            self.height(maxCol);

            // move those up in the function
            settings.height = self.height();

            console.log(settings);

            self.data("settings", settings);

            onScroll.call(self, {data: [self]});
        }

        function onScroll(e) {



            var self = $(e.data[0]),
                settings = self.data("settings"),
                scrollTop = $window.scrollTop(),
                i = 0;


            if ( settings.proportionalScroll ) {

                // consider: setting this individually for each column

                var columnRatio = 1,
                colShift = 0,
                colTransform = "";
                // This uses the prortional scrolling mode -- the shorter columns will be moved up to offset for their smaller height
                for (i = 0; i < settings.cols; i++) {
                    columnRatio = settings.columnHeights[i] / settings.height;

                    if ( columnRatio === 1 ) {
                        continue;
                    }

                    colShift = (1-columnRatio) * settings.height * Math.min(1,Math.max(0,(scrollTop - settings.top) / (settings.height - settings.win)));
                    colTransform = "translate3d(0px," + colShift + "px, 0px)";

                    // toDo: use native JS for setting the atributes
                    settings.columns.eq(i).css({
                        // marginTop: colShift 
                        "transform":            colTransform,
                        "-webkit-transform":    colTransform,
                        "-moz-transform":       colTransform,
                        "-ms-transform":       colTransform
                    });
                }
                // in this mode no need for locking columns
                return; 
            }   


            // to do: refactor those syle attributes found below into classes [maybe?] to avoid messing up other properties

            // if the user didn't reach it yet

            if ( scrollTop < settings.top ) {
                settings.columns.removeClass("is-fixed").removeClass("is-short").css({"left": 0, "minHeight": 0});
                self.removeClass("is-scrolled-past");
                return;
            }

            // if the user scrolled past

            // todo: optimize this section!

            if ( scrollTop + settings.win > settings.top + settings.height ) {
                settings.columns.removeClass("is-fixed").css({"left": 0});
                settings.columns.filter(".is-short").css({
                    minHeight: settings.win
                });
                self.addClass("is-scrolled-past");
                return;
            }
            else {
                self.removeClass("is-scrolled-past");
            }




            for (i = 0; i < settings.cols; i++) {

                if ( settings.columnHeights[i] < settings.win && scrollTop > settings.top ) {
                    settings.columns.eq(i).removeClass("is-fixed").addClass("is-short").css({"left": settings.left});
                    continue;
                }
                else {
                    settings.columns.eq(i).removeClass("is-short").css({"left": 0});
                }

                if ( scrollTop < settings.top ) continue;

                if (scrollTop + settings.win - settings.top > settings.columnHeights[i]) {
                    settings.columns.eq(i).addClass("is-fixed").css({"left": settings.left});
                } else {
                    settings.columns.eq(i).removeClass("is-fixed").css({"left": 0});
                }
            }

        }

        return create.call(this, options);
    };

}(window.jQuery || window.Zepto));