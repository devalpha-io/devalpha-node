import test from 'ava'
import sinon from 'sinon'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { Map } from 'immutable'

import createMiddleware from '../lib/middleware/createJournaler'

test.beforeEach((t) => {
  t.context.store = {
    getState: () => Map({ foo: 'bar' }),
    dispatch: sinon.spy()
  }
  t.context.next = sinon.spy()
  t.context.filename = path.join(process.cwd(), 'createJournalerExample.json')
})

test('be aynchronous', (t) => {
  const { store, next, filename } = t.context
  const action = { type: 'FOO', payload: {} }

  createMiddleware(filename)(store)(next)(action)

  t.false(next.called)
})

test('pass the intercepted action to the next', async (t) => {
  const { store, next, filename } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware(filename)(store)(next)

  await middleware(action)

  t.true(next.withArgs(action).calledOnce)
})

test.cb('write the current state to the file', (t) => {
  const { store, next, filename } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware(filename)(store)(next)

  middleware(action).then(() => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) throw err

      fs.unlinkSync(t.context.filename)

      const expect = JSON.stringify(store.getState().toJS())
      const actual = data

      t.is(expect, actual)
      t.end()
    })
  }).catch((e) => { throw e })
})

test('reject on faulty filename', async (t) => {
  const { store, next } = t.context
  const action = { type: 'FOO', payload: {} }
  const middleware = createMiddleware(1337)(store)(next)

  try {
    await middleware(action)
  } catch (e) {
    t.pass()
  }
})
