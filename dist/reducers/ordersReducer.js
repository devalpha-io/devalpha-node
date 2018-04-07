"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_1 = require("immutable");
var constants_1 = require("../constants");
var initialState = immutable_1.Map();
exports.default = (function (state, action) {
    if (state === void 0) { state = initialState; }
    switch (action.type) {
        case constants_1.INITIALIZED: {
            // TODO validate supplied data
            if (action.payload.initialStates.orders) {
                state = state.merge(initialState, action.payload.initialStates.orders);
            }
            return state;
        }
        case constants_1.ORDER_PLACED: {
            var order = action.payload;
            return state.set(order.id, order);
        }
        case constants_1.ORDER_FILLED: {
            var order = action.payload;
            // @todo: Check if partially filled as well
            return state.delete(order.id);
        }
        case constants_1.ORDER_CANCELLED: {
            var id = action.payload.id;
            return state.delete(id);
        }
        default: {
            return state;
        }
    }
});
