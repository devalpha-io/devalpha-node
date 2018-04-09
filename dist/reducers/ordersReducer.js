"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const initialState = {};
function ordersReducer(state = initialState, action) {
    switch (action.type) {
        case constants_1.INITIALIZED: {
            // TODO validate supplied data
            if (action.payload.initialStates.orders) {
                const initial = action.payload.initialStates.orders;
                state = Object.assign({}, state, initial);
            }
            break;
        }
        case constants_1.ORDER_PLACED: {
            const order = action.payload;
            state[order.id] = order;
            break;
        }
        case constants_1.ORDER_FILLED: {
            const order = action.payload;
            // @todo: Check if partially filled as well
            delete state[order.id];
            break;
        }
        case constants_1.ORDER_CANCELLED: {
            const { id } = action.payload;
            delete state[id];
            break;
        }
        default: {
            break;
        }
    }
    return Object.assign({}, state);
}
exports.ordersReducer = ordersReducer;
