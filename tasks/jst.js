'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var path = require('path');
var esformatter = require('esformatter');

module.exports = function (grunt) {
    grunt.registerMultiTask('jst', 'Compile underscore templates to JST file', function () {
        var lib = require('./lib/jst');
        var files = this.files;
        var file = grunt.file;
        var options = this.options({
            namespace: 'JST',
            amd: false,
            cmd: false,
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
            },
            underscore: false,
            charset: 'utf-8'
        });

        var nsInfo;
        if (options.namespace !== false) {
            nsInfo = lib.getNamespaceDeclaration(options.namespace);
        }

        files.forEach(function (f) {
            var completed = [];
            var output = [];
            var destSource;
            var dest = f.dest;
            f.src.forEach(function (filePath) {
                var templateName = options.processTemplateName(filePath);
                if(!templateName){
                    return;
                }
                var sourceContent;
                var imported = [];
                // Warn on and remove invalid source files (if nonull was set).
                if (!file.exists(filePath)) {
                    grunt.log.warn('Source file ' + chalk.cyan(filePath) + ' not found.');
                    return;
                }

                if (_.contains(completed, templateName)) {
                    grunt.log.warn('More then one templates are processed as same template name ' + chalk.cyan(templateName));
                    return;
                }

                function importPartial(filePath) {
                    var src = options.processContent(file.read(filePath, {encoding: options.charset}));
                    var dirPath = path.dirname(filePath);
                    if (_.contains(imported, filePath)) {
                        grunt.log.warn('An infinite loop may occur in importing partial template (' + chalk.cyan(filePath) + ')');
                        return ''
                    }
                    imported.push(filePath);
                    if (!options.templateSettings.partial.test(src)) {
                        return src;
                    }

                    src = src.replace(options.templateSettings.partial, function (s, partialPath) {
                        partialPath = path.resolve(dirPath, partialPath);
                        if (!file.exists(partialPath)) {
                            grunt.log.warn('Partial template source file ' + chalk.cyan(partialPath) + ' not found.');
                            return '';
                        }
                        return importPartial(partialPath);
                    });
                    return src;
                }

                sourceContent = templateName + ': ' + _.template(
                    importPartial(filePath), false, options.templateSettings);

                try {
                    output.push(sourceContent);
                    completed.push(templateName);
                } catch (e) {
                    grunt.log.error(e);
                    grunt.fail.warn('JST ' + chalk.cyan(filepath) + ' failed to compile.');
                }

            });


            if (options.cmd) {
                destSource = 'define(function(require, exports, module) {\n ';
                if (options.underscore) {
                    destSource += 'var _ = require(\'' + options.underscore + '\'); \n';
                }
                destSource += ' module.exports = {\n' + output.join(',\n') + '\n};\n});';
            } else if (options.amd) {
                destSource = 'define(function(){\n ';
                if (options.underscore) {
                    destSource = 'define([\'' + options.underscore + '\'], function(_){';
                }
                destSource += ' return {\n' + output.join(',\n') + '\n};\n});';
            } else {
                destSource = nsInfo.declaration + '\n';
                destSource += nsInfo.namespace + ' = {\n';
                destSource += output.join(',\n');
                destSource += '\n}';
            }


            destSource = esformatter.format(destSource, {
                indent: {
                    value: '    '
                }
            });
            file.write(dest, destSource, {encoding: options.charset});
            grunt.log.writeln('File ' + chalk.cyan(f.dest) + ' created.');
        });
    });
};
