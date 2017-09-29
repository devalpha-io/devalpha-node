import test from 'ava'
import _ from 'highland'
import run from '../lib'
import createMockClient from './util/createMockClient'
import createMockWritable from './util/createMockWritable'
import {
  ORDER_PLACED,
  ORDER_FILLED
} from '../lib/constants'

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
    const expected = 'abcabcdededede'
    const actual = executions.join('')
    t.is(actual, expected)
    t.end()
  }, 1000)

})
