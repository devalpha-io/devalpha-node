import { createMockStore } from './util/createMockStore'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED
} from '../lib/constants'

import { createBrokerBacktest as createMiddleware } from '../lib/middleware/createBrokerBacktest'

const t = { context: {} }

beforeEach(() => {
  const store = createMockStore({ orders: {} })
  store.dispatch = jest.fn()
  const next = jest.fn()

  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware(0)(store)(next)
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

test('can use function as calculateCommission', () => {
  const { store, next } = t.context
  const middleware = createMiddleware(() => 5)(store)(next)
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

test('synchronously dispatch order placed and order filled upon order created', () => {
  const { middleware, store } = t.context
  const action = {
    type: ORDER_CREATED,
    payload: {
      identifier: 'MSFT',
      price: 100,
      quantity: 100,
      commission: 0,
      timestamp: 0
    }
  }
  middleware(action)

  expect(store.dispatch.mock.calls.length).toBe(2)
  expect(store.dispatch.mock.calls[0][0].type).toBe(ORDER_PLACED)
  expect(store.dispatch.mock.calls[1][0].type).toBe(ORDER_FILLED)
})
