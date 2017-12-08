import dotenv from 'dotenv'
import test from 'ava'
import sinon from 'sinon'

import createMiddleware from '../lib/middleware/createNotifier'
import {
  INITIALIZED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED
} from '../lib/constants'

dotenv.config()

test.beforeEach((t) => {
  const store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  const next = sinon.spy()
  t.context.store = store
  t.context.next = next
})

test('pass the intercepted action to the next', async (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: process.env.SLACK_WEBHOOK_URL
  })(store)(next)
  const action = { type: 'FOO', payload: {} }
  await middleware(action)
  t.true(next.withArgs(action).calledOnce)
})

test.cb(`fires notification on ${INITIALIZED}`, (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: process.env.SLACK_WEBHOOK_URL,
    onNotify: (response) => {
      t.is(response, 'ok')
      t.end()
    }
  })(store)(next)
  const action = {
    type: INITIALIZED,
    payload: {
      startCapital: 100,
      timestamp: 100
    }
  }
  middleware(action)
})

test.cb(`fires notification on ${ORDER_PLACED}`, (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: process.env.SLACK_WEBHOOK_URL,
    onNotify: (response) => {
      t.is(response, 'ok')
      t.end()
    }
  })(store)(next)
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_PLACED, payload: order }
  middleware(action)
})

test.cb(`fires notification on ${ORDER_FILLED}`, (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: process.env.SLACK_WEBHOOK_URL,
    onNotify: (response) => {
      t.is(response, 'ok')
      t.end()
    }
  })(store)(next)
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 50,
    expectedQuantity: 50,
    price: 110,
    commission: 5.5
  }
  const action = { type: ORDER_FILLED, payload: order }
  middleware(action)
})

test.cb(`fires notification on ${ORDER_CANCELLED}`, (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: process.env.SLACK_WEBHOOK_URL,
    onNotify: (response) => {
      t.is(response, 'ok')
      t.end()
    }
  })(store)(next)
  const order = {
    id: '0',
    identifier: 'MSFT',
    quantity: 100,
    price: 100,
    commission: 10
  }
  const action = { type: ORDER_CANCELLED, payload: order }
  middleware(action)
})

test.cb('calls onError on auth error', (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: 'https://hooks.slack.com/services/XXXXXXXXX/XXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX',
    onError: (response) => {
      t.end()
    }
  })(store)(next)
  const action = { type: ORDER_CANCELLED, payload: {} }
  middleware(action)
})

test.cb('calls onError on network error', (t) => {
  const { store, next } = t.context
  const middleware = createMiddleware({
    url: 'faulty url',
    onError: (response) => {
      t.end()
    }
  })(store)(next)
  const action = { type: ORDER_CANCELLED, payload: {} }
  middleware(action)
})
