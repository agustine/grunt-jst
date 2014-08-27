/*
 * grunt-contrib-jst
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Tim Branyen, contributors
 * Licensed under the MIT license.
 */

'use strict';
var _ = require('lodash');
var chalk = require('chalk');
var path = require('path');

module.exports = function (grunt) {


    grunt.registerMultiTask('jst', 'Compile underscore templates to JST file', function () {
        var lf = grunt.util.linefeed;
        var lib = require('./lib/jst');
        var files = this.files;
        var file = grunt.file;
        var options = this.options({
            namespace: 'JST',
            amd: false,
            cmd: false,
            processTemplateName: function(fileName){
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
            },
            separator: lf + lf
        });

        var nsInfo;
        if (options.namespace !== false) {
            nsInfo = lib.getNamespaceDeclaration(options.namespace);
        }

        files.forEach(function(f){
            var completed = [];
            var output = [];
            var dest = f.dest;
            f.src.forEach(function(filePath){
                var templateName = options.processTemplateName(filePath);

                var sourceContent;
                var imported = [];
                // Warn on and remove invalid source files (if nonull was set).
                if (!file.exists(filePath)) {
                    grunt.log.warn('Source file ' + chalk.cyan(filePath) + ' not found.');
                    return;
                }

                if(_.contains(completed, templateName)){
                    grunt.log.warn('More then one templates are processed as same template name ' + chalk.cyan(templateName));
                    return;
                }

                function importPartial(filePath){
                    var src = options.processContent(file.read(filePath));
                    var dirPath = path.dirname(filePath);
                    if(_.contains(imported, filePath)){
                        grunt.log.warn('An infinite loop may occur in importing partial template (' + chalk.cyan(filePath) + ')');
                        return ''
                    }
                    imported.push(filePath);
                    if(!options.templateSettings.partial.test(src)){
                        return src;
                    }

                    src.replace(options.templateSettings.partial, function(s, partialPath){
                        partialPath = path.resolve(dirPath, partialPath);
                        if (!file.exists(partialPath)) {
                            grunt.log.warn('Partial template source file ' + chalk.cyan(partialPath) + ' not found.');
                            return '';
                        }
                        return importPartial(partialPath);
                    });
                }

                sourceContent = templateName + ': ' + _.template(importPartial(filePath);
                if(options.prettify){
                    sourceContent = sourceContent.replace(/\n/g, '');;
                }
                try {
                    output.push(sourceContent, false, options.templateSettings).source);
                    completed.push(templateName);
                } catch (e) {
                    grunt.log.error(e);
                    grunt.fail.warn('JST ' + chalk.cyan(filepath) + ' failed to compile.');
                }

            });

            nsInfo.namespace + ' = ' +
        });

        files.forEach(function (f) {
            var output = f.src.filter(function (filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!file.exists(filepath)) {
                    grunt.log.warn('Source file ' + chalk.cyan(filepath) + ' not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function (filepath) {
                var src = options.processContent(file.read(filepath));
                var compiled, filename;

                try {
                    compiled = _.template(src, false, options.templateSettings).source;
                } catch (e) {
                    grunt.log.error(e);
                    grunt.fail.warn('JST ' + chalk.cyan(filepath) + ' failed to compile.');
                }

                if (options.prettify) {
                    compiled = compiled.replace(/\n/g, '');
                }
                filename = processName(filepath);

                if (options.amd && options.namespace === false) {
                    return 'return ' + compiled;
                }
                return nsInfo.namespace + '[' + JSON.stringify(filename) + '] = ' + compiled + ';';
            });

            if (output.length < 1) {
                grunt.log.warn('Destination not written because compiled files were empty.');
            } else {
                if (options.namespace !== false) {
                    output.unshift(nsInfo.declaration);
                }
                if (options.amd) {
                    if (options.prettify) {
                        output.forEach(function (line, index) {
                            output[index] = "  " + line;
                        });
                    }
                    output.unshift("define(function(){");
                    if (options.namespace !== false) {
                        // Namespace has not been explicitly set to false; the AMD
                        // wrapper will return the object containing the template.
                        output.push("  return " + nsInfo.namespace + ";");
                    }
                    output.push("});");
                }
                file.write(f.dest, output.join(grunt.util.normalizelf(options.separator)));
                grunt.log.writeln('File ' + chalk.cyan(f.dest) + ' created.');
            }
        });

    });
};
