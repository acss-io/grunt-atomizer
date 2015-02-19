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
     * INIT CODE
     */
    
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
                regexes.push(escapeRegExp(prefix) + '[0-9a-zA-Z\\%]+\\b');
            }
        });
        return new RegExp('(' + regexes.join('|') + ')', 'g');
    }

    var atomicRegex = getAtomicRegex();

    console.log(atomicRegex);

    /**
     * TASKS
     */
    grunt.registerMultiTask('atomizer', 'Grunt plugin to execute Atomizer given a config file', function () {
        var done = this.async();
        var options = this.options();

        if (options.require && options.require.length > 0) {
            options.require = grunt.file.expand(options.require);
        }

        this.files.forEach(function (f) {
            var content = '';
            f.src.forEach(function (configFile) {
                content += atomizer(require(path.resolve(configFile)), options);
            });
            grunt.file.write(f.dest, content);
        });

        grunt.task.run('autoatomizer');

        done();
    });

    grunt.registerMultiTask('autoatomizer', 'Grunt plugin to execute Atomizer given any file by searching for atomic classes', function () {
        var done = this.async();
        var options = this.options();

        console.log('EXECUTING AUTOATOM');

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

        function getConfigRule(className) {
            var sepIndex = className.indexOf('-') + 1;
            var prefix = '.' + className.substring(0, sepIndex);
            var suffix = className.substring(sepIndex);
            var configRule = {};

            rules.some(function (pattern) {
                if (pattern.prefix === prefix) {
                    configRule[pattern.id] = {};
                    if (pattern.rules) {
                        pattern.rules.some(function (rule) {
                            if (rule.suffix === suffix) {
                                configRule[pattern.id][suffix] = true;
                                return true;
                            } else {
                                console.log(suffix);
                            }
                        });
                    }
                    return true;
                }
            });

            return configRule;
        }

        function getConfig(classNames) {
            var config = {};
            classNames.forEach(function (className) {
                config = _.merge(config, getConfigRule(className));
            });
            return config;
        }

        var allClassNames = [];
        var config;

        this.filesSrc.forEach(function(filepath) {
            var src = grunt.file.read(filepath);
            allClassNames = allClassNames.concat(findAtomicClasses(src));
        });

        allClassNames = _.uniq(allClassNames);

        config = getConfig(allClassNames);

        console.log(config);


        done();
    });
};
