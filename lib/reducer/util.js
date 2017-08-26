import math, { number as n, bignumber as b, chain } from 'mathjs'
import { Set } from 'immutable'

export function calculateTotal(state) {
  let total = math.add(b(state.get('cash')), b(state.get('reservedCash')))
  state.get('positions').forEach((position) => {
    total = math.add(total, b(position.get('value')))
  })
  return total
}

export function calculateReturnsTotal(state) {
  const total = state.get('total')
  const history = state.get('history')
  const initial = history.get(0)
  // console.log(history)
  return n(chain(total).divide(n(initial.get('total'))).subtract(1).done())
}

export function calculateReturnsPeriod(state) {
  const total = state.get('total')
  const history = state.get('history')
  const previous = history.get(-1)
  return n(chain(total).divide(b(previous.get('total'))).subtract(1).done())
}

export function calculateHistory(state, timestamp = Date.now()) {
  const ignoreKeys = Set(['listeners', 'history'])
  let currentHistory = state.filterNot((v, k) => ignoreKeys.has(k))
  currentHistory = currentHistory.set('timestamp', timestamp)
  return state.get('history').push(currentHistory)
}
