import test from 'ava'
import sinon from 'sinon'

import createMiddleware from '../lib/middleware/createGuard'

test.beforeEach((t) => {
  t.context.store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  t.context.next = sinon.spy()
})

test('pass the intercepted action to the next', async (t) => {
  const { store, next, stream } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware(stream)(store)(next)

  await middleware(action)

  t.true(next.withArgs(action).calledOnce)
})
