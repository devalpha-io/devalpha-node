import { add, bignumber as b, number as n, chain, subtract, mean, std, sqrt } from 'mathjs'

export function getReturns(history) {
  if (!history.size) {
    return 0
  }

  const initial = history.get(0)
  const initialTotal = add(
    b(initial.getIn(['positions', 'total'])),
    b(initial.getIn(['capital', 'total']))
  )

  if (initialTotal.eq(0)) {
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

  // const DAILY = 252
  // const WEEKLY = 52
  // const MONTLY = 12
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

  return n(chain(meanReturn)
    .subtract(riskFreeReturn)
    .divide(standardDeviation)
    .multiply(annualizationFactor)
    .done())
}
