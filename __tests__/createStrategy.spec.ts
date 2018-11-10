import { ORDER_REQUESTED, ORDER_CANCEL } from "../lib/constants"

import { createStrategy as createMiddleware } from "../lib/middleware/createStrategy"

const t = { context: {} } as any

beforeEach(() => {
  const store = {
    getState: jest.fn(() => {}),
    setState: jest.fn(() => {}),
    dispatch: jest.fn()
  }
  const next = jest.fn()

  t.context.store = store
  t.context.next = next
  t.context.middleware = createMiddleware(() => {})(store)(next)
})

test("pass the intercepted action to the next", () => {
  const { middleware, next } = t.context
  const action = { type: "FOO", payload: {} }
  middleware(action)
  expect(next.mock.calls[0][0]).toBe(action)
})

test("order() should synchronously dispatch order requested", done => {
  const { store, next } = t.context
  const action = { type: "FOO", payload: { timestamp: 0 } }
  createMiddleware(({ order }) => {
    order({
      identifier: "a",
      price: 0,
      quantity: 1
    })

    expect(store.dispatch.mock.calls.length).toBe(1)
    expect(store.dispatch.mock.calls[0][0].type === ORDER_REQUESTED).toBe(true)

    done()
  })(store)(next)(action)
})

test("cancel() should synchronously dispatch order cancel", done => {
  const { store, next } = t.context
  const action = { type: "FOO", payload: { timestamp: 0 } }
  createMiddleware(({ cancel }) => {
    cancel("1")

    expect(store.dispatch.mock.calls.length).toBe(1)
    expect(store.dispatch.mock.calls[0][0].type === ORDER_CANCEL).toBe(true)

    done()
  })(store)(next)(action)
})
