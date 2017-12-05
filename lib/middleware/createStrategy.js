import { Map, List } from 'immutable'
import moment from 'moment'
import { add, bignumber as b, number as n, chain, subtract, mean, std, sqrt } from 'mathjs'

import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../constants'

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

    const metrics = {
      returns: getReturns(history),
      drawdown: getDrawdown(history),
      alpha: 0,
      beta: 0,
      sharpe: getSharpeRatio(history),
      sortino: 0,
      volatility: 0
    }

    return strategy({
      metrics: () => metrics,
      state: () => store.getState().toJS(),
      order: (payload) => store.dispatch({ type: ORDER_REQUESTED, payload }),
      cancel: (id) => store.dispatch({ type: ORDER_CANCEL, payload: { id } })
    }, action)
  }

}

export function getReturns(history) {
  if (!history.size) {
    return 0
  }

  const initial = history.get(0)
  const initialTotal = add(
    b(initial.getIn(['positions', 'total'])),
    b(initial.getIn(['capital', 'total']))
  )

  if (initialTotal === 0) {
    return 0
  }

  const current = history.get(-1)
  const currentTotal = add(
    b(current.getIn(['positions', 'total'])),
    b(current.getIn(['capital', 'total']))
  )

  return n(chain(currentTotal)
    .divide(initialTotal)
    .subtract(1)
    .done())
}

export function getDrawdown(history) {
  if (!history.size) {
    return 0
  }

  const totals = history.map(h => add(
    b(h.getIn(['positions', 'total'])),
    b(h.getIn(['capital', 'total']))
  ))

  let maxDrawdown = b(0)
  let peak = b(-Infinity)

  for (let i = 0; i < totals.size; i += 1) {
    const total = totals.get(i)
    if (n(total) > n(peak)) peak = total
    const drawdown = chain(subtract(peak, total)).divide(peak).done()
    if (n(drawdown) > n(maxDrawdown)) {
      maxDrawdown = drawdown
    }
  }

  return n(maxDrawdown)
}

export function getSharpeRatio(history) {
  if (history.size < 3) {
    return 0
  }

  const DAILY = 252
  const WEEKLY = 52
  const MONTLY = 12
  const NO_ANNUALIZATION = 1

  const totals = history.map(h => add(
    b(h.getIn(['positions', 'total'])),
    b(h.getIn(['capital', 'total']))
  ))

  const returns = []
  for (let i = 1; i < totals.size; i += 1) {
    const previousTotal = totals.get(i - 1)
    const currentTotal = totals.get(i)

    returns.push(chain(currentTotal).divide(previousTotal).subtract(b(1)).done())
  }

  const riskFreeReturn = 0
  const riskAdjusted = subtract(returns, b(riskFreeReturn))

  const meanReturn = mean(b(riskAdjusted))
  const standardDeviation = std(riskAdjusted)
  const annualizationFactor = sqrt(b(NO_ANNUALIZATION))

  return n(
    chain(meanReturn)
      .subtract(riskFreeReturn)
      .divide(standardDeviation)
      .multiply(annualizationFactor)
      .done()
  )
}
