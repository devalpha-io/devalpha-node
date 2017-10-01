import math, { number as n, bignumber as b, chain } from 'mathjs'
import { Set } from 'immutable'

export function buildTotal(state) {
  let total = math.add(b(state.get('cash')), b(state.get('reservedCash')))
  state.get('positions').forEach((position) => {
    total = math.add(total, b(position.get('value')))
  })
  return total
}

export function buildReturnsTotal(state) {
  const total = state.get('total')
  const history = state.get('history')
  const initial = history.get(0)
  return n(chain(total).divide(n(initial.get('total'))).subtract(1).done())
}

export function buildReturnsPeriod(state) {
  const total = state.get('total')
  const history = state.get('history')
  const previous = history.get(-1)
  return n(chain(total).divide(b(previous.get('total'))).subtract(1).done())
}

export function buildHistory(state, timestamp = Date.now()) {
  let currentHistory = state.filter((v, k) => k !== 'history')
  currentHistory = currentHistory.set('timestamp', timestamp)
  return state.get('history').push(currentHistory)
}

export function buildMaxDrawdown(state) {
  const totals = state.get('history').map(h => h.get('total')).toArray()
  const maxReturn = b(math.max(totals))
  const drawdowns = totals.map(t => chain(t).subtract(maxReturn).divide(maxReturn).done())
  return n(math.min(drawdowns))
}

export function buildSharpeRatio(returns) {
  const DAILY = 252
  const WEEKLY = 52
  const MONTLY = 12

  const riskFreeReturn = 0
  const riskAdjusted = math.subtract(b(returns), b(riskFreeReturn))

  const meanReturn = math.mean(b(riskAdjusted))
  const standardDeviation = math.std(b(riskAdjusted))
  const annualizationFactor = math.sqrt(b(DAILY))

  return n(chain(b(meanReturn))
    .divide(b(standardDeviation)).multiply(b(annualizationFactor)).done()
  )
}
