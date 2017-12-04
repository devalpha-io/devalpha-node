import test from 'ava'
import { Map, List, is } from 'immutable'

import reducer from '../lib/reducers/positionsReducer'
import {
  INITIALIZED,
  ORDER_FILLED,
  BAR_RECEIVED
} from '../lib/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = Map({
    instruments: Map()
  })
  t.deepEqual(actual.toJS(), expect.toJS())
})

test(`set initial values on ${INITIALIZED}`, (t) => {
  const action = {
    type: INITIALIZED,
    payload: {
      timestamp: 50,
      initialStates: {
        positions: {
          instruments: { foo: 'bar' }
        }
      }
    }
  }

  const actual = reducer(undefined, action)
  const expect = Map({
    instruments: Map({ foo: 'bar' })
  })

  t.true(is(actual, expect))
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

  const actual = reducer(undefined, action).get('instruments')
  const expect = reducer(undefined, {}).setIn(['instruments', order.identifier], Map({
    quantity: 50,
    value: 5500,
    price: 110
  })).get('instruments')

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
    instruments: Map({
      MSFT: Map({
        quantity: 50,
        value: 5000,
        price: 100
      })
    })
  })

  const actual = reducer(initialState, action).getIn(['instruments', order.identifier])
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
    instruments: Map({
      MSFT: Map({
        quantity: 50,
        value: 5000,
        price: 100
      })
    })
  })

  const actual = reducer(initialState, action).getIn(['instruments', order.identifier])
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
    instruments: Map({
      MSFT: Map({
        quantity: 50,
        value: 5000,
        price: 100
      })
    })
  })

  t.false(reducer(initialState, action).hasIn(['instruments', order.identifier]))
})

test(`${BAR_RECEIVED}: correctly update price, quantity and value`, (t) => {
  const bar = {
    identifier: 'MSFT',
    timestamp: 0,
    open: 90,
    high: 110,
    low: 90,
    close: 100
  }
  const action = { type: BAR_RECEIVED, payload: bar }
  const initialState = Map({
    instruments: Map({
      MSFT: Map({
        quantity: 50,
        value: 2500,
        price: 50
      })
    })
  })

  const actual = reducer(initialState, action).getIn(['instruments', bar.identifier])
  const expected = Map({
    quantity: 50,
    value: 5000,
    price: 50
  })

  t.true(is(actual, expected))
})

test(`${BAR_RECEIVED}: dont break if non-existent position`, (t) => {
  const bar = {
    identifier: 'MSFT',
    timestamp: 0,
    open: 90,
    high: 110,
    low: 90,
    close: 100
  }
  const action = { type: BAR_RECEIVED, payload: bar }

  const actual = reducer(undefined, action)
  const expected = Map({
    instruments: Map()
  })

  t.true(is(actual, expected))
})
