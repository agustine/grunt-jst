grunt-jst
=========

参考<a href="https://github.com/gruntjs/grunt-contrib-jst">grunt-contrib-jst</a>
把underscore模版编译为jst的gruntjs任务插件，<strong style="color:#FF0000;">并支持模版嵌套，增加cmd包装器支持</strong>

##安装配置说明
###安装:
    npm install grunt-jst

###Gruntfile配置示例

    jst: {
        compile: {
            options: {
                namespace:'JST',
                cmd: false,
                amd: false,
                underscore:'vendor/underscore',
                charset: 'utf-8',
                processTemplateName: function (fileName) {
                    var extName = path.extname(fileName);
                    return path.basename(fileName, extName);
                },
                templateSettings: {
                    evaluate: /<%([\s\S]+?)%>/g,
                    interpolate: /<%=([\s\S]+?)%>/g,
                    escape: /<%-([\s\S]+?)%>/g,
                    partial: /<%@([\s\S]+?)%>/g
                },
                processContent: function (src) {
                    return src;
                }
            },
            files: {
                "js/templates.js": ["tpl/*.html"]
            }
        }
    }
    
###选项说明

####namespace
类型: String <br />
默认值: 'JST' <br />
说明: 所有template方法的namespace，'amd'或者'cmd' 为true 时无效
例如设置为 'MyApp.JST',生成代码如下：

    this["MyApp"] = this["MyApp"] || {};
    this["MyApp"]["JST"] = this["MyApp"]["JST"] || {};
    this["MyApp"]["JST"] = {
        template1: function(){
         ...
        },
        template2: function(){
         ...
        }
    }
####charset
类型: String <br />
默认值: 'utf-8' <br />
说明: 所有template文件的字符集编码


####processTemplateName
类型: Function <br />
默认值: 

    function (fileName) {
        var extName = path.extname(fileName);
        return path.basename(fileName, extName);
    } 
    
说明: 由template文件的名称转换为template方法名的转换方法，如果返回空字符串则该template不生成（例如内嵌的模版）。
在多级文件夹下，可能会有不同目录的文件重名可能，如果直接用文件名作为方法名就会重名报错，该方法用来解决这个问题。
请保证所有template source文件路径通过这个方面可以被转换成唯一的方法名
同时可以通过这个方法筛选不用生成template source 文件， 例如：
定义所有文件名以 “_”开头的文件，作为内部模版，只用来嵌入到其他模版中，则这些文件不被生成，可以使用如下方法：

    function (fileName) {
        var extName = path.extname(fileName);
        var funcName = path.basename(fileName, extName);
        return funcName[0] === '_' ? '' : funcName;
    },
    
####processContent
类型: Function <br />
默认值: 

    function (src) {
        return src;
    }
    
说明：对模版内容文本做转换
    

####templateSettings
类型: Object <br />
默认值: 

    {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g,
        partial: /<%@([\s\S]+?)%>/g
    }

说明: 所有template文件匹配串正则，前3项参考underscore的template方法，最后一项为嵌套模版语法<%@./test.html%> ，支持 ../ 及 ./ 路径转换

####cmd
类型: Boolean <br />
默认值: false <br />
说明: 是否使用cmd规范的模块化包装器，如果为true，则amd与namespace属性无效

####amd
类型: Boolean <br />
默认值: false <br />
说明: 是否使用amd规范的模块化包装器，如果cmd为true，此属性无效，如果本属性为true则namespace属性无效

####underscore
类型: String <br />
默认值: '' <br />
说明: 比如设置为'./underscore'，cmd规范中生成代码：
 
    define(function(require, exports, module) {
        var _ = require('./underscore');
        module.exports = {
            template1: function(){
             ...
            },
            template2: function(){
             ...
            }
        };
    });
    
amd规范则生成：

    define(['./underscore'], function(_){
        return {
            template1: function(){
                ...
            },
            template2: function(){
                ...
            }
        };
    });

