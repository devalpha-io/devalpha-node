import { createSelector } from 'reselect'
import { add, max, min, number as n, bignumber as b, chain, subtract } from 'mathjs'
import { List } from 'immutable'

const getCash = (state) => state.getIn(['capital', 'cash'])
const getReservedCash = (state) => state.getIn(['capital', 'reservedCash'])
const getInitialCash = (state) => state.getIn(['capital', 'initialCash'])
const getPositions = (state) => state.get('positions')
const getCapitalHistory = (state) => state.getIn(['capital', 'history'])
const getPositionsHistory = (state) => state.getIn(['positions', 'history'])

export const getTotal = createSelector([getCash, getReservedCash, getPositions], (cash, reservedCash, positions) => {
  let total = add(b(cash), b(reservedCash))
  positions.get('instruments').toList().forEach((position) => {
    total = add(total, b(position.get('value')))
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
    if (capitalHistory.size === 0 || positionsHistory.size === 0) {
      return 0
    }

    /* calculate previous capital value */
    const previousCapital = capitalHistory.get(-1)
    let previousTotal = add(b(previousCapital.get('cash')), b(previousCapital.get('reservedCash')))

    /* calculate previous value of all positions */
    const previousPositions = positionsHistory.get(-1)
    previousPositions.get('instruments').forEach((position) => {
      previousTotal = add(previousTotal, b(position.get('value')))
    })

    if (n(previousTotal) === 0) {
      return 0
    }

    return n(chain(total).divide(previousTotal).subtract(1).done())
  }
)

export const getMaxDrawdown = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    if (capitalHistory.size === 0 || positionsHistory.size === 0) {
      return 0
    }
    const capitalTotals = capitalHistory.map(
      capital => n(add(b(capital.get('cash')), b(capital.get('reservedCash'))))
    )
    let positionTotals = List()
    positionsHistory.forEach((history) => {
      let positionsTotal = 0
      history.get('instruments').toList().forEach((position) => {
        positionsTotal = add(positionsTotal, b(position.get('value')))
      })
      positionTotals = positionTotals.push(n(positionsTotal))
    })

    const totals = capitalTotals.zipWith((c, p) => n(add(b(c), b(p))), positionTotals)

    let maxDrawdown = 0
    let peak = -Infinity

    for (let i = 0; i < totals.size; i += 1) {
      const total = totals.get(i)
      if (total > peak) peak = total
      const drawdown = n(chain(subtract(b(peak), b(total))).divide(b(peak)).done())
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }

    return maxDrawdown
  }
)

// function getSharpeRatio(returns) {
//   const DAILY = 252
//   const WEEKLY = 52
//   const MONTLY = 12

//   const riskFreeReturn = 0
//   const riskAdjusted = subtract(b(returns), b(riskFreeReturn))

//   const meanReturn = mean(b(riskAdjusted))
//   const standardDeviation = std(b(riskAdjusted))
//   const annualizationFactor = sqrt(b(DAILY))

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
