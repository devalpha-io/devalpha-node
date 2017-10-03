import { createSelector } from 'reselect'
import math, { number as n, bignumber as b, chain } from 'mathjs'
import { Set, List } from 'immutable'

const getCash = (state) => state.getIn(['capital', 'cash'])
const getReservedCash = (state) => state.getIn(['capital', 'reservedCash'])
const getInitialCash = (state) => state.getIn(['capital', 'initialCash'])
const getPositions = (state) => state.get('positions')
const getCapitalHistory = (state) => state.getIn(['capital', 'history'])
const getPositionsHistory = (state) => state.getIn(['positions', 'history'])

export const getTotal = createSelector([getCash, getReservedCash, getPositions], (cash, reservedCash, positions) => {
  let total = math.add(b(cash), b(reservedCash))
  positions.get('instruments').toList().forEach((position) => {
    total = math.add(total, b(position.get('value')))
  })
  return n(total)
})

export const getReturnsTotal = createSelector([getTotal, getInitialCash], (total, initialCash) => {
  if (initialCash) {
    return n(chain(b(total)).divide(b(initialCash)).subtract(1).done())
  }
  return 0
})

export const getReturnsPeriod = createSelector(
  [getTotal, getCapitalHistory, getPositionsHistory],
  (total, capitalHistory, positionsHistory) => {
    if (!capitalHistory.size && !positionsHistory.size) {
      return 0
    }
    const previousCapital = capitalHistory.get(-1)
    const previousPositions = positionsHistory.get(-1)
    let previousTotal = math.add(b(previousCapital.get('cash')), b(previousCapital.get('reservedCash')))
    previousPositions.get('instruments').forEach((position) => {
      previousTotal = math.add(previousTotal, b(position.get('value')))
    })
    return n(chain(total).divide(previousTotal).subtract(1).done())
  }
)

export const getMaxDrawdown = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    if (!capitalHistory.size && !positionsHistory.size) {
      return 0
    }
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

export default createSelector([
  getTotal, getReturnsTotal, getReturnsPeriod, getMaxDrawdown
], (
  total, returnsTotal, returnsPeriod, maxDrawdown
) => ({
  total, returnsTotal, returnsPeriod, maxDrawdown
}))
