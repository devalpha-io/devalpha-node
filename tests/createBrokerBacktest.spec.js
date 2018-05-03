import test from 'ava'
import sinon from 'sinon'
import createMockStore from './util/createMockStore'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED
} from '../dist/constants'

import { createBrokerBacktest as createMiddleware } from '../dist/middleware/createBrokerBacktest'

test.beforeEach((t) => {
  const store = createMockStore({ orders: {} })
  store.dispatch = sinon.spy()
  const next = sinon.spy()

  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware(0)(store)(next)
})

test('pass the intercepted action to the next', (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  middleware(action)
  t.true(next.withArgs(action).calledOnce)
})

test('synchronously dispatch order created upon order requested', (t) => {
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

  t.true(store.dispatch.calledOnce)
  t.true(store.dispatch.firstCall.args[0].type === ORDER_CREATED)
})

test('synchronously dispatch order placed and order filled upon order created', (t) => {
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

  t.true(store.dispatch.calledTwice)
  t.true(store.dispatch.firstCall.args[0].type === ORDER_PLACED)
  t.true(store.dispatch.secondCall.args[0].type === ORDER_FILLED)
})
