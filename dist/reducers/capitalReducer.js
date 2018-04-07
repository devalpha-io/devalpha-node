"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_1 = require("immutable");
var mathjs_1 = require("mathjs");
var constants_1 = require("../constants");
var initialState = immutable_1.Map({
    cash: 0,
    commission: 0,
    reservedCash: 0,
    total: 0
});
exports.default = (function (state, action) {
    if (state === void 0) { state = initialState; }
    switch (action.type) {
        case constants_1.INITIALIZED: {
            if (action.payload.startCapital) {
                state = state.set('cash', action.payload.startCapital);
                state = state.set('total', action.payload.startCapital);
            }
            if (action.payload.initialStates.capital) {
                // TODO validate supplied data
                // TODO check that total = cash + reservedCash
                var initial = action.payload.initialStates.capital;
                for (var _i = 0, _a = initialState.keys(); _i < _a.length; _i++) {
                    var key = _a[_i];
                    if (typeof initial[key] !== 'undefined') {
                        state = state.mergeIn([key], initial[key]);
                    }
                }
            }
            return state;
        }
        case constants_1.ORDER_PLACED: {
            var order = action.payload;
            var cash = void 0;
            var reservedCash = void 0;
            if (mathjs_1.sign(order.quantity) === 1) {
                /* cost = |price * quantity| */
                var cost = mathjs_1.chain(mathjs_1.bignumber(order.price)).multiply(mathjs_1.bignumber(order.quantity)).abs().done();
                /* reservedCash = reservedCash + cost + commission */
                reservedCash = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('reservedCash'))).add(mathjs_1.bignumber(cost)).add(mathjs_1.bignumber(order.commission)).done());
                /* cash = cash - cost - commission */
                cash = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('cash'))).subtract(mathjs_1.bignumber(cost)).subtract(mathjs_1.bignumber(order.commission)).done());
            }
            else {
                /* reservedCash = reservedCash + commission */
                reservedCash = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('reservedCash'))).add(mathjs_1.bignumber(order.commission)).done());
                /* cash = cash - commission */
                cash = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('cash'))).subtract(mathjs_1.bignumber(order.commission)).done());
            }
            state = state.set('reservedCash', reservedCash);
            state = state.set('cash', cash);
            state = state.set('total', mathjs_1.number(mathjs_1.add(mathjs_1.bignumber(state.get('cash')), mathjs_1.bignumber(state.get('reservedCash')))));
            return state;
        }
        case constants_1.ORDER_FILLED: {
            var order = action.payload;
            var direction = mathjs_1.sign(order.quantity);
            /* adjust commission for partially filled orders */
            /* adjustedCommission = expectedCommission * quantity / expectedQuantity */
            var adjustedCommission = mathjs_1.chain(mathjs_1.bignumber(order.expectedCommission))
                .multiply(mathjs_1.bignumber(order.quantity))
                .divide(mathjs_1.bignumber(order.expectedQuantity))
                .done();
            if (direction === 1) {
                /* order.expectedQuantity not used as we can be partially filled as well. */
                /* cost = quantity * expectedPrice + adjustedCommission */
                var cost = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(order.quantity))
                    .multiply(mathjs_1.bignumber(order.expectedPrice))
                    .add(mathjs_1.bignumber(adjustedCommission))
                    .done());
                /* reservedCash = reservedCash - cost */
                var reservedCash = mathjs_1.number(mathjs_1.subtract(mathjs_1.bignumber(state.get('reservedCash')), mathjs_1.bignumber(cost)));
                state = state.set('reservedCash', reservedCash);
            }
            else {
                /* we might get filled at a higher price than expected, and thus pay higher commission */
                /* extraCommission = max(0, (commission - expectedCommission) * quantity) */
                var extraCommission = mathjs_1.chain(order.commission)
                    .subtract(order.expectedCommission)
                    .multiply(mathjs_1.bignumber(order.commission))
                    .max(0)
                    .done();
                /* receivedCash = |quantity * price| - extraCommission */
                var receivedCash = mathjs_1.chain(mathjs_1.bignumber(order.quantity))
                    .multiply(mathjs_1.bignumber(order.price))
                    .abs()
                    .subtract(extraCommission)
                    .done();
                /* cash = cash + receivedCash */
                var cash = mathjs_1.number(mathjs_1.add(mathjs_1.bignumber(state.get('cash')), mathjs_1.bignumber(receivedCash)));
                /* reservedCash = reservedCash - adjustedCommission */
                var reservedCash = mathjs_1.number(mathjs_1.subtract(mathjs_1.bignumber(state.get('reservedCash')), adjustedCommission));
                state = state.set('cash', cash);
                state = state.set('reservedCash', reservedCash);
            }
            /* adjust commission */
            state = state.set('commission', mathjs_1.number(mathjs_1.add(mathjs_1.bignumber(state.get('commission')), mathjs_1.bignumber(order.commission))));
            state = state.set('total', mathjs_1.number(mathjs_1.add(mathjs_1.bignumber(state.get('cash')), mathjs_1.bignumber(state.get('reservedCash')))));
            return state;
        }
        case constants_1.ORDER_CANCELLED: {
            var cancelledOrder = action.payload;
            /* buy-side order */
            if (mathjs_1.sign(cancelledOrder.quantity) === 1) {
                /* cost = |price * quantity| */
                var cost = mathjs_1.chain(mathjs_1.bignumber(cancelledOrder.price)).multiply(mathjs_1.bignumber(cancelledOrder.quantity)).abs().done();
                /* reservedCash = reservedCash - cost - commission */
                var reservedCash = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('reservedCash')))
                    .subtract(mathjs_1.bignumber(cost)).subtract(mathjs_1.bignumber(cancelledOrder.commission)).done());
                /* cash = cash + cost + commission */
                var cash = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('cash')))
                    .add(mathjs_1.bignumber(cost)).add(mathjs_1.bignumber(cancelledOrder.commission)).done());
                state = state.set('reservedCash', reservedCash);
                state = state.set('cash', cash);
            }
            return state;
        }
        default: {
            return state;
        }
    }
});
