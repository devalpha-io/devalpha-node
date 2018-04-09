"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
function createStrategy(strategy) {
    return (store) => (next) => (action) => {
        next(action);
        return strategy({
            state: () => store.getState(),
            order: (order) => store.dispatch({
                type: constants_1.ORDER_REQUESTED,
                payload: Object.assign({ timestamp: action.payload.timestamp }, order)
            }),
            cancel: (id) => store.dispatch({
                type: constants_1.ORDER_CANCEL,
                payload: {
                    timestamp: action.payload.timestamp,
                    id
                }
            })
        }, action);
    };
}
exports.default = createStrategy;
