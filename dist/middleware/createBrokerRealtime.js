"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
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
    return (store) => {
        const client = createClient({
            onFill: (order) => store.dispatch({ type: constants_1.ORDER_FILLED, payload: order })
        });
        return (next) => (action) => {
            switch (action.type) {
                case constants_1.ORDER_REQUESTED: {
                    const requestedOrder = Object.assign({}, action.payload);
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
                    client.executeOrder(Object.assign({}, action.payload)).then((res) => {
                        const executedOrder = res;
                        store.dispatch({ type: constants_1.ORDER_PLACED, payload: Object.assign({}, executedOrder) });
                    }).catch((error) => {
                        store.dispatch({ type: constants_1.ORDER_FAILED, payload: error });
                    });
                    break;
                }
                case constants_1.ORDER_CANCEL: {
                    client.cancelOrder(Object.assign({}, action.payload)).then((res) => {
                        const id = res;
                        const cancelledOrder = store.getState().orders[id];
                        store.dispatch({ type: constants_1.ORDER_CANCELLED, payload: Object.assign({}, cancelledOrder) });
                    }).catch((error) => {
                        store.dispatch({ type: constants_1.ORDER_FAILED, payload: error });
                    });
                    break;
                }
                default:
                    break;
            }
            next(action);
        };
    };
}
exports.default = createBrokerRealtime;
