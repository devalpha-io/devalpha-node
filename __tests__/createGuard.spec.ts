import Decimal from 'decimal.js'
import {
  ORDER_CREATED,
  ORDER_REJECTED
} from '../lib/constants'

import { createGuard as createMiddleware } from '../lib/middleware/createGuard'
import { createMockStore } from './util/createMockStore'

import rootReducer from '../lib/reducers'

const t = { context: {} }

beforeEach(() => {
  t.context.store = {
    getState: jest.fn(),
    dispatch: jest.fn()
  }
  t.context.next = jest.fn()
  t.context.settings = {
    shorting: false,
    margin: false,
    restricted: []
  }
})

test('pass the intercepted action to the next', () => {
  const { store, next } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware()(store)(next)

  middleware(action)

  expect(next.mock.calls[0][0]).toBe(action)
})

test('reject order if placed on restricted asset', () => {
  const { store, next } = t.context
  const order = {
    identifier: '123',
    price: new Decimal(100),
    quantity: new Decimal(100),
    commission: new Decimal(5)
  }
  const action = { type: ORDER_CREATED, payload: order }

  const middleware = createMiddleware({
    restricted: ['123', '456']
  })(store)(next)

  middleware(action)

  const actual = next.mock.calls[0][0]
  const expected = {
    type: ORDER_REJECTED,
    payload: order
  }

  expect(actual).toEqual(expected)
})

test('reject sell order if instrument not owned and shorting is disallowed', () => {
  const next = t.context.next
  
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)

  const order = {
    identifier: '123',
    price: new Decimal(100),
    quantity: new Decimal(-100),
    commission: new Decimal(5)
  }
  const action = { type: ORDER_CREATED, payload: order }

  const middleware = createMiddleware({
    shorting: false
  })(store)(next)

  middleware(action)

  expect(next.mock.calls.length).toBe(1)
  expect(next.mock.calls[0][0].type).toBe(ORDER_REJECTED)
})

test('reject short order if instrument owned and shorting is disallowed', () => {
  const next = t.context.next
  
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(Object.assign(initialState, {
    positions: {
      instruments: {
        'GOOG': {
          quantity: new Decimal(1),
          value: new Decimal(1),
          price: new Decimal(1)
        }
      }
    }
  }))

  const order = {
    identifier: 'GOOG',
    price: new Decimal(1),
    quantity: new Decimal(-2),
    commission: new Decimal(2)
  }
  const action = { type: ORDER_CREATED, payload: order }

  const middleware = createMiddleware({
    shorting: false
  })(store)(next)

  middleware(action)

  expect(next.mock.calls.length).toBe(1)
  expect(next.mock.calls[0][0].type).toBe(ORDER_REJECTED)
})

test('reject order if it buying on margin is disallowed', () => {
  const next = t.context.next
  
  const initialState = rootReducer(undefined, { type: 'foobar', payload: {} })
  const store = createMockStore(initialState)

  const order = {
    identifier: '123',
    price: new Decimal(100),
    quantity: new Decimal(100),
    commission: new Decimal(5)
  }
  const action = { type: ORDER_CREATED, payload: order }

  const middleware = createMiddleware({
    margin: false
  })(store)(next)

  middleware(action)

  expect(next.mock.calls.length).toBe(1)
  expect(next.mock.calls[0][0].type).toBe(ORDER_REJECTED)
})
