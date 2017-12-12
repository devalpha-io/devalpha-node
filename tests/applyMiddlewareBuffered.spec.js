import test from 'ava'
import { createStore } from 'redux'
import sinon from 'sinon'

import createBuffer from '../lib/createBuffer'
import applyMiddlewareBuffered from '../lib/applyMiddlewareBuffered'

test.beforeEach((t) => {
  t.context.error = console.error
  console.error = sinon.spy()

  t.context.buffer = createBuffer()
})

test.afterEach((t) => {
  console.error = t.context.error
})

test.cb.serial('applyMiddlewareBuffered logs error on a regular thrown Error', (t) => {
  const { buffer } = t.context
  const middleware = () => () => (action) => { throw new Error('An error occured.') }
  const store = createStore(() => ({}), undefined, applyMiddlewareBuffered(buffer, [middleware]))
  store.dispatch({ type: 'foo', payload: 'bar' })

  setTimeout(() => {
    t.true(console.error.calledOnce)

    const actual = console.error.firstCall.args[0]
    const expected = 'An error occured.'

    t.is(actual, expected)
    t.end()
  }, 20)
})

test.cb.serial('applyMiddlewareBuffered logs error on a thrown Error in an async function', (t) => {
  const { buffer } = t.context
  const middleware = () => () => async (action) => {
    await new Promise(r => setTimeout(r, 10))
    throw new Error('An error occured.')
  }
  const store = createStore(() => ({}), undefined, applyMiddlewareBuffered(buffer, [middleware]))
  store.dispatch({ type: 'foo', payload: 'bar' })

  setTimeout(() => {
    t.true(console.error.calledOnce)

    const actual = console.error.firstCall.args[0]
    const expected = 'An error occured.'

    t.is(actual, expected)
    t.end()
  }, 20)
})

test.cb.serial('applyMiddlewareBuffered logs error on a rejected Promise', (t) => {
  const { buffer } = t.context
  const middleware = () => () => (action) => new Promise((rs, rj) => {
    rj(new Error('An error occured.'))
  })
  const store = createStore(() => ({}), undefined, applyMiddlewareBuffered(buffer, [middleware]))
  store.dispatch({ type: 'foo', payload: 'bar' })

  setTimeout(() => {
    t.true(console.error.calledOnce)

    const actual = console.error.firstCall.args[0]
    const expected = 'An error occured.'

    t.is(actual, expected)
    t.end()
  }, 20)
})
