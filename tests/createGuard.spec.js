import test from 'ava'
import sinon from 'sinon'

import {
  ORDER_CREATED,
  ORDER_REJECTED
} from '../lib/constants'

import createMiddleware from '../lib/middleware/createGuard'

test.beforeEach((t) => {
  t.context.store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  t.context.next = sinon.spy()
  t.context.settings = {
    shorting: false,
    margin: false,
    restricted: []
  }
})

test('pass the intercepted action to the next', (t) => {
  const { store, next } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware()(store)(next)

  middleware(action)

  t.true(next.withArgs(action).calledOnce)
})

test('reject order if placed on restricted asset', (t) => {
  const { store, next } = t.context
  const order = {
    identifier: '123',
    price: 100,
    quantity: 100,
    commission: 5
  }
  const action = { type: ORDER_CREATED, payload: order }

  const middleware = createMiddleware({
    restricted: ['123', '456']
  })(store)(next)

  middleware(action)

  const actual = next.lastCall.args[0]
  const expect = {
    type: ORDER_REJECTED,
    payload: order
  }

  t.deepEqual(actual, expect)
})

test.todo('reject order if short and shorting is disallowed')
test.todo('reject order if margin limit will be exceeded')
