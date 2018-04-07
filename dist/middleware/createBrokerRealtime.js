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
/**
 * Creates a broker middleware to be used running backtests.
 * In contrast to the backtest broker middleware, this middleware builds an order, then dispatches
 * the built order for the next round-trip. When the built order arrives back at this middleware,
 * it is executed synchronously.
 *
 * @private
 * @param  {function} createClient Factory function for building the client to be used when sending
 * requests to an _actual_ broker.
 * @return {function} Middleware
 */
function createBrokerRealtime(createClient) {
    return function (store) {
        var client = createClient({
            onFill: function (order) { return store.dispatch({ type: constants_1.ORDER_FILLED, payload: order }); }
        });
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
                    requestedOrder.commission = client.calculateCommission(requestedOrder);
                    store.dispatch({ type: constants_1.ORDER_CREATED, payload: requestedOrder });
                    break;
                }
                case constants_1.ORDER_CREATED: {
                    client.executeOrder(__assign({}, action.payload)).then(function (res) {
                        var executedOrder = res;
                        store.dispatch({ type: constants_1.ORDER_PLACED, payload: __assign({}, executedOrder) });
                    }).catch(function (error) {
                        store.dispatch({ type: constants_1.ORDER_FAILED, payload: error });
                    });
                    break;
                }
                case constants_1.ORDER_CANCEL: {
                    client.cancelOrder(__assign({}, action.payload)).then(function (res) {
                        var id = res;
                        var cancelledOrder = store.getState().getIn(['orders', id]);
                        store.dispatch({ type: constants_1.ORDER_CANCELLED, payload: __assign({}, cancelledOrder) });
                    }).catch(function (error) {
                        store.dispatch({ type: constants_1.ORDER_FAILED, payload: error });
                    });
                    break;
                }
                default:
                    break;
            }
            next(action);
        }; };
    };
}
exports.default = createBrokerRealtime;
