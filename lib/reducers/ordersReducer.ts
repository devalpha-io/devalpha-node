import {
  ExecutedOrder,
  StreamAction
} from '../typings'

import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED,
  INITIALIZED
} from '../constants'

export type OrdersState = {
  [key: string]: ExecutedOrder
}

const initialState = {}

export function ordersReducer (state: OrdersState = initialState, action: StreamAction) {
  switch (action.type) {

  case INITIALIZED: {
    // TODO validate supplied data
    if (action.payload.initialStates.orders) {
      const initial = action.payload.initialStates.orders
      state = { ...state, ...initial }
    }
    break
  }

  case ORDER_PLACED: {
    const order: ExecutedOrder = <ExecutedOrder> action.payload
    state[order.id] = order
    break
  }

  case ORDER_FILLED: {
    const order: ExecutedOrder = <ExecutedOrder> action.payload
    // @todo: Check if partially filled as well
    delete state[order.id]
    break
  }

  case ORDER_CANCELLED: {
    const { id } = action.payload
    delete state[id]
    break
  }

  default: {
    break
  }
  }

  return { ...state }
}
