/**
 * We use this file to test the globalReducer, as it is strongly dependent on the other reducers,
 * and as such there is no point in testing it on its own.
 */

import test from 'ava'
import sinon from 'sinon'
import { Map, List, is } from 'immutable'

import reducer from '../lib/reducers'
import {
  INITIALIZED,
  ORDER_FILLED,
  BAR_RECEIVED
} from '../lib/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = Map({
    capital: Map({
      cash: 0,
      commission: 0,
      reservedCash: 0
    }),
    positions: Map(),
    orders: Map(),
    metrics: Map({
      history: List(),
      maxDrawdown: 0,
      sharpeRatio: 0,
      returnsTotal: 0,
      returnsPeriod: 0,
      total: 0,
      timestamp: 0
    })
  })
  t.true(is(actual, expect))
})

test(`${INITIALIZED} correctly builds the first history`, (t) => {
  const action = { type: INITIALIZED, payload: { timestamp: 100 } }
  const actual = reducer(undefined, action).getIn(['metrics', 'history']).get(0)
  const expect = Map({
    capital: Map({
      cash: 0,
      commission: 0,
      reservedCash: 0
    }),
    positions: Map(),
    orders: Map(),
    metrics: Map({
      history: List(),
      maxDrawdown: 0,
      sharpeRatio: 0,
      returnsTotal: 0,
      returnsPeriod: 0,
      total: 0,
      timestamp: 100
    })
  })

  t.true(is(actual, expect))
})

test.todo(`${ORDER_FILLED} updates total as well as returns`)

test.todo(`${BAR_RECEIVED} updates total as well as returns`)
