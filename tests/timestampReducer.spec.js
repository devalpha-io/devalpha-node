import test from 'ava'

import reducer from '../lib/reducers/timestampReducer'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {})
  const expect = 0
  t.is(actual, expect)
})

test('update timestamp if valid value in payload', t => {
  const actual = reducer(50, {
    type: 'FOO',
    payload: {
      timestamp: 100
    }
  })
  const expect = 100
  t.is(actual, expect)
})

test('do not update timestamp if invalid value in payload', t => {
  const actual = reducer(50, {
    type: 'FOO',
    payload: {
      timestamp: 'foobar'
    }
  })
  const expect = 50
  t.is(actual, expect)
})

test('do not update timestamp if no timestamp in payload', t => {
  const actual = reducer(50, {
    type: 'FOO',
    payload: {}
  })
  const expect = 50
  t.is(actual, expect)
})
