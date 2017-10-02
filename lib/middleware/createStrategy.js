import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

export default function createStrategy(strategy, getMetrics) {
  return (store) => (next) => async (action) => {
    await next(action)
    return strategy({
      metrics: getMetrics(store.getState()),
      state: store.getState().toJS(),
      order: (payload) => store.dispatch({ type: ORDER_REQUESTED, payload }),
      cancel: (id) => store.dispatch({ type: ORDER_CANCEL, payload: { id } })
    }, action)
  }

}
