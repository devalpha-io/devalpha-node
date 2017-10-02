import { createSelector } from 'reselect'
import math, { number as n, bignumber as b, chain } from 'mathjs'
import { Set, List } from 'immutable'

const getCash = (state) => state.getIn(['capital', 'cash'])
const getReservedCash = (state) => state.getIn(['capital', 'reservedCash'])
const getInitialCash = (state) => state.getIn(['capital', 'initialCash'])
const getPositions = (state) => state.get('positions')
const getCapitalHistory = (state) => state.getIn(['capital', 'history'])
const getPositionsHistory = (state) => state.getIn(['positions', 'history'])

const getTotal = createSelector([getCash, getReservedCash, getPositions], (cash, reservedCash, positions) => {
  let total = math.add(b(cash), b(reservedCash))
  positions.get('instruments').toList().forEach((position) => {
    total = math.add(total, b(position.get('value')))
  })
  return n(total)
})

const getReturnsTotal = createSelector([getTotal, getInitialCash], (total, initialCash) =>
  n(chain(b(total)).divide(b(initialCash)).subtract(1).done()))

const getReturnsPeriod = createSelector(
  [getTotal, getCapitalHistory, getPositionsHistory],
  (total, capitalHistory, positionsHistory) => {
    const previousCapital = capitalHistory.get(-1)
    const previousPositions = positionsHistory.get(-1)
    let previousTotal = math.add(b(previousCapital.get('cash')), b(previousCapital.get('reservedCash')))
    previousPositions.get('instruments').forEach((position) => {
      previousTotal = math.add(previousTotal, b(position.get('value')))
    })
    return n(chain(total).divide(previousTotal).subtract(1).done())
  }
)

const getMaxDrawdown = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    const capitalTotals = capitalHistory.map(
      capital => n(math.add(b(capital.get('cash')), b(capital.get('reservedCash'))))
    )
    const positionTotals = List()
    positionsHistory.forEach((history) => {
      let positionsTotal = 0
      history.get('instruments').toList().forEach((position) => {
        positionsTotal = math.add(positionsTotal, b(position.get('value')))
      })
    })
    const totals = capitalTotals.zip(positionTotals)
    const maxReturn = b(math.max(totals))
    const drawdowns = totals.map(t => chain(t).subtract(maxReturn).divide(maxReturn).done())
    return n(math.min(drawdowns))
  }
)

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
