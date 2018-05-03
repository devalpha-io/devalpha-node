import test from 'ava'
import Decimal from 'decimal.js'

import { ordersReducer as reducer } from '../dist/reducers/ordersReducer'
import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED,
  INITIALIZED
} from '../dist/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = {}
  t.deepEqual(actual, expect)
})

test(`set initial values on ${INITIALIZED}`, (t) => {
  const action = {
    type: INITIALIZED,
    payload: {
      timestamp: 50,
      initialStates: {
        orders: { foo: 'bar' }
      }
    }
  }

  const actual = reducer(undefined, action)
  const expect = { foo: 'bar' }

  t.deepEqual(actual, expect)
})

test(`${ORDER_PLACED} adds an order to the Map of orders`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10)
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action)
  const expect = {
    '0': order
  }

  t.deepEqual(actual, expect)
})

test(`${ORDER_FILLED} removes an order from the map of orders if completely filled`, (t) => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10)
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder } }
  const initialState = {
    '0': { ...placedOrder }
  }

  const actual = reducer(initialState, action)
  const expect = {}

  t.deepEqual(actual, expect)
})

test(`${ORDER_FILLED} retains an order in the map of orders if partially filled`, (t) => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10)
  }
  const filledOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(25),
    price: new Decimal(100),
    commission: new Decimal(2.5)
  }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder } }
  const initialState = {
    '0': { ...placedOrder }
  }

  const actual = reducer(initialState, action)
  const expect = {
    '0': {
      id: '0',
      identifier: 'MSFT',
      quantity: new Decimal(75),
      price: new Decimal(100),
      commission: new Decimal(7.5)
    }
  }

  t.deepEqual(actual, expect)
})

test(`${ORDER_CANCELLED} removes an order from the map of orders`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10)
  }
  const action = { type: ORDER_CANCELLED, payload: { id: '0' } }
  const initialState = {
    '0': order
  }

  const actual = reducer(initialState, action)
  const expect = {}

  t.deepEqual(actual, expect)
})
