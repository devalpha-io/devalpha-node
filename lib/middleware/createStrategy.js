import { List } from 'immutable'
import moment from 'moment'

import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

import {
  getReturns,
  getDrawdown,
  getSharpeRatio
} from '../util/metrics'

export default function createStrategy(strategy) {
  let latest = null
  let history = List()

  return (store) => (next) => async (action) => {
    await next(action)

    if (typeof action.payload.timestamp !== 'undefined') {
      const timestamp = moment(action.payload.timestamp)
      if (latest === null || latest.dayOfYear() !== timestamp.dayOfYear()) {
        latest = timestamp
        history = history.push(store.getState())
      } else if (latest.dayOfYear() === timestamp.dayOfYear()) {
        latest = timestamp
        history = history.set(-1, store.getState())
      }
    }

    return strategy({
      metrics: () => ({
        alpha: 0,
        beta: 0,
        drawdown: getDrawdown(history),
        returns: getReturns(history),
        sharpe: getSharpeRatio(history),
        sortino: 0,
        volatility: 0
      }),
      state: () => store.getState().toJS(),
      order: (payload) => store.dispatch({ type: ORDER_REQUESTED, payload }),
      cancel: (id) => store.dispatch({ type: ORDER_CANCEL, payload: { id } })
    }, action)
  }

}
