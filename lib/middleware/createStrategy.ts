import {
  Store,
  Strategy,
  StreamAction,
  Middleware
} from '../typings'

import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

/**
 * The strategy middleware supplies the strategy with context and action. The context is a plain
 * object containing the `state()`, an `order()`-function and a `cancel()`-function for cancelling
 * placed orders.
 *
 * @private
 * @param {Strategy} strategy The strategy provided by the user.
 * @return {Middleware} Middleware to be consumed by a Consumer.
 */
export function createStrategy(strategy: Strategy): Middleware {
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
