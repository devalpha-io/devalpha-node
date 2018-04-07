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
var redux_1 = require("redux");
/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store, and buffers actions until all middlewares are finished processing
 * the action. This should be the first store enhancer in the composition chain.
 *
 * @private
 * @param {...function} middlewares The chain of middlewares to be applied.
 * @returns {function} A store enhancer applying the middleware.
 */
function applyMiddlewareSeq(stream, middlewares) {
    if (middlewares === void 0) { middlewares = []; }
    return function (createStore) { return function (reducer, preloadedState, enhancer) {
        var running = false;
        var store = createStore(reducer, preloadedState, enhancer);
        var chain = middlewares.map(function (middleware) { return middleware({
            getState: store.getState,
            dispatch: dispatch
        }); });
        var composed = redux_1.compose.apply(void 0, chain)(function (action) {
            store.dispatch(action);
            running = false;
        });
        function dispatch(action) {
            if (running) {
                stream.write(action);
            }
            else {
                running = true;
                composed(action);
            }
        }
        return __assign({}, store, { dispatch: dispatch });
    }; };
}
exports.default = applyMiddlewareSeq;
