import test from 'ava'
import { Map, is } from 'immutable'

import reducer from '../lib/reducers/capitalReducer'
import {
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_REJECTED,
  ORDER_CANCELLED,
} from '../lib/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = Map({
    cash: 0,
    commission: 0,
    reservedCash: 0
  })
  t.deepEqual(actual.toJS(), expect.toJS())
})

test(`${ORDER_PLACED} of a sell-side order does not modify anything`, (t) => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: -50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action)
  const expect = reducer(undefined, {})

  t.true(is(actual, expect))
})

test(`${ORDER_PLACED} of a buy-side order correctly edits cash, commission and reservedCash`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action)
  const expect = reducer(undefined, {}).merge(Map({
    reservedCash: 10010,
    cash: -10010,
    commission: 0
  }))

  t.true(is(actual, expect))
})

test(`${ORDER_CANCELLED} of a sell-side order does not modify anything`, (t) => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: -50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_CANCELLED, payload: order }

  const actual = reducer(undefined, action)
  const expect = reducer(undefined, {})

  t.true(is(actual, expect))
})

test(`${ORDER_CANCELLED} of a buy-side order correctly reverts cash and reservedCash, also doesn't commission`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_CANCELLED, payload: order }
  const initialState = Map({
    cash: 0,
    reservedCash: 10010,
    commission: 0
  })

  const actual = reducer(initialState, action)
  const expect = reducer(initialState, {}).merge(Map({
    cash: 10010,
    reservedCash: 0,
    commission: 0
  }))

  t.true(is(actual, expect))
})
