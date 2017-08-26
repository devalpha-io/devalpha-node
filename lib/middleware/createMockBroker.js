import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED
} from '../constants'

export default function createMockBroker(commission = 0) {
  return (store) => {
    const calculateCommission = typeof commission === 'function' ? commission : () => commission
    return (next) => async (action) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        // TODO: Build order
        // TODO: Check that we can place the order (ORDER_EVALUATED?)
        const requestedOrder = { ...action.payload }
        const paidCommission = calculateCommission(requestedOrder)
        store.dispatch({ type: ORDER_CREATED, payload: { ...requestedOrder, commission: paidCommission } })
        break
      }
      case ORDER_CREATED: {
        const order = { ...action.payload }
        store.dispatch({ type: ORDER_PLACED, payload: { ...order } })
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
      next(action)
    }
  }
}
