import test from 'ava'
import sinon from 'sinon'
import { Map, List, is } from 'immutable'

import reducer from '../lib/reducer'
import {
  INITIALIZED,
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_REJECTED,
  ORDER_CANCEL,
  ORDER_CANCELLED
} from '../lib/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expected = Map({
    cash: 0,
    commission: 0,
    history: List(),
    listeners: Map(),
    metrics: Map({
      maxDrawdown: 0,
      sharpeRatio: 0
    }),
    orders: Map(),
    positions: Map(),
    reservedCash: 0,
    returnsTotal: 0,
    returnsPeriod: 0,
    total: 0,
    timestamp: 0
  })
  t.deepEqual(actual.toJS(), expected.toJS())
})

test(`${ORDER_PLACED} of a sell-side order only affects the list of orders`, (t) => {
  const order = {
    id: 0,
    identifier: 'MSFT',
    quantity: -30,
    price: 100,
    commission: 1
  }
  const action = { type: ORDER_PLACED, payload: order }
  const actualState = reducer(undefined, action).filterNot((v, k) => k === 'orders')
  const actualOrders = reducer(undefined, action).get('orders')
  const expectedState = reducer(undefined, {}).filterNot((v, k) => k === 'orders')
  const expectedOrders = Map().set(0, order)

  t.true(is(actualState, expectedState))
  t.true(is(actualOrders, expectedOrders))
})
