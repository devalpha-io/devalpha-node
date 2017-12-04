import { List, Map } from 'immutable'
import moment from 'moment'
import {
  FINISHED
} from '../constants'

export default function createMetrics() {
  return (store) => (next) => {
    let latest = null
    let history = List()
    let metrics = Map({
      returns: 0,
      drawdown: 0,
      alpha: 0,
      beta: 0,
      sharpe: 0,
      sortino: 0,
      volatility: 0
    })

    return (action) => {
      switch (action.type) {
      case FINISHED:
        action.payload = metrics.toJS()
        break
      default:
        if (action.payload.timestamp !== 'undefined') {
          const timestamp = moment(action.payload.timestamp)
          if (latest === null || latest.dayOfYear() !== timestamp.dayOfYear()) {
            latest = timestamp
            history = history.push(store.getState())
          } else if (latest.dayOfYear() === timestamp.dayOfYear()) {
            latest = timestamp
            history = history.set(-1, store.getState())
          }
        }
      }
      next(action)
    }
  }
}
