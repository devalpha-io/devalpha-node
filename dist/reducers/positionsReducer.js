"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const constants_1 = require("../constants");
const initialState = {
    instruments: {},
    total: new decimal_js_1.default(0)
};
function positionsReducer(state = initialState, action) {
    switch (action.type) {
        case constants_1.INITIALIZED: {
            if (action.payload.initialStates.positions) {
                // TODO validate supplied data
                const initial = action.payload.initialStates.positions;
                state = Object.assign({}, state, initial);
            }
            break;
        }
        case constants_1.ORDER_FILLED: {
            const order = action.payload;
            const { identifier } = order;
            const direction = decimal_js_1.default.sign(order.quantity);
            /* this is a new instrument, so add it and exit early */
            if (!state.instruments[identifier]) {
                /* value = quantity * price */
                const value = decimal_js_1.default.mul(order.quantity, order.price);
                state.instruments[identifier] = {
                    quantity: order.quantity,
                    value,
                    price: order.price
                };
                return state.total = decimal_js_1.default.add(state.total, value);
            }
            let instrument = state.instruments[identifier];
            /* update average aquired price if buying */
            if (direction.eq(1)) {
                /* price =
                 *   (order.price * order.quantity + (instrument.quantity * instrument.price)) /
                 *   (instrument.quantity + order.quantity) */
                const price = decimal_js_1.default.mul(order.price, order.quantity)
                    .add(decimal_js_1.default.mul(instrument.quantity, instrument.price))
                    .div(decimal_js_1.default.add(instrument.quantity, order.quantity));
                instrument.price = price;
            }
            /* update quantity */
            /* quantity = instrument.quantity + order.quantity */
            const quantity = decimal_js_1.default.add(instrument.quantity, order.quantity);
            /* update value */
            /* value = order.price * (instrument.quantity + order.quantity) */
            const value = decimal_js_1.default.mul(order.price, decimal_js_1.default.add(instrument.quantity, order.quantity));
            const oldValue = instrument.value;
            instrument = Object.assign({}, instrument, { quantity, value });
            /* delete position and exit early if quantity is now 0 */
            if (instrument.quantity.eq(0)) {
                delete state.instruments[identifier];
                state.total = decimal_js_1.default.sub(state.total, oldValue);
                break;
            }
            state.instruments[identifier] = instrument;
            state.total = decimal_js_1.default.add(state.total, decimal_js_1.default.sub(value, oldValue));
            break;
        }
        case constants_1.BAR_RECEIVED: {
            const bar = action.payload;
            const { identifier } = bar;
            if (state.instruments[identifier]) {
                /* create a zero-value position if non-existent, then do nothing more */
                const quantity = state.instruments[identifier].quantity;
                const marketPrice = bar.close;
                const oldValue = state.instruments[identifier].value;
                /* calculate the new the value of the position */
                /* value = quantity * marketPrice */
                const value = decimal_js_1.default.mul(quantity, marketPrice);
                /* assign the new position */
                state.instruments[identifier].value = value;
                state.total = decimal_js_1.default.add(state.total, decimal_js_1.default.sub(value, oldValue));
            }
            break;
        }
        default: {
            break;
        }
    }
    return Object.assign({}, state);
}
exports.positionsReducer = positionsReducer;
