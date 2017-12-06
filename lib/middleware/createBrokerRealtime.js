import { sign } from 'mathjs'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCEL,
  ORDER_CANCELLED
} from '../constants'

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
export default function createBrokerRealtime(createClient) {
  return (store) => {

    const client = createClient({
      onFill: order => store.dispatch({ type: ORDER_FILLED, payload: order })
    })

    return (next) => async (action) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        const requestedOrder = { ...action.payload }

        if (typeof requestedOrder.price === 'undefined') {
          /* build market order */
          if (typeof requestedOrder.quantity === 'undefined') {
            store.dispatch({ type: ORDER_FAILED, payload: new Error('missing order quantity') })
            break
          }
          const { buy, sell } = await client.getMarketPrice(requestedOrder.identifier)
          const direction = sign(requestedOrder.quantity)

          if (direction === 1) {
            requestedOrder.price = buy
          } else {
            requestedOrder.price = sell
          }
        }

        requestedOrder.commission = client.calculateCommission(requestedOrder)

        store.dispatch({ type: ORDER_CREATED, payload: requestedOrder })
        break
      }
      case ORDER_CREATED: {
        try {
          const executedOrder = await client.executeOrder({ ...action.payload })
          store.dispatch({ type: ORDER_PLACED, payload: { ...executedOrder } })
        } catch (error) {
          store.dispatch({ type: ORDER_FAILED, payload: error })
        }
        break
      }
      case ORDER_CANCEL: {
        try {
          const id = await client.cancelOrder({ ...action.payload })
          const cancelledOrder = store.getState().getIn(['orders', id])
          store.dispatch({ type: ORDER_CANCELLED, payload: { ...cancelledOrder } })
        } catch (error) {
          store.dispatch({ type: ORDER_FAILED, payload: error })
        }
        break
      }
      default:
        break
      }
      return next(action)
    }
  }
}
