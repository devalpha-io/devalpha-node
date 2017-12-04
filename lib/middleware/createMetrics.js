import moment from 'moment'
import {
  FINISHED,
  METRICS
} from '../constants'

export default function createMetrics() {
  return (store) => (next) => {
    let latest = -1
    const history = []
    const metrics = {
      returns: 0,
      drawdown: 0,
      alpha: 0,
      beta: 0,
      sharpe: 0,
      sortino: 0,
      volatility: 0
    }

    return (action) => {
      switch (action.type) {
      case FINISHED:
        store.dispatch({
          type: METRICS,
          payload: metrics
        })
        console.log(metrics)
        break
      default:
        if (action.payload.timestamp > latest) {
          latest = action.payload.timestamp
          history.push(store.getState().toJS())
        }
      }
      next(action)
    }
  }
}
