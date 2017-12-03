import test from 'ava'
import sinon from 'sinon'

import createMiddleware from '../lib/middleware/createGuard'
import {
  ORDER_REQUESTED,
  ORDER_REJECTED
} from '../lib/constants'

test.beforeEach((t) => {
  const store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  const next = sinon.spy()

  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware({}, () => {})(store)(next)
})

test('pass the intercepted action to the next', async (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  await middleware(action)
  t.true(next.withArgs(action).calledOnce)
})

test('allow placing orders on non-restricted assets', async (t) => {
  const { store } = t.context
  const next = sinon.spy()
  const middleware = createMiddleware({
    restricted: ['555']
  })(store)(next)
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: '123',
      quantity: 100,
      price: 100
    }
  }
  await middleware(action)

  const actual = next.firstCall.args[0].type
  const expected = ORDER_REQUESTED

  t.is(actual, expected)
})

test('prevent placing orders on restricted assets', async (t) => {
  const { store } = t.context
  const next = sinon.spy()
  const middleware = createMiddleware({
    restricted: ['123']
  })(store)(next)
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: '123',
      quantity: 100,
      price: 100
    }
  }
  await middleware(action)

  const actual = next.firstCall.args[0].type
  const expected = ORDER_REJECTED

  t.is(actual, expected)
})

test('prevent placing short orders when longOnly is set', async (t) => {
  const { store } = t.context
  const next = sinon.spy()
  const middleware = createMiddleware({
    restricted: ['123']
  })(store)(next)
  const action = {
    type: ORDER_REQUESTED,
    payload: {
      identifier: '123',
      quantity: -100,
      price: 100
    }
  }
  await middleware(action)

  const actual = next.firstCall.args[0].type
  const expected = ORDER_REJECTED

  t.is(actual, expected)
})
