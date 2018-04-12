import test from 'ava'
import _ from 'highland'

import {
  createRealtimeStream,
  createBacktestStream
} from '../dist/streams'

test.cb('createRealtimeStream returns a merged stream of Redux actions', (t) => {
  const streams = {
    foo: _(['FOO']),
    bar: _(['BAR'])
  }
  const merged = createRealtimeStream(streams)
  const actions = []

  merged
    .each((x) => actions.push(x))
    .done(() => {
      const actual1 = actions[0]
      const actual2 = actions[1]

      const expect1 = { type: 'foo', payload: 'FOO' }
      const expect2 = { type: 'bar', payload: 'BAR' }

      t.deepEqual(actual1, expect1)
      t.deepEqual(actual2, expect2)

      t.end()
    })
})

test.cb('createRealtimeStream runs event in arbitrary order', (t) => {
  let i1
  let i2

  const streams = {
    foo: _((push, next) => {
      i1 = setInterval(() => {
        push(null, 'a')
      }, 100)
    }),
    bar: _((push, next) => {
      i2 = setInterval(() => {
        push(null, 'b')
      }, 50)
    })
  }
  const merged = createRealtimeStream(streams)
  const actions = []

  setTimeout(() => {
    clearInterval(i1)
    clearInterval(i2)

    const actual = actions.map((x) => x.payload).join('')
    const expect = 'babbabbab'

    t.is(actual, expect)

    t.end()
  }, 325)

  merged.each((x) => actions.push(x))
})

test.cb('createBacktestStream returns a sorted stream of Redux actions', (t) => {
  const streams = {
    foo: _([{ timestamp: 10 }]),
    bar: _([{ timestamp: 5 }]),
    baz: _([{}]),
    qux: _([{}]),
    quux: _([{ timestamp: 15 }]),
    corge: _([{ timestamp: 10 }]),
    grault: _([{ timestamp: -Infinity }])
  }
  const sorted = createBacktestStream(streams)
  const actions = []

  sorted
    .each((x) => actions.push(x.type))
    .done(() => {
      const actual = actions
      const expect = [
        'grault',
        'bar',
        'foo',
        'corge',
        'quux',
        'baz',
        'qux'
      ]

      t.deepEqual(actual, expect)
      t.end()
    })
})

test.cb('createBacktestStream does not emit errors', (t) => {
  const streams = {
    foo: _.fromError(new Error())
  }
  const merged = createBacktestStream(streams)
  const actions = []

  merged
    .each((x) => actions.push(x.type))
    .done(() => {
      const actual = actions
      const expect = []

      t.deepEqual(actual, expect)
      t.end()
    })
})
