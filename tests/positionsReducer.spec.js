import test from 'ava'

import Decimal from 'decimal.js'
import { positionsReducer as reducer } from '../dist/reducers/positionsReducer'
import {
  INITIALIZED,
  ORDER_FILLED
} from '../dist/constants'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = {
    instruments: {},
    total: new Decimal(0)
  }
  t.deepEqual(actual, expect)
})

test(`set initial values on ${INITIALIZED}`, (t) => {
  const action = {
    type: INITIALIZED,
    payload: {
      timestamp: new Decimal(50),
      initialStates: {
        positions: {
          instruments: { foo: 'bar' },
          total: new Decimal(10)
        }
      }
    }
  }

  const actual = reducer(undefined, action)
  const expect = {
    instruments: {
      foo: 'bar'
    },
    total: new Decimal(10)
  }

  t.deepEqual(actual, expect)
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
  const expect = {
    instruments: {
      [order.identifier]: {
        quantity: new Decimal(50),
        value: new Decimal(5500),
        price: new Decimal(110)
      }
    },
    total: new Decimal(5500)
  }

  t.deepEqual(actual, expect)
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
  const initialState = {
    instruments: {
      MSFT: {
        quantity: new Decimal(50),
        value: new Decimal(5000),
        price: new Decimal(100)
      }
    },
    total: new Decimal(5000)
  }

  const actual = reducer(initialState, action)
  const expect = {
    instruments: {
      [order.identifier]: {
        quantity: new Decimal(25),
        value: new Decimal(2750),
        price: new Decimal(100)
      }
    },
    total: new Decimal(2750)
  }

  t.deepEqual(actual, expect)
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
  const initialState = {
    instruments: {
      MSFT: {
        quantity: new Decimal(50),
        value: new Decimal(5000),
        price: new Decimal(100)
      }
    },
    total: new Decimal(5000)
  }

  const actual = reducer(initialState, action)
  const expect = {
    instruments: {
      [order.identifier]: {
        quantity: new Decimal(100),
        value: new Decimal(11000),
        price: new Decimal(105)
      }
    },
    total: new Decimal(11000)
  }

  t.deepEqual(actual, expect)
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
  const initialState = {
    instruments: {
      MSFT: {
        quantity: new Decimal(50),
        value: new Decimal(5000),
        price: new Decimal(100)
      }
    },
    total: new Decimal(5000)
  }

  t.is(reducer(initialState, action).instruments[order.identifier], undefined)
})

test(`default: correctly update price, quantity and value`, (t) => {
  const bar = {
    identifier: 'MSFT',
    timestamp: 0,
    open: 90,
    high: 110,
    low: 90,
    close: 100
  }
  const action = { type: 'foobar', payload: bar }
  const initialState = {
    instruments: {
      MSFT: {
        quantity: new Decimal(50),
        value: new Decimal(2500),
        price: new Decimal(50)
      }
    },
    total: new Decimal(2500)
  }

  const actual = reducer(initialState, action)
  const expect = {
    instruments: {
      [bar.identifier]: {
        quantity: new Decimal(50),
        value: new Decimal(5000),
        price: new Decimal(50)
      }
    },
    total: new Decimal(5000)
  }

  t.deepEqual(actual, expect)
})

test(`default: dont break if non-existent position`, (t) => {
  const bar = {
    identifier: 'MSFT',
    timestamp: 0,
    open: 90,
    high: 110,
    low: 90,
    close: 100
  }
  const action = { type: 'foobar', payload: bar }

  const actual = reducer(undefined, action)
  const expect = {
    instruments: {},
    total: new Decimal(0)
  }

  t.deepEqual(actual, expect)
})
