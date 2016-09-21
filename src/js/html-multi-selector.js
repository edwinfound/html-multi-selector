/**
 * html multi selector
 *
 * version : beta
 * author  : edwin404
 * Github  : https://github.com/edwin404/html-multi-selector
 *
 * Licensed under MIT
 */

;(function () {

    var globalIndex = 0;

    var HtmlMultiSelector = function (option) {

        if (typeof $ == "undefined") {
            alert("HtmlMultiSelector require jQuery");
            return;
        }

        var defaultOption = {
            container: null,
            seperator: ",",
            dynamic: false,
            server: "/path/to/data",
            data: [],
            maxLevel: 0,
            fixedLevel: 0,
            lang: {
                close: '取消',
                done: '确定',
                pleaseSelect: '请选择'
            },
            callback: {
                change: function (values, titles) {

                },
                done: function () {

                },
                close: function () {

                },
            },

            // build in params do not modify
            selectorValue: "[data-value]",
            selectorTitle: "[data-title]",
            valueKey: "id",
            parentValueKey: "pid",
            titleKey: "title",
            sortKey: "sort",
            rootParentValue: 0,
            optionItemHeightInEm: 2.0,
            serverMethod: "get",
            serverDataType: "json",
            serverResponseHandle: function (res) {
                if (typeof res !== 'object') {
                    alert("ErrorResponse:" + res);
                    return [];
                }
                if (!("code" in res) || !("data" in res)) {
                    alert("ErrorResponseObject:" + res.toString());
                    return [];
                }
                if (res.code != 0) {
                    alert("ErrorResponseCode:" + res.code);
                    return [];
                }
                return res.data;
            }
        };

        this.opt = $.extend(defaultOption, option);
        this.dom = {
            container: $(this.opt.container),
            dialog: null,
            dialogItems: null
        };
        this.data = {
            items: [],
            value: [],
            title: []
        };

        if (!this.opt.dynamic) {
            this.data.items = this.dataConvert(this.opt.data);
        }

        this.init();

    };

    HtmlMultiSelector.prototype = {

        init: function () {


            this.initDialog();

            this.initEvent();

            this.initValues();

        },

        initEvent: function () {
            var me = this;
            var isMobile = (typeof window.document.ontouchstart != "undefined");
            var touchStart = isMobile ? 'touchstart' : 'mousedown',
                touchEnd = isMobile ? 'touchend' : 'mouseup',
                touchMove = isMobile ? 'touchmove' : 'mousemove';

            this.dom.dialog.on(touchStart, '[data-btn-close]', function () {
                me.close();
                return false;
            });

            this.dom.dialog.on(touchStart, '[data-btn-done]', function () {
                me.done();
                return false;
            });

            var currentOption = null, currentOptionTopInEm = 0, currentOptionY = 0, currentOptionHeight = 0, currentOptionItemCount = 0;
            this.dom.dialog.on(touchStart, '[data-option-level]', function (event) {
                if (isMobile) {
                    currentOptionY = event.originalEvent.targetTouches[0].clientY;
                } else {
                    currentOptionY = event.clientY;
                }
                currentOption = $(this).find('[data-options]');
                currentOptionItemCount = currentOption.find('div').length;
                var topInPx = parseFloat(currentOption.css('top'));
                if (!topInPx) {
                    topInPx = 0;
                }
                // top and bottom line 1px
                currentOptionHeight = $(this).find('[data-grid]').height() + 2;
                currentOptionTopInEm = topInPx * me.opt.optionItemHeightInEm / currentOptionHeight;
                //console.log("top:" + currentOption.css('top') + ", currentOptionTopInEm:" + currentOptionTopInEm + ", currentOptionHeight:" + currentOptionHeight);
            });

            this.dom.dialog.on(touchMove, document, function (event) {
                event.preventDefault();
                if (null == currentOption) {
                    return;
                }
                var y, diff, diffInEm, newTopInEm;
                if (isMobile) {
                    y = event.originalEvent.targetTouches[0].clientY;
                } else {
                    y = event.clientY;
                }
                diff = y - currentOptionY;

                diffInEm = (diff * me.opt.optionItemHeightInEm / currentOptionHeight );
                newTopInEm = currentOptionTopInEm + diffInEm;

                if (newTopInEm < -(currentOptionItemCount - 1) * me.opt.optionItemHeightInEm) {
                    currentOption.css({top: -((currentOptionItemCount - 1) * me.opt.optionItemHeightInEm) + 'em'});
                } else if (newTopInEm > 0) {
                    currentOption.css({top: '0'});
                } else {
                    currentOption.css({top: newTopInEm + 'em'});
                }
            });

            this.dom.dialog.on(touchEnd, document, function (event) {
                if (null == currentOption) {
                    return;
                }
                var topInPx = parseFloat(currentOption.css('top'));
                currentOptionTopInEm = topInPx * me.opt.optionItemHeightInEm / currentOptionHeight;
                currentOptionTopInEm = parseInt(currentOptionTopInEm / me.opt.optionItemHeightInEm - 0.5) * me.opt.optionItemHeightInEm;
                currentOption.animate({top: currentOptionTopInEm + 'em'});

                var index = -parseInt(currentOptionTopInEm / me.opt.optionItemHeightInEm);

                currentOption.find('[data-value]').removeAttr('data-selected');
                $(currentOption.find('[data-value]').get(index)).attr('data-selected', true);
                me.dom.dialog.trigger('dialog.category.change', [currentOption.closest('[data-option-level]')]);

                currentOption = null;
            });

            this.dom.dialog.on('dialog.category.change', function (event, optionLevel) {

                var $option = optionLevel.find('[data-options] > [data-selected]');
                var level = parseInt(optionLevel.attr('data-option-level'));
                var value = $option.attr('data-value');
                if (0 == me.opt.maxLevel || level < me.opt.maxLevel) {

                    if (me.opt.dynamic) {
                        if (value == "") {
                            me.renderClear(level + 1);
                            me.syncVal();
                        } else {
                            me.sendAsyncRequest(value, function (data) {
                                me.data.items = data;
                                me.render(level + 1, value);
                                me.syncVal();
                            });
                        }
                    } else {
                        if (0 == me.opt.maxLevel || level < me.opt.maxLevel) {
                            if (value == "") {
                                me.renderClear(level + 1);
                                me.syncVal();
                            } else {
                                me.render(level + 1, value);
                                me.syncVal();
                            }
                        }
                    }

                } else {
                    me.syncVal();
                }
            });

        },

        initDialog: function () {

            var id = "html-multi-selector-" + (++globalIndex);

            this.dom.dialog = $([
                '<div class="html-multi-selector-container" id="', id, '">',
                '   <div class="html-multi-selector-box html-multi-selector-slide-in-up">',
                '       <div class="html-multi-selector-btn-box">',
                '           <div class="html-multi-selector-btn" data-btn-close>', this.opt.lang.close, '</div>',
                '           <div class="html-multi-selector-btn" data-btn-done>', this.opt.lang.done, '</div>',
                '       </div>',
                '       <div class="html-multi-selector-mask">',
                '           <div class="html-multi-selector-roll" data-items>',
                '           </div>',
                '       </div>',
                '   </div>',
                '</div>'
            ].join(''));

            this.dom.dialog.appendTo('body');
            this.dom.dialogItems = this.dom.dialog.find('[data-items]');

            if (this.opt.fixedLevel > 0) {
                for (var i = 0; i < this.opt.fixedLevel; i++) {
                    this.setLevelOption(i + 1, []);
                }
            }

        },

        initValues: function () {
            var me = this;
            var initValues = [], initTitles = [];
            if (this.dom.container.length) {
                var values;
                var initValueStr = this.dom.container.find(this.opt.selectorValue).val();
                if (initValueStr) {
                    values = initValueStr.split(this.opt.seperator);
                    for (var i = 0; i < values.length; i++) {
                        if (values[i]) {
                            initValues.push(values[i]);
                        }
                    }
                } else {
                    initValueStr = this.dom.container.find(this.opt.selectorTitle).val();
                    values = initValueStr.split(this.opt.seperator);
                    for (var i = 0; i < values.length; i++) {
                        if (values[i]) {
                            initTitles.push(values[i]);
                        }
                    }
                }
            }

            if (this.opt.dynamic && initValues.length) {
                this.val(initValues);
            } else if (this.opt.dynamic && initTitles.length) {
                this.titleVal(initTitles);
            } else if (this.opt.dynamic) {
                this.sendAsyncRequest(0, function (data) {
                    me.data.items = data;
                    me.render(1, me.opt.rootParentValue);
                });
            } else {
                if (initValues.length) {
                    this.val(initValues);
                } else if (initTitles.length) {
                    this.titleVal(initTitles);
                } else {
                    me.render(1, me.opt.rootParentValue);
                }
            }

        },

        sendAsyncRequest: function (parentValue, callback, title) {
            title = title || null;
            var data = {};
            var me = this, sortKey = this.opt.sortKey;
            data[this.opt.parentValueKey] = parentValue;
            data[this.opt.titleKey] = title;
            $.ajax({
                type: this.opt.serverMethod,
                url: this.opt.server,
                dataType: this.opt.serverDataType,
                timeout: 30000,
                data: data,
                success: function (res) {
                    var data = me.opt.serverResponseHandle(res);
                    data.sort(function (x, y) {
                        return x[sortKey] - y[sortKey];
                    });
                    var options = me.dataConvert(res.data);
                    callback(options);
                },
                error: function () {
                    alert('请求出现错误 T_T');
                }
            });
        },

        dataConvert: function (data) {
            var me = this;
            var options = [];
            for (var i = 0; i < data.length; i++) {
                options.push({
                    parentValue: data[i][me.opt.parentValueKey],
                    value: data[i][me.opt.valueKey],
                    title: data[i][me.opt.titleKey]
                });
            }
            return options;
        },

        render: function (level, parentValue) {

            var me = this;

            this.dom.dialogItems.find('[data-option-level]').each(function (i, o) {
                var lev = parseInt($(o).attr('data-option-level'));
                if (lev >= level) {
                    if (level > 1) {
                        if (!me.opt.fixedLevel) {
                            $(o).remove();
                        } else {
                            $(o).find('[data-options]').html('').css('top', 0);
                        }
                    } else {
                        $(o).find('[data-options]').html('').css('top', 0);
                    }
                }
            });

            var options = [];
            var items = this.data.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].parentValue == parentValue) {
                    options.push({value: items[i].value, title: items[i].title});
                }
            }
            if (!options.length) {
                return;
            }

            this.setLevelOption(level, options);
        },

        renderClear: function (level) {
            var me = this;
            this.dom.dialogItems.find('[data-option-level]').each(function (i, o) {
                var lev = parseInt($(o).attr('data-option-level'));
                if (lev >= level) {
                    if (!me.opt.fixedLevel) {
                        $(o).remove();
                    } else {
                        $(o).find('[data-options]').html('').css('top', 0);
                    }
                }
            });
        },

        setLevelOption: function (level, options) {

            var $container = this.dom.dialogItems.find('[data-option-level=' + level + ']');
            if (!$container.length) {
                $container = $([
                    '<div data-option-level="', level, '">',
                    '   <div class="html-multi-selector-gallery" data-options></div>',
                    '   <div class="html-multi-selector-grid" data-grid></div>',
                    '</div>'
                ].join(''));
                this.dom.dialogItems.append($container);
            }

            var html = [];
            html.push('<div data-value="">' + this.opt.lang.pleaseSelect + '</div>');
            for (var i = 0; i < options.length; i++) {
                html.push('<div data-value="' + options[i].value + '">' + options[i].title + '</div>');
            }
            $container.find('[data-options]').html(html.join(''));

        },

        getLevelValue: function (level) {
            var $container = this.dom.dialogItems.find('[data-option-level=' + level + ']');
            if (!$container.length) {
                return null;
            }
            var $options = $container.find('[data-options]');
            var $valueOption = $options.find('[data-value][data-selected]');
            if (!$valueOption.length) {
                return null;
            }
            return $valueOption.attr('data-value');
        },

        setLevelValue: function (level, value) {
            var $container = this.dom.dialogItems.find('[data-option-level=' + level + ']');
            if (!$container.length) {
                return;
            }
            var $options = $container.find('[data-options]');
            var $valueOption = $options.find('[data-value="' + value + '"]');
            if (!$valueOption.length) {
                return;
            }
            var index = $options.find('[data-value]').index($valueOption);

            $options.find('[data-value]').removeAttr('data-selected');
            $($options.find('[data-value]').get(index)).attr('data-selected', true);
            $options.css({top: (-(index * this.opt.optionItemHeightInEm)) + 'em'});

        },

        setLevelTitle: function (level, title) {
            var $container = this.dom.dialogItems.find('[data-option-level=' + level + ']');
            if (!$container.length) {
                return;
            }
            var $options = $container.find('[data-options]');
            var $valueOption = null;
            $options.find('[data-value]').each(function (i, o) {
                if ($(o).text() == title) {
                    $valueOption = $(o);
                }
            });
            if (!$valueOption) {
                return;
            }
            var index = $options.find('[data-value]').index($valueOption);

            $options.find('[data-value]').removeAttr('data-selected');
            $($options.find('[data-value]').get(index)).attr('data-selected', true);
            $options.css({top: (-(index * this.opt.optionItemHeightInEm)) + 'em'});

        },

        close: function () {
            this.dom.dialog.hide();
            if (this.opt.callback.close) {
                this.opt.callback.close.call(this);
            }
        },

        open: function () {
            this.dom.dialog.show();
        },

        done: function () {
            this.dom.dialog.hide();
            if (this.opt.callback.done) {
                this.opt.callback.done.call(this);
            }
        },

        val: function (value) {
            var me = this;
            if (undefined == value) {
                return me.data.value;
            }

            var initValues = value;
            if (!initValues.length) {
                me.render(1, me.opt.rootParentValue);
                return;
            }

            var initRender = function () {
                me.render(1, me.opt.rootParentValue);
                for (var i = 0; i < initValues.length; i++) {
                    var lev = i + 1, val = initValues[i];
                    me.setLevelValue(lev, val);
                    if (me.opt.maxLevel == 0 || lev + 1 <= me.opt.maxLevel) {
                        me.render(lev + 1, val);
                    }
                }

                me.syncVal();
            };

            if (me.opt.dynamic) {
                var postParentValues = [me.opt.rootParentValue];
                postParentValues = postParentValues.concat(initValues);
                me.sendAsyncRequest(postParentValues.join(me.opt.seperator), function (data) {
                    me.data.items = data;
                    initRender();
                });
            } else {
                initRender();
            }


        },

        titleVal: function (titleValue) {
            var me = this;
            if (undefined == titleValue) {
                return me.data.title;
            }

            var initTitles = titleValue;
            if (!initTitles.length) {
                me.render(1, me.opt.rootParentValue);
                return;
            }

            var initRender = function () {
                me.render(1, me.opt.rootParentValue);

                for (var i = 0; i < initTitles.length; i++) {
                    var lev = i + 1, tit = initTitles[i];
                    me.setLevelTitle(lev, tit);
                    if (me.opt.maxLevel == 0 || lev + 1 <= me.opt.maxLevel) {
                        me.render(lev + 1, me.getLevelValue(lev));
                    }
                }

                me.syncVal();
            };

            if (me.opt.dynamic) {
                me.sendAsyncRequest(null, function (data) {
                    me.data.items = data;
                    initRender();
                }, initTitles.join(me.opt.seperator));
            } else {
                initRender();
            }

        },

        syncVal: function () {
            var me = this;

            me.dom.container.find('[data-value]').val('');
            me.dom.container.find('[data-title]').val('');

            var values = [];
            var titles = [];

            me.dom.dialogItems.find('[data-option-level]').each(function (i, o) {
                var $option = $(o).find('[data-value][data-selected]');
                var value = $option.attr('data-value');
                if (!value) {
                    return;
                }
                values.push(value);
                titles.push($option.html());
            });

            me.data.value = values;
            me.data.title = titles;

            me.dom.container.find('[data-value]').each(function (i, o) {
                var lev = $(o).attr('data-for-level');
                if (lev) {
                    lev = parseInt(lev);
                    if (lev <= values.length) {
                        $(o).val(values[lev - 1]);
                    }
                } else {
                    $(o).val(values.join(me.opt.seperator));
                }
            });
            me.dom.container.find('[data-title]').each(function (i, o) {
                var lev = $(o).attr('data-for-level');
                if (lev) {
                    lev = parseInt(lev);
                    if (lev <= titles.length) {
                        $(o).val(titles[lev - 1]);
                    }
                } else {
                    $(o).val(titles.join(me.opt.seperator));
                }
            });

            if (me.opt.callback.change) {
                me.opt.callback.change.call(this, values, titles);
            }

        }
    };

    if (typeof module !== 'undefined' && typeof exports === 'object' && define.cmd) {
        module.exports = HtmlMultiSelector;
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return HtmlMultiSelector;
        });
    } else {
        this.HtmlMultiSelector = HtmlMultiSelector;
    }

}).call(function () {
    return this || (typeof window !== 'undefined' ? window : global);
}());

