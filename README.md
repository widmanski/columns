# columns

> Locking multiple columns while scrolling to always fill the screens

<p align="center"><img style="max-width: 100%" height="400" src="http://dev.widmanski.com/columns/cols-demo.gif?v2" alt="Demo"></p>

> More info coming soon // This is a really early version // Please see demos for more info

## testing & building
- grunt test  
- 127.0.0.1:8282 in your browser for preview

## online demos
- http://dev.widmanski.com/columns/
- http://dev.widmanski.com/columns/small.html


## proportional scrolling [new]

By setting proportionalScroll to true you activate an alternative mode. The columns are no longer locked - they scroll proportionally to always end at container bottom.

- demo/proportional.html
- demo/small-proportional.html


## usage example
``` js
$("#wrapper").columns({
    cols: 5
});
```


## todos

- Add proper destroy method
- Enable various column widths
- Make various container layouts work
- Add tests
- Add a css transform matrix option to make scrolling speed proportional to column height