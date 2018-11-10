import * as _ from 'highland'
import Decimal from 'decimal.js'
import {
  createConsumer
} from '../lib/util/consumers'
import {
  createMockStore
} from './util/createMockStore'

let store

beforeEach(() => {
  store = createMockStore()
})

test('createConsumer pushes errors', (done) => {
  const errors = []
  const items = []

  const middleware = store => next => action => next({})

  _.fromError(new Error('error')).concat([1, 2, 3])
    .consume(createConsumer(store)(middleware))
    .errors((err) => {
      errors.push(err)
    })
    .each((item) => {
      items.push(item)
    })
    .done(() => {
      expect(errors.length).toBe(1)
      expect(items.length).toBe(3)

      done()
    })
})

test('createConsumer pushes the current item if next() is not supplied a new item', (done) => {
  const items = []
  const middleware = store => next => action => next()

  _([1, 2, 3])
    .consume(createConsumer(store)(middleware))
    .each((item) => {
      items.push(item)
    })
    .done(() => {
      expect(items).toEqual([1, 2, 3])

      done()
    })
})
