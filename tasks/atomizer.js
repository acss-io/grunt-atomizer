/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

'use strict';

var atomizer = require('atomizer');
var rules = require('atomizer/src/rules');
var path = require('path');
var _ = require('lodash');

module.exports = function (grunt) {


    /**
     * Look for atomic class names in text.
     * @param  {string} src The text to be parsed.
     * @return {array}      An array of class names.
     */
    function findAtomicClasses(src) {
        var match = atomicRegex.exec(src);
        var classNames = [];
        while (match !== null) {
            grunt.verbose.writeln('Found atomic class: ' + match[0]);
            classNames.push(match[0]);
            match = atomicRegex.exec(src);
        }
        return classNames;
    }

    /**
     * Get an atomic config rule given an atomic class name
     * @param  {string} className     An atomic class name
     * @param  {object} currentConfig The current config.
     * @return {object}               The config rule for the given class name.
     */
    function getConfigRule(className, currentConfig) {
        var sepIndex = className.indexOf('-') + 1;
        var prefix = '.' + className.substring(0, sepIndex);
        var suffix = className.substring(sepIndex);
        var configRule = {};

        // iterate rules to find the pattern that the className belongs to
        rules.some(function (pattern) {
            var patternRulesLength = 0;
            // filter to the prefix we're looking for
            if (pattern.prefix === prefix) {
                configRule[pattern.id] = {};
                // if the pattern has rules, let's find the suffix
                if (pattern.rules) {
                    patternRulesLength = pattern.rules.length;
                    pattern.rules.some(function (rule, index) {
                        // found the suffix, place it in the config
                        if (rule.suffix === suffix) {
                            configRule[pattern.id][suffix] = true;
                            return true;
                        }
                        // it's a custom suffix
                        else if (patternRulesLength === index + 1) {
                            if (pattern.allowSuffixToValue) {
                                if (!configRule[pattern.id].custom) {
                                    configRule[pattern.id].custom = [];
                                }
                                configRule[pattern.id].custom.push({
                                    suffix: suffix,
                                    values: [suffix]
                                });
                            } else {
                                if (!currentConfig[pattern.id] || !currentConfig[pattern.id].custom) {
                                    grunt.log.warn('Class `' + className + '` should be manually added to the config file:');
                                    grunt.log.writeln('\'' + pattern.id + '\'' + ':' + '{');
                                    grunt.log.writeln('    custom: [');
                                    grunt.log.writeln('        {suffix: \'' + suffix + '\', values: [\'YOUR-CUSTOM-VALUE\']}');
                                    grunt.log.writeln('    ]');
                                    grunt.log.writeln('}');
                                    return;
                                }
                                currentConfig[pattern.id].custom.some(function (custom) {
                                    if (custom.suffix !== suffix) {
                                        grunt.log.warn('Class `' + className + '` should be manually added to the config file:');
                                        grunt.log.writeln('\'' + pattern.id + '\'' + ':' + '{');
                                        grunt.log.writeln('    custom: [');
                                        grunt.log.writeln('        {suffix: \'' + suffix + '\', values: [\'YOUR-CUSTOM-VALUE\']}');
                                        grunt.log.writeln('    ]');
                                        grunt.log.writeln('}');
                                        return true;
                                    }
                                });
                            }
                            return true;
                        }
                    });
                }
                // no pattern.rules, then it's a custom suffix
                else {
                    if (!configRule[pattern.id].custom) {
                        configRule[pattern.id].custom = [];
                    }
                    if (pattern.allowSuffixToValue) {
                        configRule[pattern.id].custom.push({
                            suffix: suffix,
                            values: [suffix]
                        });
                    }  else {
                        if (!currentConfig[pattern.id] || !currentConfig[pattern.id].custom) {
                            grunt.log.warn('Class `' + className + '` should be manually added to the config file:');
                            grunt.log.writeln('\'' + pattern.id + '\'' + ':' + '{');
                            grunt.log.writeln('    custom: [');
                            grunt.log.writeln('        {suffix: \'' + suffix + '\', values: [\'YOUR-CUSTOM-VALUE\']}');
                            grunt.log.writeln('    ]');
                            grunt.log.writeln('}');
                            return;
                        }
                        currentConfig[pattern.id].custom.some(function (custom) {
                            if (custom.suffix !== suffix) {
                                grunt.log.warn('Class `' + className + '` should be manually added to the config file:');
                                grunt.log.writeln('\'' + pattern.id + '\'' + ':' + '{');
                                grunt.log.writeln('    custom: [');
                                grunt.log.writeln('        {suffix: \'' + suffix + '\', values: [\'YOUR-CUSTOM-VALUE\']}');
                                grunt.log.writeln('    ]');
                                grunt.log.writeln('}');
                                return true;
                            }
                        });
                    }
                }
                return true;
            }
        });

        return configRule;
    }

    /**
     * Get config object given an array of atomic class names.
     * @param  {array}  classNames      An array of atomic class names
     * @param  {object} currentConfig   The current config.
     * @return {object}                 The atomic config object.
     */
    function getConfig(classNames, currentConfig) {
        var config = {};
        classNames.forEach(function (className) {
            config = _.merge(config, getConfigRule(className, currentConfig));
        });
        return config;
    }

    function validateConfig(config, configObjPath) {
        if (grunt.util.kindOf(config) !== 'object') {            
            grunt.fail.warn('`' + configObjPath + '` must be an object.');
        }
        if (!config.config || grunt.util.kindOf(config.config) !== 'object') {
            grunt.fail.warn('If `' + configObjPath + '` has been passed, it must be an object.');
        }
        if (!config.config.namespace || grunt.util.kindOf(config.config.namespace) !== 'string') {
            grunt.fail.warn('`' + configObjPath + '.config.namespace` is required and must be a string.');
        }
        if (!config.config.end || grunt.util.kindOf(config.config.end) !== 'string') {
            grunt.fail.warn('`' + configObjPath + '.config.end` is required and must be a string.');
        }
        if (config.config.end !== 'left' && config.config.end !== 'right') {
            grunt.fail.warn('`' + configObjPath + '.config.end` must be either `left` or `right`.');
        }
        if (!config.config.start || grunt.util.kindOf(config.config.end) !== 'string') {
            grunt.fail.warn('`' + configObjPath + '.config.start` is required and must be a string.');
        }
        if (config.config.start !== 'left' && config.config.start !== 'right') {
            grunt.fail.warn('`' + configObjPath + '.config.start` must be either `left` or `right`.');
        }
    }

    /**
     * Escapes special regular expression characters
     * @param  {string} str The regexp string.
     * @return {string}     The escaped regexp string.
     */
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    /**
     * Returns a regular expression with atomic classes based on the rules from atomizer.
     * Making it as a function for better separation (code style).
     * @return {RegExp} The regular expression containing the atomic classes.
     */
    function getAtomicRegex() {
        var regexes = [];

        rules.forEach(function (pattern) {
            var prefix = pattern.prefix || '';
            prefix = prefix.replace('.', '');

            if (pattern.rules) {
                pattern.rules.forEach(function (rule) {
                    regexes.push(escapeRegExp(prefix.replace('.','') + rule.suffix) + '\\b');
                });
            } else {
                // custom-only patterns with no rules
            }
            if (pattern.prefix) {
                regexes.push(escapeRegExp(prefix) + '(?:neg)?[0-9]+(?:[a-zA-Z%]+)?');
            }
        });
        return new RegExp('(' + regexes.join('|') + ')', 'g');
    }
    var atomicRegex = getAtomicRegex();

    /**
     * TASKS
     */
    grunt.registerMultiTask('atomizer', 'Grunt plugin to execute Atomizer given a config file', function () {
        var done = this.async();
        var options = this.options({
            configFile: null,
            config: null
        });
        var gruntConfig = {}; // the config if passed directly via the grunt task
        var configFile;


        if (options.require && options.require.length > 0) {
            options.require = grunt.file.expand(options.require);
        }

        if (!options.configFile && !options.config) {
            grunt.fail.warn('`options.config` or `options.configFile` is required.');
        }

        if (options.configFile) {
            configFile = require(path.resolve(options.configFile));
            validateConfig(configFile, 'options.configFile');
            gruntConfig = _.clone(configFile, true);
        }

        if (options.config) {
            validateConfig(options.config, 'options.config');
            gruntConfig = _.merge(gruntConfig, options.config);
        }

        this.files.forEach(function (f) {
            var allClassNames = [];
            var config;
            var content;

            if (f.src) {
                f.src.forEach(function (filePath) {
                    var src = grunt.file.read(filePath);
                    allClassNames = allClassNames.concat(findAtomicClasses(src));
                });

                allClassNames = _.uniq(allClassNames);
            }

            // get the config object given an array of atomic class names
            config = getConfig(allClassNames, gruntConfig);

            // merge the config we have with the grunt config
            config = _.merge(config, gruntConfig);

            // run atomizer with the config we got
            content = atomizer(config, options);

            // write file
            grunt.file.write(f.dest, content);

            grunt.log.oklns('File ' + f.dest + ' successfully created.');
        });

        done();
    });
};
