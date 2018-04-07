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
var orderIdCounter = 0;
/**
 * Creates a broker middleware to be used when running backtests.
 * In contrast to the realtime broker middleware, this middleware both places and fills an order
 * in one cycle. This makes it possible to simulate what would happen if we always were able to
 * perform our transactions at the historical date and time.
 *
 * @private
 * @param  {number|function} commission Calculate the commission based on price and quantity
 * @return {function} Middleware
 */
function createBrokerBacktest(commission) {
    if (commission === void 0) { commission = 0; }
    return function (store) {
        var calculateCommission = typeof commission === 'function' ? commission : function () { return commission; };
        return function (next) { return function (action) {
            switch (action.type) {
                case constants_1.ORDER_REQUESTED: {
                    var requestedOrder = __assign({}, action.payload);
                    if (typeof requestedOrder.price === 'undefined') {
                        store.dispatch({ type: constants_1.ORDER_FAILED, payload: new Error('missing order price') });
                        break;
                    }
                    if (typeof requestedOrder.quantity === 'undefined') {
                        store.dispatch({ type: constants_1.ORDER_FAILED, payload: new Error('missing order quantity') });
                        break;
                    }
                    requestedOrder.commission = calculateCommission(requestedOrder);
                    store.dispatch({ type: constants_1.ORDER_CREATED, payload: requestedOrder });
                    break;
                }
                case constants_1.ORDER_CREATED: {
                    var order = __assign({}, action.payload);
                    orderIdCounter += 1;
                    store.dispatch({ type: constants_1.ORDER_PLACED, payload: __assign({}, order, { id: orderIdCounter.toString() }) });
                    store.dispatch({
                        type: constants_1.ORDER_FILLED,
                        payload: __assign({}, order, { id: orderIdCounter.toString(), expectedPrice: order.price, expectedQuantity: order.quantity, expectedCommission: order.commission })
                    });
                    break;
                }
                default:
                    break;
            }
            return next(action);
        }; };
    };
}
exports.default = createBrokerBacktest;
