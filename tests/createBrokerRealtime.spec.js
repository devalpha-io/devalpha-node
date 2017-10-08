import test from 'ava'
import sinon from 'sinon'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED
} from '../lib/constants'

import createMockClient from './util/createMockClient'

import createMiddleware from '../lib/middleware/createBrokerRealtime'

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

test('pass the intercepted action to the next', async (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  await middleware(action)
  t.true(next.withArgs(action).calledOnce)
})

test('synchronously dispatch order created upon order requested', async (t) => {
  const { middleware, store } = t.context
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: 'GOOG',
      quantity: 10,
      price: 20
    }
  }
  middleware(action)

  t.true(store.dispatch.calledOnce)
  t.true(store.dispatch.firstCall.args[0].type === ORDER_CREATED)
})

test('asynchronously dispatch order placed upon order created', async (t) => {
  const { middleware, store } = t.context
  const action = { type: ORDER_CREATED, payload: {} }
  await middleware(action)

  t.true(store.dispatch.calledOnce)
  t.true(store.dispatch.firstCall.args[0].type === ORDER_PLACED)
})

test('build limit orders', async (t) => {
  const { middleware, store } = t.context
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: 'MSFT',
      quantity: 10,
      price: 20
    }
  }
  await middleware(action)

  const actual = store.dispatch.firstCall.args[0].payload
  const expect = {
    identifier: 'MSFT',
    quantity: 10,
    price: 20,
    commission: 0
  }
  t.deepEqual(actual, expect)
})

test('build market orders', async (t) => {
  const { middleware, store } = t.context
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: 'MSFT',
      quantity: 10
    }
  }
  await middleware(action)

  const actual = store.dispatch.firstCall.args[0].payload
  const expect = {
    identifier: 'MSFT',
    quantity: 10,
    price: 20,
    commission: 0
  }
  t.deepEqual(actual, expect)
})
