import test from 'ava'
import sinon from 'sinon'
import { Map } from 'immutable'
import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../lib/constants'

import createMiddleware from '../lib/middleware/createStrategy'

test.beforeEach((t) => {
  const store = {
    getState: sinon.spy(() => Map()),
    dispatch: sinon.spy()
  }
  const next = sinon.spy()

  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware(() => {}, () => {})(store)(next)
})

test('pass the intercepted action to the next', (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  middleware(action)
  t.true(next.withArgs(action).calledOnce)
})

test.cb('order() should synchronously dispatch order requested', (t) => {
  const { store, next } = t.context
  const action = { type: 'FOO', payload: {} }
  createMiddleware(({ order }) => {
    order()

    t.true(store.dispatch.calledOnce)
    t.true(store.dispatch.firstCall.args[0].type === ORDER_REQUESTED)

    t.end()
  }, () => {})(store)(next)(action)
})

test.cb('cancel() should synchronously dispatch order cancel', (t) => {
  const { store, next } = t.context
  const action = { type: 'FOO', payload: {} }
  createMiddleware(({ cancel }) => {
    cancel()

    t.true(store.dispatch.calledOnce)
    t.true(store.dispatch.firstCall.args[0].type === ORDER_CANCEL)

    t.end()
  }, () => {})(store)(next)(action)
})

test('pass the intercepted action to the next', (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  middleware(action)
  t.true(next.withArgs(action).calledOnce)
})
