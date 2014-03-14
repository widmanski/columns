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

                    // exapand this method to return the html to the original state

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
                    cols:           4,                      // number of columns
                    columnHeights:  [],                     // cache column heigths
                    columnTemplate: '<div class="column">{{ content }}</div>',
                    autoWidth:      true,                   // automatically assign the column width
                    createColumns:  true                    // automatically create columns?
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
                newCSS = {
                    // todo: base this on the container middle and element offset
                    left: "50%"
                };

            if ( settings.autoWidth ) {
                newCSS.width = settings.width / settings.cols + "px";
            }

            for (i = 0; i < settings.cols; i++) {

                newCSS.marginLeft = Math.round(settings.width * 1 * ( (i - settings.cols) / settings.cols + 0.5)) + "px";

                settings.columns.eq(i).removeClass("is-fixed").removeClass("is-short").css(newCSS);
                settings.columnHeights[i] = settings.columns.eq(i).height();                
                maxCol = Math.max(settings.columnHeights[i], maxCol);
            }

            self.height(maxCol);

            settings.width = self.width();
            settings.height = self.height();
            settings.top = self.offset().top;
            settings.win = $window.height();

            console.log(settings);

            self.data("settings", settings);

            onScroll.call(self, {data: [self]});
        }

        function onScroll(e) {



            var self = $(e.data[0]),
                settings = self.data("settings"),
                scrollTop = $window.scrollTop(),
                i = 0;


            console.log("on Scroll called");

            // if the user scrolled past
            if ( scrollTop + settings.win > settings.top + settings.height ) {
                settings.columns.removeClass("is-fixed");
                self.addClass("is-scrolled-past");
                return;
            }
            else {
                self.removeClass("is-scrolled-past");
            }




            for (i = 0; i < settings.cols; i++) {

                if ( settings.columnHeights[i] < settings.win && scrollTop > settings.top ) {
                    settings.columns.eq(i).removeClass("is-fixed").addClass("is-short");
                    continue;
                }
                else {
                    settings.columns.eq(i).removeClass("is-short");
                }

                if ( scrollTop < settings.top ) continue;

                if (scrollTop + settings.win - settings.top > settings.columnHeights[i]) {
                    settings.columns.eq(i).addClass("is-fixed");
                } else {
                    settings.columns.eq(i).removeClass("is-fixed");
                }
            }

        }

        return create.call(this, options);
    };

}(window.jQuery || window.Zepto));