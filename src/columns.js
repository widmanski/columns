(function ($) {

    "use strict";

    if ($.zepto && !$.fn.removeData) {
        console.log('Error: Zepto is loaded without the data module.');
    }

    $.fn.columns = function (options) {

        var
        _self = this,

        tests = {
            scrollY: (window.scrollY >= 0) ? true : false
        },

        resizeTimeout = null,


        // Cache selectors;
        $doc = $(document),
            $body = $('body'),
            $window = $(window),


            publicMethods = {
                destroy: function () {

                    // exapand this method to return the html to the original state --> unwrap the columns content, remove inline styles
                    var settings = this.data("settings");
                    $window.off("."+settings.namespace);
                    $(this).removeData("settings");

                    clearTimeout(resizeTimeout);

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

                    namespace:      "columns",
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
                    proportionalScroll: false,              // makes the columns scroll proportionally using css transforms
                    reverse:        false,                  // makes the shorter columns stick to the top, rather than to the bottom
                    reversedDirection: false                // makes the even columns scroll the other way
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

            // is usless I think
            // if ( settings.autoUpdate ) {
            //     settings.interval = setInterval(function(){ 
            //         updatePosition(self);
            //     }, 100);
            // }

            self.data("settings", settings);

            $window.on("scroll." + settings.namespace, this, onScroll)
                .on("resize." + settings.namespace, this, onResize)
                .on("touchmove." + settings.namespace, this, onScroll)
                .trigger("scroll")
                .trigger("resize");

            onResize();
            onScroll();

            // experimental -- do a resize every 2s
            resizeTimeout = setTimeout(onResize, 2000);


            return self;

        }

        var lastScroll = 0;

        // function updatePosition(self) {      
            
        //     if ( window.scrollY - lastScroll > 10 || window.scrollY + lastScroll < -10) {
        //         onScroll.call(self, {data: [self]});
        //         console.log(window.scrollY);
        //     }
            
        //     lastScroll = window.scrollY;

        // }

        function onResize(e) {


            var self = _self,
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


            self.data("settings", settings);

            onScroll.call(self, {data: [self]});
        }



        function onScroll(e) {



            // key function



            var self = _self,
                settings = self.data("settings"),
                scrollTop = (tests.scrollY) ? window.scrollY : $window.scrollTop(),
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

                    // toDo: use native JS ? for setting the atributes
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
            // to do: create an array of all those possible classes

            // if the user didn't reach it yet

            if ( scrollTop < settings.top ) {


                // clean up if user is above the target area

                settings.columns
                .removeClass("is-fixed")
                .removeClass("is-top-fixed")
                .removeClass("is-short")
                .css({"left": 0, "minHeight": 0, "top": 0});

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
                    "left": 0
                    //, "top": "auto",                              
                    // "transform":            "none",
                    // "-webkit-transform":    "none",
                    // "-moz-transform":       "none",
                    // "-ms-transform":        "none"
                });

           
                for (i = 0; i < settings.cols; i++) {

                    // handling for short columns
                    // if ( settings.columns.eq(i).hasClass("is-short") ) {
                    // new handling:
                    if ( settings.columnHeights[i] < settings.win && settings.columnHeights[i] < settings.height ) {

                        // scrolled past the column bottom -- let it go
                        if ( scrollTop + settings.columnHeights[i] > settings.top + settings.height ) {
                            settings.columns.eq(i).css({
                                top: "auto",
                                bottom: 0                            
                            });
                        }
                        else {
                            settings.columns.eq(i).css({

                                // minHeight: settings.win,
                                top: scrollTop - settings.top //- ( settings.top + settings.height ) 
                            
                            });
                        }
                    }

                }

                self.addClass("is-scrolled-past");
                return;
            }
            else {
                self.removeClass("is-scrolled-past");
            }


            // top (reverse) lock
 
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

          




            // default mode

            for (i = 0; i < settings.cols; i++) {

                if ( settings.columnHeights[i] < settings.win && scrollTop > settings.top ) {
                    settings.columns.eq(i).removeClass("is-fixed").addClass("is-short")
                    .css({
                        "left": settings.left,                        
                        "transform":            "none",
                        "-webkit-transform":    "none",
                        "-moz-transform":       "none",
                        "-ms-transform":        "none",
                        "top": 0
                    });
                    continue;
                }
                else {
                    settings.columns.eq(i).removeClass("is-short").css({"left": 0});
                }

                if ( scrollTop < settings.top ) continue;

                  // reversed direction scrolling
                // temp: the 2nd column is reversed [do every even column?]

                if ( settings.reversedDirection && i % 2 !== 0 ) {

                    var colShift =  2 * Math.max( scrollTop - settings.top, 0 ) + settings.win - settings.columnHeights[i] ;

                    colShift = Math.min ( colShift, -settings.win + settings.height);

                    colTransform = "translate3d(0px," + colShift + "px, 0px)";

                    // toDo: use native JS ? for setting the atributes
                    settings.columns.eq(i).css({
                        // marginTop: colShift 
                        "transform":            colTransform,
                        "-webkit-transform":    colTransform,
                        "-moz-transform":       colTransform,
                        "-ms-transform":       colTransform
                    });

                    continue;
                }

                // if (scrollTop + settings.win - settings.top > settings.columnHeights[i]) {
                if ( scrollTop > settings.top + settings.columnHeights[i] - settings.win ) {
                    settings.columns.eq(i).addClass("is-fixed").css({"top": "auto", "left": settings.left});
                } else {
                    settings.columns.eq(i).removeClass("is-fixed").css({"left": 0});
                }
            }



        }

        return create.call(this, options);
    };

}(window.jQuery || window.Zepto));