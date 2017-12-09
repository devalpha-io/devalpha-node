import test from 'ava'
import _ from 'highland'
import fs from 'fs'
import path from 'path'

import run from '../lib'
import createMockClient from './util/createMockClient'
import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCELLED
} from '../lib/constants'

test.beforeEach((t) => {
  t.context.journal = path.join(process.cwd(), 'testJournal.json')
})

test.cb.serial('backtest event order', t => {

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
    strategy
  })

  setTimeout(() => {
    const expected = 'abcdedeabcdede'
    const actual = executions.join('')
    t.is(actual, expected)
    t.end()
  }, 100)

})

test.cb.serial('live trading event order', t => {

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
    journal: '',
    backtesting: false
  })

  setTimeout(() => {
    const expected = 'abcabcddddeeee'
    const actual = executions.join('')
    t.is(actual, expected)
    t.end()
  }, 1000)

})

test.cb.serial('metrics and state are objects', t => {

  const strategy = ({ state, metrics }, action) => {
    t.is(typeof (state()), 'object')
    t.is(typeof (metrics()), 'object')
    t.end()
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    journal: '',
    strategy
  })
})

test.cb.serial('metrics contains the correct properties', t => {

  const strategy = ({ metrics }, action) => {
    const actual = Object.keys(metrics()).sort()
    const expected = [
      'alpha',
      'beta',
      'calmar',
      'drawdown',
      'kurtosis',
      'omega',
      'returns',
      'sharpe',
      'skew',
      'sortino',
      'stability',
      'tail',
      'volatility'
    ].sort()
    t.deepEqual(actual, expected)
    t.end()
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    journal: '',
    strategy
  })
})

test.cb.serial('failing orders are dispatched', t => {
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
    journal: '',
    backtesting: false
  })

})

test.cb.serial('orders are cancellable', t => {
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
    journal: '',
    backtesting: false
  })

})

test.cb.serial('should not be able to cancel unknown orders', t => {
  const strategy = async ({ cancel }, action) => {
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
    journal: '',
    backtesting: false
  })

})

test.cb.serial('correctly preloads stored state', (t) => {

  run({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, 'event 1')
        }, 0)
        setTimeout(() => {
          push(null, 'event 2')
        }, 1)
      })
    },
    initialStates: {
      capital: {
        cash: 999
      }
    },
    client: createMockClient(),
    strategy: () => {},
    journal: t.context.journal,
    backtesting: false
  })

  setTimeout(() => {
    run({
      feeds: {
        example: _((push, next) => {
          setTimeout(() => {
            push(null, 'event 1')
          }, 0)
        })
      },
      client: createMockClient(),
      strategy: ({ state }) => {
        const actual = state().capital.cash
        const expected = 999

        fs.unlinkSync(t.context.journal)

        t.is(actual, expected)
        t.end()
      },
      journal: t.context.journal,
      backtesting: false
    })
  }, 500)

})
