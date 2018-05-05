import Decimal from 'decimal.js'
import { positionsReducer as reducer } from '../lib/reducers/positionsReducer'
import {
  INITIALIZED,
  ORDER_FILLED
} from '../lib/constants'

const t = { context: {} }

test('return the initial state', () => {
  const actual = reducer(undefined, {})
  const expected = {
    instruments: {},
    total: new Decimal(0)
  }
  expect(actual).toEqual(expected)
})

test(`set initial values on ${INITIALIZED}`, () => {
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
  const expected = {
    instruments: {
      foo: 'bar'
    },
    total: new Decimal(10)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, new position: add position to the state`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(50),
    price: new Decimal(110),
    commission: new Decimal(5.5)
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder } }

  const actual = reducer(undefined, action)
  const expected = {
    instruments: {
      [placedOrder.identifier]: {
        quantity: new Decimal(50),
        value: new Decimal(5500),
        price: new Decimal(110)
      }
    },
    total: new Decimal(5500)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, sell-side, existing position: only update quantity and value, not price`, () => {
  const placedOrder = {
    id: '1',
    identifier: 'MSFT',
    quantity: -25,
    price: 110,
    commission: 5.5
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder } }
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
  const expected = {
    instruments: {
      [placedOrder.identifier]: {
        quantity: new Decimal(25),
        value: new Decimal(2750),
        price: new Decimal(100)
      }
    },
    total: new Decimal(2750)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, buy-side, existing position: correctly update price, quantity and value`, () => {
  const placedOrder = {
    id: '1',
    identifier: 'MSFT',
    quantity: 50,
    price: 110,
    commission: 5.5
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder } }
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
  const expected = {
    instruments: {
      [placedOrder.identifier]: {
        quantity: new Decimal(100),
        value: new Decimal(11000),
        price: new Decimal(105)
      }
    },
    total: new Decimal(11000)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, sell-side, existing position: delete the position if quantity 0`, () => {
  const placedOrder = {
    id: '1',
    identifier: 'MSFT',
    quantity: -50,
    price: 110,
    commission: 5.5
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder } }
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

  expect(reducer(initialState, action).instruments[placedOrder.identifier]).toBe(undefined)
})

test(`default: correctly update price, quantity and value`, () => {
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
  const expected = {
    instruments: {
      [bar.identifier]: {
        quantity: new Decimal(50),
        value: new Decimal(5000),
        price: new Decimal(50)
      }
    },
    total: new Decimal(5000)
  }

  expect(actual).toEqual(expected)
})

test(`default: dont break if non-existent position`, () => {
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
  const expected = {
    instruments: {},
    total: new Decimal(0)
  }

  expect(actual).toEqual(expected)
})
