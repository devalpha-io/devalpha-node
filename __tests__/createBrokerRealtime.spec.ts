import Decimal from 'decimal.js'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FAILED
} from '../lib/constants'

import { createMockClient } from './util/createMockClient'

import { createBrokerRealtime as createMiddleware } from '../lib/middleware/createBrokerRealtime'

const t = { context: {} }

beforeEach(() => {
  const store = {
    getState: jest.fn(),
    dispatch: jest.fn()
  }
  const next = jest.fn()
  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware(createMockClient())(store)(next)
})

test('pass the intercepted action to the next', () => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  middleware(action)
  expect(next.mock.calls[0][0]).toBe(action)
})

test('synchronously dispatch order created upon order requested', () => {
  const { middleware, store } = t.context
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: 'GOOG',
      quantity: 10,
      price: 20,
      timestamp: 0
    }
  }
  middleware(action)

  expect(store.dispatch.mock.calls.length).toBe(1)
  expect(store.dispatch.mock.calls[0][0].type).toBe(ORDER_CREATED)
})

test('asynchronously dispatch order placed upon order created', done => {
  const { middleware, store } = t.context
  const action = { type: ORDER_CREATED, payload: {} }
  middleware(action)

  expect(store.dispatch.mock.calls.length).toBe(0)
  setTimeout(() => {
    expect(store.dispatch.mock.calls[0][0].type).toBe(ORDER_PLACED)
    done()
  }, 20)
})

test('build limit orders', () => {
  const { middleware, store } = t.context
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
