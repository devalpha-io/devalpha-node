"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const initialState = new decimal_js_1.default(0);
function timestampReducer(state = initialState, action) {
    return new decimal_js_1.default(action.payload.timestamp);
}
exports.timestampReducer = timestampReducer;
