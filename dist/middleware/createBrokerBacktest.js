"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
let orderIdCounter = 0;
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
function createBrokerBacktest(commission = 0) {
    return (store) => {
        const calculateCommission = typeof commission === 'function' ? commission : () => commission;
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
                    requestedOrder.commission = calculateCommission(requestedOrder);
                    store.dispatch({ type: constants_1.ORDER_CREATED, payload: requestedOrder });
                    break;
                }
                case constants_1.ORDER_CREATED: {
                    const order = Object.assign({}, action.payload);
                    orderIdCounter += 1;
                    store.dispatch({ type: constants_1.ORDER_PLACED, payload: Object.assign({}, order, { id: orderIdCounter.toString() }) });
                    store.dispatch({
                        type: constants_1.ORDER_FILLED,
                        payload: Object.assign({}, order, { id: orderIdCounter.toString(), expectedPrice: order.price, expectedQuantity: order.quantity, expectedCommission: order.commission })
                    });
                    break;
                }
                default:
                    break;
            }
            return next(action);
        };
    };
}
exports.default = createBrokerBacktest;
