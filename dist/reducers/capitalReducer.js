"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const constants_1 = require("../constants");
const initialState = {
    cash: new decimal_js_1.default(0),
    commission: new decimal_js_1.default(0),
    reservedCash: new decimal_js_1.default(0),
    total: new decimal_js_1.default(0)
};
function capitalReducer(state = initialState, action) {
    switch (action.type) {
        case constants_1.INITIALIZED: {
            if (action.payload.startCapital) {
                state.cash = action.payload.startCapital;
                state.total = action.payload.startCapital;
            }
            if (action.payload.initialStates.capital) {
                // TODO validate supplied data
                // TODO check that total = cash + reservedCash
                const initial = action.payload.initialStates.capital;
                state = Object.assign({}, state, initial);
            }
            return Object.assign({}, state);
        }
        case constants_1.ORDER_PLACED: {
            const order = action.payload;
            let cash;
            let reservedCash;
            if (decimal_js_1.default.sign(order.quantity).eq(1)) {
                /* cost = |price * quantity| */
                const cost = new decimal_js_1.default(order.price).mul(order.quantity).abs();
                /* reservedCash = reservedCash + cost + commission */
                reservedCash = new decimal_js_1.default(state.reservedCash).add(cost).add(order.commission);
                /* cash = cash - cost - commission */
                cash = new decimal_js_1.default(state.cash).sub(cost).sub(order.commission);
            }
            else {
                /* reservedCash = reservedCash + commission */
                reservedCash = new decimal_js_1.default(state.reservedCash).add(order.commission);
                /* cash = cash - commission */
                cash = new decimal_js_1.default(state.cash).sub(order.commission);
            }
            state.reservedCash = reservedCash;
            state.cash = cash;
            state.total = decimal_js_1.default.add(state.cash, state.reservedCash);
            return Object.assign({}, state);
        }
        case constants_1.ORDER_FILLED: {
            const order = action.payload;
            const direction = decimal_js_1.default.sign(order.quantity);
            /* adjust commission for partially filled orders */
            /* adjustedCommission = expectedCommission * quantity / expectedQuantity */
            const adjustedCommission = new decimal_js_1.default(order.expectedCommission)
                .mul(order.quantity)
                .div(order.expectedQuantity);
            if (direction.eq(1)) {
                /* order.expectedQuantity not used as we can be partially filled as well. */
                /* cost = quantity * expectedPrice + adjustedCommission */
                const cost = new decimal_js_1.default(order.quantity)
                    .mul(order.expectedPrice)
                    .add(adjustedCommission);
                /* reservedCash = reservedCash - cost */
                const reservedCash = decimal_js_1.default.sub(state.reservedCash, cost);
                state.reservedCash = reservedCash;
            }
            else {
                /* we might get filled at a higher price than expected, and thus pay higher commission */
                /* extraCommission = max(0, (commission - expectedCommission) * quantity) */
                const extraCommission = decimal_js_1.default.max(0, decimal_js_1.default.sub(order.commission, order.expectedCommission).mul(order.commission));
                /* receivedCash = |quantity * price| - extraCommission */
                const receivedCash = decimal_js_1.default.mul(order.quantity, order.price)
                    .abs()
                    .sub(extraCommission);
                /* cash = cash + receivedCash */
                const cash = decimal_js_1.default.add(state.cash, receivedCash);
                /* reservedCash = reservedCash - adjustedCommission */
                const reservedCash = decimal_js_1.default.sub(state.reservedCash, adjustedCommission);
                state.cash = cash;
                state.reservedCash = reservedCash;
            }
            /* adjust commission */
            state.commission = decimal_js_1.default.add(state.commission, order.commission);
            state.total = decimal_js_1.default.add(state.cash, state.reservedCash);
            return Object.assign({}, state);
        }
        case constants_1.ORDER_CANCELLED: {
            const cancelledOrder = action.payload;
            /* buy-side order */
            if (decimal_js_1.default.sign(cancelledOrder.quantity).eq(1)) {
                /* cost = |price * quantity| */
                const cost = decimal_js_1.default.mul(cancelledOrder.price, cancelledOrder.quantity).abs();
                /* reservedCash = reservedCash - cost - commission */
                const reservedCash = decimal_js_1.default.sub(state.reservedCash, cost).sub(cancelledOrder.commission);
                /* cash = cash + cost + commission */
                const cash = decimal_js_1.default.add(state.cash, cost).add(cancelledOrder.commission);
                state.reservedCash = reservedCash;
                state.cash = cash;
            }
            return Object.assign({}, state);
        }
        default: {
            return state;
        }
    }
}
exports.capitalReducer = capitalReducer;
