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

  return (store) => (next) => (action) => {
    next(action)

    history = updateHistory(store.getState(), history, action)

    return strategy({
      metrics: {
        alpha: /* istanbul ignore next */ () => 0,
        beta: /* istanbul ignore next */ () => 0,
        calmar: /* istanbul ignore next */ () => 0,
        drawdown: /* istanbul ignore next */ () => getDrawdown(history),
        kurtosis: /* istanbul ignore next */ () => 0,
        omega: /* istanbul ignore next */ () => 0,
        returns: /* istanbul ignore next */ () => getReturns(history),
        sharpe: /* istanbul ignore next */ () => getSharpeRatio(history),
        skew: /* istanbul ignore next */ () => 0,
        sortino: /* istanbul ignore next */ () => 0,
        stability: /* istanbul ignore next */ () => 0,
        tail: /* istanbul ignore next */ () => 0,
        volatility: /* istanbul ignore next */ () => 0
      },
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
