import test from 'ava'
import { Map, is } from 'immutable'

import reducer from '../lib/reducers/ordersReducer'
import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED,
  INITIALIZED
} from '../lib/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = Map()
  t.deepEqual(actual.toJS(), expect.toJS())
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
  const expect = Map({ foo: 'bar' })

  t.true(is(actual, expect))
})

test(`${ORDER_PLACED} adds an order to the Map of orders`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action)
  const expect = Map().set('0', order)

  t.true(is(actual, expect))
})

test(`${ORDER_FILLED} removes an order from the Map of orders`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_FILLED, payload: order }
  const initialState = Map().set('0', order)

  const actual = reducer(initialState, action)
  const expect = Map()

  t.true(is(actual, expect))
})


test(`${ORDER_CANCELLED} removes an order from the Map of orders`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_CANCELLED, payload: { id: '0' } }
  const initialState = Map().set('0', order)

  const actual = reducer(initialState, action)
  const expect = Map()

  t.true(is(actual, expect))
})
