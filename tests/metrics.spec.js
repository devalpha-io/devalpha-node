import test from 'ava'
import { fromJS } from 'immutable'

import {
  getReturns,
  getDrawdown,
  getSharpeRatio
} from '../lib/util/metrics'

test('getReturns correctly calculates returns', (t) => {
  const history = fromJS([
    {
      positions: { total: 47 },
      capital: { total: 31 }
    },
    {
      positions: { total: 53 },
      capital: { total: 51 }
    }
  ])

  const actual = getReturns(history)
  const expect = 0.3333333333333333
  t.is(actual, expect)
})

test('getReturns returns 0 if empty history', (t) => {
  const history = fromJS([])

  const actual = getReturns(history)
  const expect = 0
  t.is(actual, expect)
})

test('getReturns returns 0 if initial value is 0', (t) => {
  const history = fromJS([
    {
      positions: { total: 0 },
      capital: { total: 0 }
    }
  ])

  const actual = getReturns(history)
  const expect = 0
  t.is(actual, expect)
})

test('getDrawdown correctly calculates drawdown', (t) => {
  const history = fromJS([
    {
      positions: { total: 2801.38 },
      capital: { total: 1768 }
    },
    {
      positions: { total: 1001.38 },
      capital: { total: 1788 }
    }
  ])

  const actual = getDrawdown(history)
  const expect = 0.3895495668996669
  t.is(actual, expect)
})

test('getDrawdown returns 0 if empty history', (t) => {
  const history = fromJS([])

  const actual = getDrawdown(history)
  const expect = 0
  t.is(actual, expect)
})

test('getSharpeRatio correctly calculates Sharpe ratio', (t) => {
  const history = fromJS([
    {
      positions: { total: 220 },
      capital: { total: 0 }
    },
    {
      positions: { total: 230 },
      capital: { total: 0 }
    },
    {
      positions: { total: 225 },
      capital: { total: 0 }
    }
  ])

  const actual = getSharpeRatio(history)
  const expect = 0.24956709924231088

  t.is(actual, expect)
})

test('getSharpeRatio returns 0 if history length is less than 3', (t) => {
  const history = fromJS([
    {
      positions: { total: 220 },
      capital: { total: 0 }
    },
    {
      positions: { total: 230 },
      capital: { total: 0 }
    }
  ])

  const actual = getSharpeRatio(history)
  const expect = 0

  t.is(actual, expect)
})
