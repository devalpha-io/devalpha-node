import test from 'ava'
import sinon from 'sinon'
import Decimal from 'decimal.js'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FAILED
} from '../dist/constants'

import createMockClient from './util/createMockClient'

import { createBrokerRealtime as createMiddleware } from '../dist/middleware/createBrokerRealtime'

test.beforeEach((t) => {
  const store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  const next = sinon.spy()
  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware(createMockClient())(store)(next)
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

test.cb('asynchronously dispatch order placed upon order created', (t) => {
  const { middleware, store } = t.context
  const action = { type: ORDER_CREATED, payload: {} }
  middleware(action)

  t.true(store.dispatch.firstCall === null)
  setTimeout(() => {
    t.true(store.dispatch.firstCall.args[0].type === ORDER_PLACED)
    t.end()
  }, 20)
})

test('build limit orders', (t) => {
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

  const actual = store.dispatch.firstCall.args[0].payload
  const expect = {
    identifier: 'MSFT',
    quantity: new Decimal(10),
    price: new Decimal(20),
    commission: new Decimal(0),
    timestamp
  }
  t.deepEqual(actual, expect)
})
