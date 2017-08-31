import { buildLimitOrder } from '../util/orders'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED
} from '../constants'

let orderIdCounter = 0

export default function createBrokerBacktest(commission = 0) {
  return (store) => {
    const calculateCommission = typeof commission === 'function' ? commission : () => commission
    return (next) => async (action) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        // TODO: Build order
        // TODO: Check that we can place the order (ORDER_EVALUATED?)
        const requestedOrder = { ...action.payload }
        const paidCommission = calculateCommission(requestedOrder)
        const builtOrder = buildLimitOrder(requestedOrder, paidCommission)
        store.dispatch({ type: ORDER_CREATED, payload: builtOrder })
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
