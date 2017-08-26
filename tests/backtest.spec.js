import test from 'ava'
import run from '../lib'
import {
  ORDER_PLACED,
  ORDER_FILLED
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
    }
  }

  run({
    feeds: {
      example: ['event 1', 'event 2']
    },
    backtest: {
      initialCash: 10000000
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
