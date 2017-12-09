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

export function updateHistory(state, history, action) {
  if (typeof action.payload.timestamp !== 'undefined') {
    if (history.size === 0) {
      return history.push(state)
    }

    const current = moment(action.payload.timestamp, 'X')
    const previous = moment(history.get(-1).get('timestamp'), 'X')

    if (previous.isSame(current, 'day')) {
      history = history.set(-1, state)
    } else {
      history = history.push(state)
    }
  }
  return history
}

export default function createStrategy(strategy) {
  let history = List()

  return (store) => (next) => async (action) => {
    await next(action)

    history = updateHistory(store.getState(), history, action)

    return strategy({
      metrics: () => ({
        alpha: 0,
        beta: 0,
        calmar: 0,
        drawdown: getDrawdown(history),
        kurtosis: 0,
        omega: 0,
        returns: getReturns(history),
        sharpe: getSharpeRatio(history),
        skew: 0,
        sortino: 0,
        stability: 0,
        tail: 0,
        volatility: 0
      }),
      state: () => store.getState().toJS(),
      order: (payload) => store.dispatch({ type: ORDER_REQUESTED, payload }),
      cancel: (id) => store.dispatch({ type: ORDER_CANCEL, payload: { id } })
    }, action)
  }

}
