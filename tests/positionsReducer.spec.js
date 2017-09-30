import test from 'ava'
import { Map, is } from 'immutable'

import reducer from '../lib/reducers/positionsReducer'
import {
  ORDER_FILLED
} from '../lib/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = Map()
  t.deepEqual(actual.toJS(), expect.toJS())
})

test(`${ORDER_FILLED}, new position: add position to the state`, (t) => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_FILLED, payload: order }

  const actual = reducer(undefined, action)
  const expect = reducer(undefined, {}).set(order.identifier, Map({
    quantity: 50,
    value: 5500,
    price: 110
  }))

  t.true(is(actual, expect))
})

test(`${ORDER_FILLED}, sell-side, existing position: only update quantity and value, not price`, (t) => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: -25,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_FILLED, payload: order }
  const initialState = Map({
    MSFT: Map({
      quantity: 50,
      value: 5000,
      price: 100
    })
  })

  const actual = reducer(initialState, action).get(order.identifier)
  const expected = Map({
    quantity: 25,
    value: 2750,
    price: 100
  })

  t.true(is(actual, expected))
})

test(`${ORDER_FILLED}, buy-side, existing position: correctly update price, quantity and value`, (t) => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: 50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_FILLED, payload: order }
  const initialState = Map({
    MSFT: Map({
      quantity: 50,
      value: 5000,
      price: 100
    })
  })

  const actual = reducer(initialState, action).get(order.identifier)
  const expected = Map({
    quantity: 100,
    value: 11000,
    price: 105
  })

  t.true(is(actual, expected))
})

test(`${ORDER_FILLED}, sell-side, existing position: delete the position if quantity 0`, (t) => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: -50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_FILLED, payload: order }
  const initialState = Map({
    MSFT: Map({
      quantity: 50,
      value: 5000,
      price: 100
    })
  })

  t.false(reducer(initialState, action).has(order.identifier))
})

