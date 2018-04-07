"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../constants");
function createStrategy(strategy) {
    return function (store) { return function (next) { return function (action) {
        next(action);
        return strategy({
            state: function () { return store.getState().toJS(); },
            order: function (payload) { return store.dispatch({
                type: constants_1.ORDER_REQUESTED,
                payload: __assign({ timestamp: action.payload.timestamp }, payload)
            }); },
            cancel: function (id) { return store.dispatch({
                type: constants_1.ORDER_CANCEL,
                payload: {
                    timestamp: action.payload.timestamp,
                    id: id
                }
            }); }
        }, action);
    }; }; };
}
exports.default = createStrategy;
