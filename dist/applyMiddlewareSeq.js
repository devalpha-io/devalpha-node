"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store, and buffers actions until all middlewares are finished processing
 * the action. This should be the first store enhancer in the composition chain.
 *
 * @param {...function} middlewares The chain of middlewares to be applied.
 * @returns {function} A store enhancer applying the middleware.
 */
function applyMiddlewareSeq(stream, middlewares = []) {
    return (createStore) => (reducer, preloadedState, enhancer) => {
        let running = false;
        const store = createStore(reducer, preloadedState, enhancer);
        const chain = middlewares.map(middleware => middleware({
            getState: store.getState,
            dispatch
        }));
        const composed = redux_1.compose(...chain)((action) => {
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
        return Object.assign({}, store, { dispatch });
    };
}
exports.default = applyMiddlewareSeq;
