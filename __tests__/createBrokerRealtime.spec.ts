import Decimal from 'decimal.js'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FAILED,
  ORDER_CANCEL,
  ORDER_CANCELLED
} from '../lib/constants'

import { rootReducer } from '../lib/reducers'

import { createMockStore } from './util/createMockStore'
import { createMockClient } from './util/createMockClient'

import { createBrokerRealtime as createMiddleware } from '../lib/middleware/createBrokerRealtime'

test('pass the intercepted action to the next', () => {
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)
  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient())(store)(next)
  
  const action = { type: 'FOO', payload: {} }
  middleware(action)
  expect(next.mock.calls[0][0]).toBe(action)
})

test('synchronously dispatch order created upon order requested', () => {
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)
  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient())(store)(next)
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: 'GOOG',
      quantity: new Decimal(10),
      price: new Decimal(20),
      timestamp: 0
    }
  }
  middleware(action)

  expect(store.dispatch.mock.calls.length).toBe(1)
  expect(store.dispatch.mock.calls[0][0].type).toBe(ORDER_CREATED)
})

test('asynchronously dispatch order placed upon order created', done => {
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)
  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient())(store)(next)
  const action = {
    type: ORDER_CREATED,
    payload: {
      id: '2',
      identifier: 'GOOG',
      price: 100,
      quantity: 100,
      commission: 10
    }
  }
  middleware(action)

  expect(store.dispatch.mock.calls.length).toBe(0)
  setTimeout(() => {
    expect(store.dispatch.mock.calls[0][0].type).toBe(ORDER_PLACED)
    done()
  }, 20)
})

test('build limit orders', () => {
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)
  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient())(store)(next)
  const timestamp = Date.now()
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: 'MSFT',
      quantity: 10,
      price: 20,
      timestamp
    }
  }
  middleware(action)

  const actual = store.dispatch.mock.calls[0][0].payload
  const expected = {
    identifier: 'MSFT',
    quantity: new Decimal(10),
    price: new Decimal(20),
    commission: new Decimal(0),
    timestamp
  }
  expect(actual).toEqual(expected)
})

test(`dispatch ${ORDER_FAILED} if order fails`, (done) => {
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)
  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient(true))(store)(next)
  const timestamp = Date.now()
  const action = {
    type: ORDER_CREATED,
    payload: {
      identifier: 'MSFT',
      quantity: 10,
      price: 20,
      timestamp
    }
  }
  
  expect(store.dispatch.mock.calls.length).toBe(0)
  setTimeout(() => {
    const actual = store.dispatch.mock.calls[0][0].type
    expect(actual).toBe(ORDER_FAILED)
    done()
  }, 300)

  middleware(action)
})


test(`dispatch ${ORDER_CANCELLED} if cancelling succeeds`, (done) => {
  const id = '2'
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore({
    ...initialState,
    orders: {
      [id]: {
        id,
        identifier: 'GOOG',
        price: 100,
        quantity: 100,
        commission: 100
      }
    }
  })

  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient())(store)(next)
  const timestamp = Date.now()
  const action = {
    type: ORDER_CANCEL,
    payload: {
      id
    }
  }

  expect(store.dispatch.mock.calls.length).toBe(0)
  setTimeout(() => {
    const actual = store.dispatch.mock.calls[0][0].type
    expect(actual).toBe(ORDER_CANCELLED)
    done()
  }, 300)

  middleware(action)
})


test(`dispatch ${ORDER_FAILED} if cancelling fails even though we have an order placed`, (done) => {
  const next = jest.fn()
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore({
    ...initialState,
    orders: {
      '1': {
        identifier: 'MSFT',
        quantity: new Decimal(10),
        price: new Decimal(20),
        commission: new Decimal(0),
        timestamp
      }
    }
  })
  store.dispatch = jest.fn()
  const middleware = createMiddleware(createMockClient(true))(store)(next)
  const timestamp = Date.now()
  const action = {
    type: ORDER_CANCEL,
    payload: {
      id: '1'
    }
  }
  
  expect(store.dispatch.mock.calls.length).toBe(0)
  setTimeout(() => {
    const actual = store.dispatch.mock.calls[0][0].type
    expect(actual).toBe(ORDER_FAILED)
    done()
  }, 300)

  middleware(action)
})
