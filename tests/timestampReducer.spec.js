import test from 'ava'
import {
  INITIALIZED
} from '../dist'

import { timestampReducer as reducer } from '../dist/reducers/timestampReducer'

test('return the initial state', (t) => {
  const actual = reducer(undefined, {
    type: INITIALIZED,
    payload: {
      timestamp: 0
    }
  })
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
