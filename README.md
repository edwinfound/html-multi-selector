# 基于HTML的多级选择

![image](https://github.com/edwin404/html-multi-selector/raw/master/demo/images/demo.png)

## 如何使用

1. 引入css

`<link rel="stylesheet" href="/path/to/css/html-multi-selector.css">`

2. 引入js

`<link rel="stylesheet" href="/path/to/js/html-multi-selector.js">`

3. 使用JS代码初始化

```
var demoStatic = new HtmlMultiSelector({
    data: testData,
    callback: {
        done: function () {
            var titles = this.titleVal();
            $('#demoStatic').html('你选择了:' + titles.join(','));
        }
    }
});
$('#demoStatic').on('click', function () {
    demoStatic.open();
});
```

更多参照示例


## 在线Demo演示

[http://edwin404.com/html-multi-selector/demo](http://edwin404.com/html-multi-selector/demo)