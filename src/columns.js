(function ($) {

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

            methods = {
                destroy: function () {

                    // exapnd this method to return the html to the original state

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
            if (options in methods) {
                methods[options]();
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
                    height: self.height(),
                    top: self.offset().top,
                    win: $window.height(),
                    cols: 4,
                    columnHeights: [],
                    columnTemplate: '<div class="column">{{ content }}</div>'
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

            settings.columns = $(this).find(".column");

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
                maxCol = 0;

            for (i = 0; i < settings.cols; i++) {
                settings.columns.eq(i).css({
                    left: i * 100 / settings.cols + "%",
                    width: 100 / settings.cols + "%"
                });
                settings.columnHeights[i] = settings.columns.eq(i).height();
                maxCol = Math.max(settings.columnHeights[i], maxCol);
            }

            self.height(maxCol);

            settings.height = self.height();
            settings.top = self.offset().top;
            settings.win = $window.height();

            console.log(settings);

            self.data("settings", settings);
        }

        function onScroll(e) {

            console.log("on Scroll called");

            var self = $(e.data[0]),
                settings = self.data("settings"),
                scrollTop = $window.scrollTop(),
                i = 0;

            for (i = 0; i < settings.cols; i++) {
                if (scrollTop + settings.win > settings.columnHeights[i]) {
                    settings.columns.eq(i).addClass("is-fixed");
                } else {
                    settings.columns.eq(i).removeClass("is-fixed");
                }
            }

        }

        return create.call(this, options);
    };

}(window.jQuery || window.Zepto));