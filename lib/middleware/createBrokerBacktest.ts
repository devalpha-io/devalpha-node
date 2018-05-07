import {
  createOrderCreator
} from '../util/orders'
import {
  Store,
  StreamAction,
  Middleware,
  CreatedOrder
} from '../types'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED
} from '../constants'

let orderIdCounter = 0

/**
 * Creates a broker middleware to be used when running backtests.
 * In contrast to the realtime broker middleware, this middleware both places and fills an order
 * in one cycle. This makes it possible to simulate what would happen if we always were able to
 * perform our transactions at the historical date and time.
 *
 * @private
 * @param  {number|function} commission Calculate the commission based on price and quantity
 * @return {Middleware} Middleware to be consumed by a Consumer.
 */
export function createBrokerBacktest(commission: number | Function): Middleware {
  return (store: Store) => {

    const calculateCommission = typeof commission === 'function' ? commission : () => commission
    const createOrder = createOrderCreator(store)(calculateCommission)

    return (next: Function) => (action: StreamAction) => {
      switch (action.type) {
        case ORDER_REQUESTED: {
          const order: any = { ...action.payload }
          const createdOrder: CreatedOrder = createOrder(order)
          store.dispatch({ type: ORDER_CREATED, payload: createdOrder })
          break
        }
        case ORDER_CREATED: {
          orderIdCounter += 1

          const order = { ...action.payload }
          const id = orderIdCounter.toString()

          const placedOrder = { ...order, id }

          store.dispatch({
            type: ORDER_PLACED,
            payload: placedOrder
          })

          store.dispatch({
            type: ORDER_FILLED,
            payload: {
              placedOrder: { ...placedOrder },
              filledOrder: { ...placedOrder },
              timestamp: placedOrder.timestamp
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
