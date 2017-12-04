/*
 * TODO:
 *  - alpha
 *  - beta
 *  - sortino
 *  - volatility
 */
import { List } from 'immutable'
import { createSelector } from 'reselect'
import { add, mean, std, sqrt, number as n, bignumber as b, chain, subtract } from 'mathjs'

const getCapitalHistory = (state) => List()
const getPositionsHistory = (state) => List()

const sum = (v1, v2) => add(b(v1), b(v2))

const calculateTotal = (capital, positions) => n(
  chain(b(capital.get('cash')))
    .add(b(capital.get('reservedCash')))
    .add(b(positions.get('instruments').map(p => p.get('value')).reduce(sum, 0)))
    .done()
)
const calculateReturns = (currentTotal, previousTotal) => n(
  chain(currentTotal)
    .divide(previousTotal)
    .subtract(1)
    .done()
)

export const getInitialTotal = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    if (capitalHistory.size === 0 || positionsHistory.size === 0) {
      return 0
    }
    const currentCapital = capitalHistory.get(0)
    const currentPositions = positionsHistory.get(0)

    return calculateTotal(currentCapital, currentPositions)
  }
)

export const getCurrentTotal = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    if (capitalHistory.size === 0 || positionsHistory.size === 0) {
      return 0
    }
    const currentCapital = capitalHistory.get(-1)
    const currentPositions = positionsHistory.get(-1)

    return calculateTotal(currentCapital, currentPositions)
  }
)

export const getReturnsTotal = createSelector([getCurrentTotal, getInitialTotal], (currentTotal, initialTotal) => {
  if (initialTotal === 0) {
    return 0
  }
  return calculateReturns(currentTotal, initialTotal)
})

export const getReturnsPeriod = createSelector(
  [getCapitalHistory, getPositionsHistory, getCurrentTotal],
  (capitalHistory, positionsHistory, currentTotal) => {
    if (capitalHistory.size <= 1 || positionsHistory.size <= 1) {
      return 0
    }

    /* calculate previous capital value */
    const previousCapital = capitalHistory.get(-2)
    const previousPositions = positionsHistory.get(-2)

    const previousTotal = calculateTotal(previousCapital, previousPositions)

    if (previousTotal === 0) {
      return 0
    }

    return calculateReturns(currentTotal, previousTotal)
  }
)

export const getMaxDrawdown = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    if (capitalHistory.size === 0 || positionsHistory.size === 0) {
      return 0
    }

    const totals = capitalHistory
      .zipWith((capital, positions) => [capital, positions], positionsHistory)
      .map(([capital, positions]) => calculateTotal(capital, positions))

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

export const getSharpeRatio = createSelector(
  [getCapitalHistory, getPositionsHistory],
  (capitalHistory, positionsHistory) => {
    if (capitalHistory.size <= 2 || positionsHistory.size <= 2) {
      return 0
    }

    const DAILY = 252
    const WEEKLY = 52
    const MONTLY = 12
    const NO_ANNUALIZATION = 1

    /*
     * @bug
     * this currently does not work as expected.
     * the calculation assumes that each history snapshot represents one day, whereas there
     * in fact might be more than one snapshots per day.
     *
     * possible fix: use List.groupBy and moment.js to build daily returns.
     */


    const histories = capitalHistory
      .zipWith((capital, positions) => [capital, positions], positionsHistory)

    const totals = histories
      .map(([capital, positions]) => calculateTotal(capital, positions))

    const returns = []
    for (let i = 1; i < totals.size; i += 1) {
      returns.push(
        calculateReturns(totals.get(i), totals.get(i - 1))
      )
    }

    const riskFreeReturn = b(0)
    const riskAdjusted = subtract(b(returns), b(riskFreeReturn))

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
)

export default createSelector([
  getCurrentTotal, getReturnsTotal, getReturnsPeriod, getMaxDrawdown
], (
  total, returnsTotal, returnsPeriod, maxDrawdown
) => ({
  total, returnsTotal, returnsPeriod, maxDrawdown
}))
