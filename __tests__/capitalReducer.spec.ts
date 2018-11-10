import Decimal from 'decimal.js'
import { capitalReducer as reducer } from '../lib/reducers/capitalReducer'
import {
  INITIALIZED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED
} from '../lib/constants'

test('return the initial state', () => {
  const actual = reducer(undefined, { type: 'whatever', payload: { timestamp: 0 } })
  const expected = {
    cash: new Decimal(0),
    commission: new Decimal(0),
    reservedCash: new Decimal(0),
    total: new Decimal(0)
  }
  expect(actual).toEqual(expected)
})

test(`set initial values on ${INITIALIZED}`, () => {
  const action = {
    type: INITIALIZED,
    payload: {
      timestamp: 50,
      initialStates: {
        capital: {
          cash: 100,
          reservedCash: 101,
          commission: 102,
          total: 103
        }
      }
    }
  }

  const actual = reducer(undefined, action)
  const expected = {
    cash: new Decimal(100),
    reservedCash: new Decimal(101),
    commission: new Decimal(102),
    total: new Decimal(103)
  }

  expect(actual).toEqual(expected)
})

test(`set start capital on ${INITIALIZED}`, () => {
  const action = {
    type: INITIALIZED,
    payload: {
      timestamp: 50,
      startCapital: 100,
      initialStates: {
        capital: {
          reservedCash: 101,
          commission: 102
        }
      }
    }
  }

  const actual = reducer(undefined, action)
  const expected = {
    cash: new Decimal(100),
    reservedCash: new Decimal(101),
    commission: new Decimal(102),
    total: new Decimal(100)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_PLACED} of a sell-side order correctly edits reservedCash`, () => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: new Decimal(-50),
    price: new Decimal(110),
    commission: new Decimal(5.5),
    timestamp: 0
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action)
  const expected = {
    reservedCash: new Decimal(5.5),
    cash: new Decimal(-5.5),
    commission: new Decimal(0),
    total: new Decimal(0)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_PLACED} of a buy-side order correctly edits cash, commission and reservedCash`, () => {
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10),
    timestamp: 0
  }
  const action = { type: ORDER_PLACED, payload: order }

  const actual = reducer(undefined, action)
  const expected = Object.assign(reducer(undefined, { type: 'whatever', payload: { timestamp: 0 } }), {
    reservedCash: new Decimal(10010),
    cash: new Decimal(-10010),
    commission: new Decimal(0),
    total: new Decimal(0)
  })

  expect(actual).toEqual(expected)
})

test(`${ORDER_CANCELLED} of a sell-side order does not modify anything`, () => {
  const order = {
    id: '1',
    identifier: 'MSFT',
    quantity: new Decimal(-50),
    price: new Decimal(110),
    commission: new Decimal(5.5),
    timestamp: 0
  }
  const action = { type: ORDER_CANCELLED, payload: order }

  const actual = reducer(undefined, action)
  const expected = reducer(undefined, { type: 'whatever', payload: { timestamp: 0 } })

  expect(actual).toEqual(expected)
})

test(
  `${ORDER_CANCELLED} of a buy-side order correctly reverts cash and reservedCash,
  also doesn't change commission or total`,
  () => {
    const order = {
      id: '0',
      identifier: 'MSFT',
      quantity: new Decimal(100),
      price: new Decimal(100),
      commission: new Decimal(10),
      timestamp: 0
    }
    const action = { type: ORDER_CANCELLED, payload: order }
    const initialState = {
      cash: new Decimal(0),
      reservedCash: new Decimal(10010),
      commission: new Decimal(0),
      total: new Decimal(0)
    }

    const actual = reducer(initialState, action)
    const expected = Object.assign(reducer(initialState, { type: 'whatever', payload: { timestamp: 0 } }), {
      cash: new Decimal(10010),
      reservedCash: new Decimal(0)
    })

    expect(actual).toEqual(expected)
  }
)

