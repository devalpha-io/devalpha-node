import Decimal from 'decimal.js'
import {
  createOrderCreator,
  createOrder
} from '../lib/util/orders'
import {
  createMockStore
} from './util/createMockStore'

let calculateCommission: Function
let store

beforeEach(() => {
  calculateCommission = () => 10
  store = createMockStore()
})

test('createOrderCreator returns correct function', () => {
  const actual = typeof createOrderCreator(store)(calculateCommission)
  const expected = 'function'

  expect(actual).toBe(expected)
})

test('createOrder throws on missing timestamp', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    price: 100,
    quantity: 100
  })).toThrow()
})

test('createOrder throws on missing identifier', () => {
  expect(() => createOrder(store)(calculateCommission)({
    timestamp: 100,
    price: 100,
    quantity: 100
  })).toThrow()
})

test('createOrder throws on missing quantity', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    price: 100
  })).toThrow()
})

test('createOrder throws on missing price', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    quantity: 100
  })).toThrow()
})

test('createOrder does not support percentage orders', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    price: 100,
    percent: 0.5
  })).toThrow()
})

test('createOrder does not support trailing stop loss orders', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    price: 100,
    threshold: 0.5,
    quantity: 100
  })).toThrow()
})

test('createOrder does not support fixed price stop loss orders', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    trigger: 100,
    price: 100,
    quantity: 100
  })).toThrow()
})

test('createOrder throws if both quantity and percent is specified', () => {
  expect(() => createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    quantity: 100,
    percent: 0.5
  })).toThrow()
})

test('createOrder returns a proper order', () => {
  const actual = createOrder(store)(calculateCommission)({
    identifier: 'GOOG',
    timestamp: 100,
    price: 100,
    quantity: 100
  })
  const expected = {
    identifier: 'GOOG',
    timestamp: 100,
    price: new Decimal(100),
    quantity: new Decimal(100),
    commission: new Decimal(10)
  }
  expect(actual).toEqual(expected)
})
