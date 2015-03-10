/*
 * Copyright (c) 2015, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

"use strict";

module.exports = {
    main: {
        _skip: [
            /^tests?\b/i,
            /^grunt?\b/i,
            /^artifacts\b/i
        ],
        atomizer: {
            regex: /(atomizer)\.json$/i
        }
    }
};
