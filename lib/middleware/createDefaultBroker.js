import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCELLED
} from '../constants'

export default function createDefaultBroker(client) {
  return (store) => {
    client.onFill(order => store.dispatch({ type: ORDER_FILLED, payload: order }))
    client.onFail(order => store.dispatch({ type: ORDER_FAILED, payload: order }))
    client.onCancel(order => store.dispatch({ type: ORDER_CANCELLED, payload: order }))

    return (next) => async (action) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        // TODO: Build order
        // TODO: Check that we can place the order (ORDER_EVALUATED?)

        const requestedOrder = { ...action.payload }
        const paidCommission = client.calculateCommission(requestedOrder)
        store.dispatch({ type: ORDER_CREATED, payload: { ...requestedOrder, commission: paidCommission } })
        break
      }
      case ORDER_CREATED: {
        const executedOrder = await client.executeOrder({ ...action.payload })
        store.dispatch({ type: ORDER_PLACED, payload: { ...executedOrder } })
        break
      }
      default:
        break
      }
      next(action)
    }
  }
}
