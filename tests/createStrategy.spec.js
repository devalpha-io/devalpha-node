import test from 'ava'
import sinon from 'sinon'
import { Map, List, fromJS } from 'immutable'
import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../lib/constants'

import createMiddleware, {
  getReturns,
  getDrawdown,
  getSharpeRatio,
} from '../lib/middleware/createStrategy'

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

test('pass the intercepted action to the next', async (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  await middleware(action)
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

test('getReturns correctly calculates returns', (t) => {
  const history = fromJS([
    {
      positions: { total: 47 },
      capital: { total: 31 }
    },
    {
      positions: { total: 53 },
      capital: { total: 51 }
    }
  ])

  const actual = getReturns(history)
  const expect = 0.3333333333333333
  t.is(actual, expect)
})

test('getDrawdown correctly calculates drawdown', (t) => {
  const history = fromJS([
    {
      positions: { total: 2801.38 },
      capital: { total: 1768 }
    },
    {
      positions: { total: 1001.38 },
      capital: { total: 1788 }
    }
  ])

  const actual = getDrawdown(history)
  const expect = 0.3895495668996669
  t.is(actual, expect)
})

test('getSharpeRatio correctly calculates Sharpe ratio', (t) => {
  const history = fromJS([
    {
      positions: { total: 220 },
      capital: { total: 0 }
    },
    {
      positions: { total: 230 },
      capital: { total: 0 }
    },
    {
      positions: { total: 225 },
      capital: { total: 0 }
    },
  ])

  const actual = getSharpeRatio(history)
  const expect = 0.24956709924231088

  t.is(actual, expect)
})
