import { createSelector } from 'reselect'
import math, { number as n, bignumber as b, chain } from 'mathjs'
import { Set } from 'immutable'

const getCash = (state) => state.getIn(['capital', 'cash'])
const getReservedCash = (state) => state.getIn(['capital', 'reservedCash'])
const getInitialCash = (state) => state.getIn(['capital', 'initialCash'])
const getPositions = (state) => state.get('positions')

const getTotal = createSelector([getCash, getReservedCash, getPositions], (cash, reservedCash, positions) => {
  let total = math.add(b(cash), b(reservedCash))
  positions.forEach((position) => {
    total = math.add(total, b(position.get('value')))
  })
  return n(total)
})

const getReturnsTotal = createSelector([getTotal, getInitialCash], (total, initialCash) =>
  n(chain(b(total)).divide(b(initialCash)).subtract(1).done()))


// function getReturnsPeriod(metrics) {
//   const total = metrics.get('total')
//   const history = metrics.get('history')
//   const previous = history.get(-1)
//   return n(chain(total).divide(b(previous.getIn(['metrics', 'total']))).subtract(1).done())
// }

// function getHistory(state, timestamp = Date.now()) {
//   let currentHistory = state.filter((v, k) => k !== 'history')
//   currentHistory = currentHistory.setIn(['metrics', 'timestamp'], timestamp)
//   return state.getIn(['metrics', 'history']).push(currentHistory)
// }

// function getMaxDrawdown(state) {
//   const totals = state.get('history').map(h => h.get('total')).toArray()
//   const maxReturn = b(math.max(totals))
//   const drawdowns = totals.map(t => chain(t).subtract(maxReturn).divide(maxReturn).done())
//   return n(math.min(drawdowns))
// }

// function getSharpeRatio(returns) {
//   const DAILY = 252
//   const WEEKLY = 52
//   const MONTLY = 12

//   const riskFreeReturn = 0
//   const riskAdjusted = math.subtract(b(returns), b(riskFreeReturn))

//   const meanReturn = math.mean(b(riskAdjusted))
//   const standardDeviation = math.std(b(riskAdjusted))
//   const annualizationFactor = math.sqrt(b(DAILY))

//   return n(chain(b(meanReturn))
//     .divide(b(standardDeviation)).multiply(b(annualizationFactor)).done()
//   )
// }

export default createSelector([getTotal, getReturnsTotal], (...args) => ({ ...args }))
