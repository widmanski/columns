# columns

## Back to working on the plugin! The master branch is now limited to proportioanl scrolling only

## Now supports requestAnimationFrame


> Locking multiple columns while scrolling to always fill the screens 

<p align="center"><img style="max-width: 100%" height="400" src="http://dev.widmanski.com/columns/cols-demo.gif?v3" alt="Demo"></p>

> More info coming soon // This is a really early version // Please see demos for more info

## features
- locking short columns to the top of the current container
- scrolling columns at different speeds to ensure they end in the same spot
- locking columns to the bottom of the container when you reach their end
- automatically wraps pieces of content into columns [optional]

## testing & building
- grunt test  
- 127.0.0.1:8282 in your browser for preview

## demos
- http://dev.widmanski.com/columns/
- http://dev.widmanski.com/columns/multiple.html - blog-like layout with multiple instances
- http://dev.widmanski.com/columns/small.html
- http://dev.widmanski.com/columns/reversed.html - columns lock to top instead of bottom


## proportional scrolling [new]

By setting proportionalScroll to true you activate an alternative mode. The columns are no longer locked - they scroll proportionally to always end at container bottom.

- http://dev.widmanski.com/columns/proportional.html
- http://dev.widmanski.com/columns/small-proportional.html
- http://dev.widmanski.com/columns/proportional-crazy.html - 11 columns.

## usage example
``` js
$("#wrapper").columns({
    cols: 5
});
```

## all options & default values
``` js
{
    cols:               4,                      // number of columns
    columnTemplate:     '<div class="column">{{ content }}</div>',
    autoWidth:          true,                   // automatically assign the column width
    createColumns:      true,                   // automatically create columns?
    proportionalScroll: false,                  // enable proportional scroll mode
    reverse:            false                   // makes the shorter columns stick to the top of the container
}
```

``` css
  /* 
    .wrapper holds the columns 
    call $.fn.columns() with it; feel free to rename 
    
    feel free to rename column --> update option columnTemplate accordingly [only in case of automatically creating columns]
    
  */
  .wrapper {
    position: relative;
  }

  .is-scrolled-past .column {
    position: absolute;
    bottom: 0;
    top: auto;
  }
  
  .column {
    position: absolute;
    top: 0;
  }

  .column.is-fixed {
    top: auto;
    position: fixed;
    bottom: 0;
  }

  .column.is-top-fixed {
    top: 0;
    position: fixed;
    bottom: 0;
  }

  .column.is-short {
    top: 0;
    position: fixed;
  }

  .is-scrolled-past .column.is-short {
    bottom: 0;
    position: absolute;
    top: auto;
  }
```

## todos

- Add proper destroy method
- Add lock-to-top option [currently it locks to bottom]
- Add tests
- Add a css transform matrix option to make scrolling speed proportional to column height [in progress]
- Enable choosing different settings for each column [is it necessary?]
- Add an option to set top offset of the fixed elements
- Add a "lock all elements" option in case you want to do a css 3d transform on the container [e.g. when using offscreen navigation]


## other plugins
If you're interested in similar plugins you may want to check out:
- https://github.com/zamiang/jquery.poplockit