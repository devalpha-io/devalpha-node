import test from 'ava'
import _ from 'highland'
import run from '../lib'
import createMockClient from './util/createMockClient'
import createMockWritable from './util/createMockWritable'
import {
  ORDER_PLACED,
  ORDER_FILLED
} from '../lib/constants'

test.skip.cb('backtest event order', t => {

  const executions = []
  const strategy = ({ state, order, cancel }, action) => {
    switch (action.type) {
    case 'example':
      executions.push('a')
      order({
        identifier: 'GOOG',
        price: 100,
        quantity: 50
      })
      executions.push('b')
      order({
        identifier: 'MSFT',
        price: 100,
        quantity: 30
      })
      executions.push('c')
      break
    case ORDER_PLACED:
      executions.push('d')
      break
    case ORDER_FILLED:
      executions.push('e')
      break
    default:
      break
    }
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    backtest: {
      initialCash: 10000000
    },
    journal: createMockWritable(),
    strategy
  })

  setTimeout(() => {
    const expected = 'abcdedeabcdede'
    const actual = executions.join('')
    t.is(actual, expected)
    t.end()
  }, 100)

})

test.skip.cb('live trading event order', t => {

  const executions = []
  const strategy = ({ order }, action) => {
    switch (action.type) {
    case 'example':
      executions.push('a')
      order({
        identifier: 'GOOG',
        price: 100,
        quantity: 50
      })
      executions.push('b')
      order({
        identifier: 'MSFT',
        price: 100,
        quantity: 50
      })
      executions.push('c')
      break
    case ORDER_PLACED:
      executions.push('d')
      break
    case ORDER_FILLED:
      executions.push('e')
      break
    default:
      break
    }
  }

  run({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, 'event 1')
        }, 0)
        setTimeout(() => {
          push(null, 'event 2')
        }, 0)
      })
    },
    backtest: {
      initialCash: 10000000
    },
    client: createMockClient(),
    strategy,
    journal: createMockWritable(),
    backtesting: false
  })

  setTimeout(() => {
    const expected = 'abcabcddddeeee'
    const actual = executions.join('')
    t.is(actual, expected)
    t.end()
  }, 1000)

})

test.cb('metrics and state are objects', t => {

  const strategy = ({ state, metrics, order, cancel }, action) => {
    t.is(typeof state, 'object')
    t.is(typeof metrics, 'object')
    t.end()
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    backtest: {
      initialCash: 10000000
    },
    journal: createMockWritable(),
    strategy
  })
})
