import {
  ORDER_CREATED,
  ORDER_REJECTED
} from '../lib/constants'

import { createGuard as createMiddleware } from '../lib/middleware/createGuard'

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
    price: 100,
    quantity: 100,
    commission: 5
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
