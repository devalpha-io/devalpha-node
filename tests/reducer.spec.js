import test from 'ava'
import sinon from 'sinon'
import { Map, List, is } from 'immutable'

import reducer from '../lib/reducer'
import {
  INITIALIZED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_REJECTED,
  ORDER_CANCEL,
  ORDER_CANCELLED,
  BAR_RECEIVED
} from '../lib/constants'

test.beforeEach((t) => {
  /**
   * We're performing a round-trip of 6 orders:
   * Buy full, sell half, sell half, buy half, buy half, sell full
   * @type {Array}
   */
  t.context.orders = [
    {
      id: 0,
      identifier: 'MSFT',
      quantity: 100,
      price: 100,
      commission: 10
    },
    {
      id: 1,
      identifier: 'MSFT',
      quantity: -50,
      price: 110,
      commission: 5.5
    },
    {
      id: 2,
      identifier: 'MSFT',
      quantity: -50,
      price: 120,
      commission: 6
    },
    {
      id: 3,
      identifier: 'MSFT',
      quantity: 50,
      price: 90,
      commission: 4.5
    },
    {
      id: 4,
      identifier: 'MSFT',
      quantity: 50,
      price: 80,
      commission: 4
    },
    {
      id: 5,
      identifier: 'MSFT',
      quantity: -100,
      price: 70,
      commission: 7
    }
  ]
})

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = Map({
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
  t.deepEqual(actual.toJS(), expect.toJS())
})

test(`${ORDER_PLACED} adds an order to the Map of orders`, (t) => {
  const order = {
    id: 0,
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action).get('orders')
  const expect = Map().set(0, order)

  t.true(is(actual, expect))
})

test(`${ORDER_PLACED} of a sell-side order does not modify anything but the Map of orders`, (t) => {
  const order = {
    id: 1,
    identifier: 'MSFT',
    quantity: -50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action).filter((v, k) => k !== 'orders')
  const expect = reducer(undefined, {}).filter((v, k) => k !== 'orders')

  t.true(is(actual, expect))
})

test(`${ORDER_PLACED} of a buy-side order correctly edits cash and reservedCash`, (t) => {
  const order = {
    id: 0,
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actualReservedCash = reducer(undefined, action).get('reservedCash')
  const expectReservedCash = 10010

  const actualCash = reducer(undefined, action).get('cash')
  const expectCash = -10010

  t.true(is(actualReservedCash, expectReservedCash))
  t.true(is(actualCash, expectCash))
})


test(`${ORDER_CANCELLED} removes an order from the Map of orders`, (t) => {
  const order = {
    id: 0,
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_CANCELLED, payload: order }
  const initialState = Map({
    orders: Map({ 0: order }),
    cash: 0,
    reservedCash: 0
  })

  const actual = reducer(initialState, action).get('orders')
  const expect = Map()

  t.true(is(actual, expect))
})

test(`${ORDER_CANCELLED} of a sell-side order does not modify anything but the Map of orders`, (t) => {
  const order = {
    id: 1,
    identifier: 'MSFT',
    quantity: -50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_CANCELLED, payload: order }

  const actual = reducer(undefined, action).filter((v, k) => k !== 'orders')
  const expect = reducer(undefined, {}).filter((v, k) => k !== 'orders')

  t.true(is(actual, expect))
})

test(`${ORDER_CANCELLED} of a buy-side order correctly reverts cash and reservedCash`, (t) => {
  const order = {
    id: 0,
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_CANCELLED, payload: order }
  const initialState = Map({
    orders: Map({ 0: order }),
    cash: 0,
    reservedCash: 10010
  })

  const actualReservedCash = reducer(initialState, action).get('reservedCash')
  const expectReservedCash = 0

  const actualCash = reducer(undefined, action).get('cash')
  const expectCash = 10010

  t.true(is(actualReservedCash, expectReservedCash))
  t.true(is(actualCash, expectCash))
})
