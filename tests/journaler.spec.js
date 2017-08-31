import test from 'ava'
import sinon from 'sinon'
import os from 'os'

import createMiddleware from '../lib/middleware/createJournaler'
import createMockWriteable from './util/createMockWritable'

test.beforeEach((t) => {
  t.context.store = {
    getState: sinon.spy(),
    dispatch: sinon.spy()
  }
  t.context.next = sinon.spy()
  t.context.stream = createMockWriteable()
})

test('it should be aynchronous', (t) => {
  const { store, next, stream } = t.context
  const action = { type: 'FOO', payload: {} }

  createMiddleware(stream)(store)(next)(action)

  t.false(next.called)
})

test('it should pass the intercepted action to the next', async (t) => {
  const { store, next, stream } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware(stream)(store)(next)

  await middleware(action)

  t.true(next.withArgs(action).calledOnce)
})

test('it should write the action to the stream', async (t) => {
  const { store, next, stream } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware(stream)(store)(next)

  const write = sinon.spy(t.context.stream, 'write')
  await middleware(action)

  t.true(write.calledOnce)
  t.is(write.getCall(0).args[0], JSON.stringify(action) + os.EOL)
})
