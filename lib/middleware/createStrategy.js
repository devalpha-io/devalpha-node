import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

export default function createStrategy(strategy) {
  return (store) => (next) => async (action) => {
    await next(action)
    return strategy({
      // TODO state should be a plain object, not immutable.js collection
      state: store.getState(),
      order: (payload) => store.dispatch({ type: ORDER_REQUESTED, payload }),
      cancel: (id) => store.dispatch({ type: ORDER_CANCEL, payload: { id } })
    }, action)
  }
}
