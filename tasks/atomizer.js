/*jshint node: true */

'use strict';

var atomizer = require('atomizer').atomizer;

module.exports = function (grunt) {

    grunt.registerMultiTask('atomizer', 'Grunt plugin to execute Atomizer', function () {
        var done = this.async();
        var options = this.options();

        if (options.require && options.require.length > 0) {
            options.require = grunt.file.expand(options.require);
        }

        this.files.forEach(function (f) {
            atomizer(f.src, options, f.dest, done);
        });

    });
};
