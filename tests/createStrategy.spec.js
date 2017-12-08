import test from 'ava'
import sinon from 'sinon'
import { Map, List, fromJS, is } from 'immutable'
import moment from 'moment'
import {
  ORDER_REQUESTED,
  ORDER_CANCEL
} from '../lib/constants'

import createMiddleware, {
  updateHistory
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

test('pass the intercepted action to the next', async (t) => {
  const { middleware, next } = t.context
  const action = { type: 'FOO', payload: {} }
  await middleware(action)
  t.true(next.withArgs(action).calledOnce)
})

test('updateHistory pushes state to history if history is empty', async (t) => {
  const timestamp = parseInt(moment('2000-01-01 04:00').format('X'), 10)
  const action = {
    type: 'FOO',
    payload: { timestamp }
  }
  const state = Map({ timestamp })
  const history = List()

  const actual = updateHistory(state, history, action)
  const expect = fromJS([state])

  t.true(is(actual, expect))
})

test('updateHistory pushes state to history the day differs', async (t) => {
  const t1 = parseInt(moment('2000-01-01 04:00').format('X'), 10)
  const t2 = parseInt(moment('2000-01-02 04:00').format('X'), 10)

  const action = {
    type: 'FOO',
    payload: { timestamp: t2 }
  }
  const state = Map({ timestamp: t2 })
  const history = List([
    Map({ timestamp: t1 })
  ])

  const actual = updateHistory(state, history, action)
  const expect = List([
    Map({ timestamp: t1 }),
    Map({ timestamp: t2 })
  ])

  t.true(is(actual, expect))
})

test('updateHistory updates most recent if days are the same', async (t) => {
  const t1 = parseInt(moment('2001-01-01 02:00').format('X'), 10)
  const t2 = parseInt(moment('2001-01-01 02:00').format('X'), 10)

  const action = {
    type: 'FOO',
    payload: { timestamp: t2 }
  }
  const state = Map({ timestamp: t2 })
  const history = List([
    Map({ timestamp: t1 })
  ])

  const actual = updateHistory(state, history, action)
  const expect = List([
    Map({ timestamp: t2 })
  ])

  t.true(is(actual, expect))
})
