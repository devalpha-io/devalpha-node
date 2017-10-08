import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED
} from '../constants'

let orderIdCounter = 0

/**
 * Creates a broker middleware to be used when running backtests.
 * In contrast to the realtime broker middleware, this middleware both places and fills an order
 * in one cycle. This makes it possible to simulate what would happen if we always were able to
 * perform our transactions at the historical date and time.
 * 
 * @param  {number|function} commission Calculate the commission based on price and quantity
 * @return {function} Middleware
 */
export default function createBrokerBacktest(commission = 0) {
  return (store) => {
    const calculateCommission = typeof commission === 'function' ? commission : () => commission
    return (next) => async (action) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        const requestedOrder = { ...action.payload }

        if (typeof requestedOrder.price === 'undefined') {
          store.dispatch({ type: ORDER_FAILED, payload: new Error('market orders not supported when backtesting') })
          break
        }
        if (typeof requestedOrder.quantity === 'undefined') {
          store.dispatch({ type: ORDER_FAILED, payload: new Error('missing order quantity') })
          break
        }

        requestedOrder.commission = calculateCommission(requestedOrder)


        store.dispatch({ type: ORDER_CREATED, payload: requestedOrder })
        break
      }
      case ORDER_CREATED: {
        const order = { ...action.payload }
        orderIdCounter += 1
        store.dispatch({ type: ORDER_PLACED, payload: { ...order, id: orderIdCounter } })
        store.dispatch({
          type: ORDER_FILLED,
          payload: {
            ...order,
            expectedPrice: order.price,
            expectedQuantity: order.quantity,
            expectedCommission: order.commission
          }
        })
        break
      }
      default:
        break
      }
      return next(action)
    }
  }
}
