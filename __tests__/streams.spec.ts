import * as _ from 'highland'

import {
  createStreamMerged,
  createStreamSorted
} from '../lib/util/streams'

const t = { context: {} }

test('createStreamMerged returns a merged stream of Redux actions', done => {
  const streams = {
    foo: _(['FOO']),
    bar: _(['BAR'])
  }
  const merged = createStreamMerged(streams)
  const actions = []

  merged
    .each((x) => actions.push(x))
    .done(() => {
      const actual1 = actions[0]
      const actual2 = actions[1]

      const expected1 = { type: 'foo', payload: 'FOO' }
      const expected2 = { type: 'bar', payload: 'BAR' }

      expect(actual1).toEqual(expected1)
      expect(actual2).toEqual(expected2)

      done()
    })
})

test('createStreamMerged runs event in arbitrary order', done => {
  let i1
  let i2

  const streams = {
    foo: _((push, next) => {
      i1 = setInterval(() => {
        push(null, 'a')
      }, 95)
    }),
    bar: _((push, next) => {
      i2 = setInterval(() => {
        push(null, 'b')
      }, 50)
    })
  }
  const merged = createStreamMerged(streams)
  const actions = []

  setTimeout(() => {
    clearInterval(i1)
    clearInterval(i2)

    const actual = actions.map((x) => x.payload).join('')
    const expected = 'babbabbab'

    expect(actual).toEqual(expected)

    done()
  }, 325)

  merged.each((x) => actions.push(x))
})

test('createStreamSorted returns a sorted stream of Redux actions', done => {
  const streams = {
    foo: _([{ timestamp: 10 }]),
    bar: _([{ timestamp: 5 }]),
    baz: _([{}]),
    qux: _([{}]),
    quux: _([{ timestamp: 15 }]),
    corge: _([{ timestamp: 10 }]),
    grault: _([{ timestamp: -Infinity }])
  }
  const sorted = createStreamSorted(streams)
  const actions = []

  sorted
    .each((x) => actions.push(x.type))
    .done(() => {
      const actual = actions
      const expected = [
        'grault',
        'bar',
        'foo',
        'corge',
        'quux',
        'baz',
        'qux'
      ]

      expect(actual).toEqual(expected)
      done()
    })
})

test('createStreamSorted handles errors', done => {
  const streams = {
    foo: _.fromError(new Error())
  }
  const merged = createStreamSorted(streams)
  const actions = []
  const errors = []

  merged
    .doto((x) => actions.push(x))
    .errors((e) => {
      errors.push(e)
      expect(errors.length).toBe(1)
      expect(actions).toEqual([])
      done()
    })
    .resume()
})
