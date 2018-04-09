import * as Redux from 'redux'
import {
  Strategy,
  RootState,
  StreamAction,
  Order
} from '../typings'

import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

export default function createStrategy(strategy: Strategy) {
  return (store: Redux.Store<RootState>) => (next: Function) => (action: StreamAction) => {
    next(action)
    return strategy({
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
  }

}
