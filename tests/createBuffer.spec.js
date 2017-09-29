import test from 'ava'
import sinon from 'sinon'

import createBuffer from '../lib/createBuffer'

test.beforeEach((t) => {
  t.context.buffer = createBuffer()
})

test('isEmpty() returns true if buffer is empty, false otherwise', (t) => {
  const b = t.context.buffer
  t.true(b.isEmpty())
  b.push(1)
  t.false(b.isEmpty())
  b.next()
  t.true(b.isEmpty())
})

test('size() returns the number of items in the buffer', (t) => {
  const b = t.context.buffer
  t.is(b.size(), 0)
  b.push(1)
  t.is(b.size(), 1)
  b.push(2)
  t.is(b.size(), 2)
  b.next()
  t.is(b.size(), 1)
  b.next()
  t.is(b.size(), 0)
  b.next()
  t.is(b.size(), 0)
})

test('next() lets pointers stay unchanged if there are no enqueued items', (t) => {
  const b = t.context.buffer
  const expected = [b.getCurrent(), b.getInput()]
  b.next() /* should not crash nor modify pointers */
  const actual = [b.getCurrent(), b.getInput()]
  t.deepEqual(actual, expected)
})

test('next() returns the next item and increases current pointer', (t) => {
  const b = t.context.buffer
  b.push(1)
  const expected = b.getCurrent() + 1
  b.next()
  const actual = b.getCurrent()
  t.is(actual, expected)
})

test('notifyListeners() actually notifies listeners', (t) => {
  const b = t.context.buffer
  const listener = sinon.spy()
  b.subscribe(listener)
  b.notifyListeners()

  t.true(listener.calledOnce)
})

test('push() increases input index', (t) => {
  const b = t.context.buffer
  const expected = b.getInput() + 1
  b.push(1)
  const actual = b.getInput()
  t.is(actual, expected)
})
