# 基于HTML的多级选择

## 它是什么

![image](https://github.com/edwin404/html-multi-selector/raw/master/demo/images/demo.png)

## 在线演示

[http://edwin404.com/html-multi-selector/demo](http://edwin404.com/html-multi-selector/demo)

## 如何使用

step1. 引入css

```html
<link rel="stylesheet" href="/path/to/css/html-multi-selector.css">
```

step2. 引入js

```html
<script src="/path/to/js/html-multi-selector.js"></script>
````

step3. 使用JS代码初始化

```javascript
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

## 可配置的参数说明

```javascript
var options={
    // 初始化时多个值的分隔符
    seperator   : ',',
    // 数据是否使用动态
    dynamic     : false,
    // 动态获取数据库路径
    server      : "/path/to/data",
    // 静态数据
    data        : [],
    // 最大级
    maxLevel    : 0,
    // 固定级
    fixedLevel  : 0,
    // 语言包
    lang        : {
        close       : '取消',
        done        : '确定',
        pleaseSelect: '请选择'
    },
    callback: {
        // 选择发生变化时回调
        change: function (values, titles) {
        },
        // 点击确定时回调
        done: function () {
        },
        // 点击取消时回调
        close: function () {
        },
    }
}
````

## 意见反馈

[https://github.com/edwin404/html-multi-selector/issues](https://github.com/edwin404/html-multi-selector/issues)