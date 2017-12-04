import test from 'ava'
import sinon from 'sinon'

import createMiddleware from '../lib/middleware/createMetrics'
import {
  FINISHED
} from '../lib/constants'

test.beforeEach((t) => {
  const store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  const next = sinon.spy()

  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware()(store)(next)
})

test('pass the intercepted action to the next', async (t) => {
  const { middleware, store, next } = t.context
  const action = { type: 'FOO', payload: {} }

  middleware(action)

  t.true(next.withArgs(action).calledOnce)
})

test(`decorate payload with metrics on ${FINISHED}`, async (t) => {
  const { middleware, store, next } = t.context
  const action = {
    type: FINISHED,
    payload: {}
  }

  middleware(action)

  const actual = next.firstCall.args[0]
  const expect = {
    type: FINISHED,
    payload: {
      returns: 0,
      drawdown: 0,
      alpha: 0,
      beta: 0,
      sharpe: 0,
      sortino: 0,
      volatility: 0
    }
  }

  t.deepEqual(actual, expect)
})

test(`decorate payload with metrics on ${FINISHED}`, async (t) => {
  const { middleware, next } = t.context
  const action = {
    type: FINISHED,
    payload: {}
  }

  middleware(action)

  const actual = next.firstCall.args[0]
  const expect = {
    type: FINISHED,
    payload: {
      returns: 0,
      drawdown: 0,
      alpha: 0,
      beta: 0,
      sharpe: 0,
      sortino: 0,
      volatility: 0
    }
  }

  t.deepEqual(actual, expect)
})

