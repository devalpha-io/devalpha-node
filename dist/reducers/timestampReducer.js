"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment_1 = require("moment");
exports.default = (function (state, action) {
    if (state === void 0) { state = 0; }
    if (action.payload && typeof action.payload.timestamp !== 'undefined') {
        var timestamp = moment_1.default.unix(action.payload.timestamp);
        if (timestamp.isValid()) {
            return parseInt(timestamp.format('X'), 10);
        }
    }
    return state;
});
