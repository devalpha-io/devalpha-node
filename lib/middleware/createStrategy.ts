import {
  Store,
  Strategy,
  StreamAction
} from '../typings'

import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

export function createStrategy(strategy: Strategy) {
  return (store: Store) => (next: Function) => (action: StreamAction) => {
    strategy({
      state: () => store.getState(),
      order: (order: any) => store.dispatch({
        type: ORDER_REQUESTED,
        payload: {
          timestamp: action.payload.timestamp,
          ...order
        }
      }),
      cancel: (id: string) => store.dispatch({
        type: ORDER_CANCEL,
        payload: {
          timestamp: action.payload.timestamp,
          id
        }
      })
    }, action)
    return next(action)
  }

}
