import test from 'ava'
import _ from 'highland'
import run from '../lib'
import createMockClient from './util/createMockClient'
import createMockWritable from './util/createMockWritable'
import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCELLED
} from '../lib/constants'

test.cb('backtest event order', t => {

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
    initialStates: {
      capital: {
        cash: 9999999
      }
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

test.cb('live trading event order', t => {

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
    initialStates: {
      capital: {
        cash: 9999999
      }
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
    t.is(typeof (state()), 'object')
    t.is(typeof (metrics()), 'object')
    t.end()
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    journal: createMockWritable(),
    strategy
  })
})

test.cb('metrics contains the correct properties', t => {

  const strategy = ({ state, metrics, order, cancel }, action) => {
    const actual = Object.keys(metrics())
    const expected = ['returns', 'drawdown', 'alpha', 'beta', 'sharpe', 'sortino', 'volatility']
    t.deepEqual(actual, expected)
    t.end()
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    journal: createMockWritable(),
    strategy
  })
})

test.cb('failing orders are dispatched', t => {
  const strategy = ({ order }, action) => {
    switch (action.type) {
    case 'example':
      order({
        identifier: 'GOOG',
        price: 100,
        quantity: 50
      })
      break
    case ORDER_FAILED:
      t.end()
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
      })
    },
    initialStates: {
      capital: {
        cash: 9999999
      }
    },
    client: createMockClient(true),
    strategy,
    journal: createMockWritable(),
    backtesting: false
  })

})

test.cb('orders are cancellable', t => {
  const strategy = async ({ order, cancel, state }, action) => {
    switch (action.type) {
    case 'example':
      order({
        identifier: 'GOOG',
        price: 100,
        quantity: 50
      })
      break
    case ORDER_PLACED:
      cancel('1')
      break
    case ORDER_CANCELLED:
      const actual = state().orders
      const expected = {}
      t.deepEqual(actual, expected)
      t.end()
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
      })
    },
    initialStates: {
      capital: {
        cash: 9999999
      }
    },
    client: createMockClient(),
    strategy,
    journal: createMockWritable(),
    backtesting: false
  })

})

test.cb('should not be able to cancel unknown orders', t => {
  const strategy = async ({ order, cancel, state }, action) => {
    switch (action.type) {
    case 'example':
      cancel('1')
      break
    case ORDER_FAILED:
      t.end()
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
      })
    },
    client: createMockClient(true),
    strategy,
    journal: createMockWritable(),
    backtesting: false
  })

})
