import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

export default function createStrategy(strategy) {
  return (store) => (next) => (action) => {
    next(action)
    return strategy({
      state: () => store.getState().toJS(),
      order: (payload) => store.dispatch({
        type: ORDER_REQUESTED,
        payload: {
          timestamp: action.payload.timestamp,
          ...payload
        }
      }),
      cancel: (id) => store.dispatch({
        type: ORDER_CANCEL,
        payload: {
          timestamp: action.payload.timestamp,
          id
        }
      })
    }, action)
  }

}