test(`${ORDER_FILLED}, sell-side, should increase cash and commission, and decrease reservedCash`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(-100),
    price: new Decimal(100),
    commission: new Decimal(10),
    timestamp: new Decimal(100)
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder, timestamp: 0 } }
  const initialState = {
    cash: new Decimal(-10),
    reservedCash: new Decimal(10),
    commission: new Decimal(0),
    total: new Decimal(0)
  }

  const actual = reducer(initialState, action)
  const expected = {
    cash: new Decimal(9990),
    reservedCash: new Decimal(0),
    commission: new Decimal(10),
    total: new Decimal(9990)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, buy-side, should increase commission and decrease reservedCash`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10,
    timestamp: 100
  }
  const filledOrder = { ...placedOrder }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder, timestamp: 0 } }
  const initialState = {
    cash: new Decimal(0),
    reservedCash: new Decimal(10010),
    commission: new Decimal(0),
    total: new Decimal(10010)
  }

  const actual = reducer(initialState, action)
  const expected = {
    cash: new Decimal(0),
    reservedCash: new Decimal(0),
    commission: new Decimal(10),
    total: new Decimal(0)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, buy-side, partial fill, should increase commission and decrease reservedCash`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10),
    timestamp: new Decimal(100)
  }
  const filledOrder = {
    ...placedOrder,
    quantity: new Decimal(50),
    commission: new Decimal(5)
  }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder, timestamp: 0 } }
  const initialState = {
    cash: new Decimal(0),
    reservedCash: new Decimal(10010),
    commission: new Decimal(0),
    total: new Decimal(10010)
  }

  const actual = reducer(initialState, action)
  const expected = {
    cash: new Decimal(0),
    reservedCash: new Decimal(5005),
    commission: new Decimal(5),
    total: new Decimal(5005)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, sell-side, partial fill, increase cash and commission, and decrease reservedCash`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(-100),
    price: new Decimal(100),
    commission: new Decimal(10),
    timestamp: new Decimal(100)
  }
  const filledOrder = {
    ...placedOrder,
    quantity: new Decimal(-50),
    commission: new Decimal(5)
  }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder, timestamp: 0 } }
  const initialState = {
    cash: new Decimal(-10),
    reservedCash: new Decimal(10),
    commission: new Decimal(0),
    total: new Decimal(0)
  }

  const actual = reducer(initialState, action)
  const expected = {
    cash: new Decimal(4990),
    reservedCash: new Decimal(5),
    commission: new Decimal(5),
    total: new Decimal(4995)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, buy-side, better price, should increase commission and decrease reservedCash`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(100),
    price: new Decimal(100),
    commission: new Decimal(10),
    timestamp: new Decimal(100)
  }
  const filledOrder = {
    ...placedOrder,
    quantity: new Decimal(100),
    price: new Decimal(90),
    commission: new Decimal(9),
  }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder, timestamp: 0 } }
  const initialState = {
    cash: new Decimal(0),
    reservedCash: new Decimal(10010),
    commission: new Decimal(0),
    total: new Decimal(10010)
  }

  const actual = reducer(initialState, action)
  const expected = {
    cash: new Decimal(0),
    reservedCash: new Decimal(0),
    commission: new Decimal(9),
    total: new Decimal(0)
  }

  expect(actual).toEqual(expected)
})

test(`${ORDER_FILLED}, sell-side, better price, increase cash and commission, and decrease reservedCash`, () => {
  const placedOrder = {
    id: '0',
    identifier: 'MSFT',
    quantity: new Decimal(-100),
    price: new Decimal(100),
    commission: new Decimal(10),
    timestamp: 100
  }
  const filledOrder = {
    ...placedOrder,
    quantity: new Decimal(-100),
    price: new Decimal(110),
    commission: new Decimal(11),
  }
  const action = { type: ORDER_FILLED, payload: { placedOrder, filledOrder, timestamp: 0 } }
  const initialState = {
    cash: new Decimal(-10),
    reservedCash: new Decimal(10),
    commission: new Decimal(0),
    total: new Decimal(0)
  }

  const actual = reducer(initialState, action)
  const expected = {
    cash: new Decimal(10979),
    reservedCash: new Decimal(0),
    commission: new Decimal(11),
    total: new Decimal(10979)
  }

  expect(actual).toEqual(expected)
})
