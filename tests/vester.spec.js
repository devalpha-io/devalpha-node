import test from 'ava'
import _ from 'highland'
import path from 'path'
import sinon from 'sinon'

import vester from '../lib'
import createMockClient from './util/createMockClient'
import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCELLED
} from '../lib/constants'

test.beforeEach((t) => {
  t.context.error = console.error
  console.error = sinon.spy()
})

test.afterEach((t) => {
  console.error = t.context.error
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

  vester({
    feeds: {
      example: [
        {
          value: 'event 1',
          timestamp: 100
        },
        {
          value: 'event 2',
          timestamp: 200
        }
      ]
    },
    initialStates: {
      capital: {
        cash: 9999999
      }
    },
    resume: true
  }, strategy)

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

  vester({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
        setTimeout(() => {
          push(null, { value: 'event 2', timestamp: 101 })
        }, 0)
      })
    },
    initialStates: {
      capital: {
        cash: 9999999
      }
    },
    client: createMockClient(),
    resume: true,
    backtesting: false
  }, strategy)

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
    t.is(typeof (metrics), 'object')
    t.end()
  }

  vester({
    resume: true,
    backtesting: false
  }, strategy)
})

test.cb.serial('metrics contains the correct properties', t => {

  const strategy = ({ metrics }, action) => {
    const actual = Object.keys(metrics).sort()
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

  vester({
    resume: true,
    backtesting: false
  }, strategy)
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

  vester({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
      })
    },
    initialStates: {
      capital: {
        cash: 9999999
      }
    },
    client: createMockClient(true),
    resume: true,
    backtesting: false
  }, strategy)

})

test.cb.serial('orders are cancellable', t => {
  const strategy = ({ order, cancel, state }, action) => {
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

  vester({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
      })
    },
    initialStates: {
      capital: {
        cash: 9999999
      }
    },
    client: createMockClient(),
    resume: true,
    backtesting: false
  }, strategy)

})

test.cb.serial('should not be able to cancel unknown orders', t => {
  const strategy = ({ cancel }, action) => {
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

  vester({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
      })
    },
    client: createMockClient(true),
    resume: true,
    backtesting: false
  }, strategy)

})

/*
test.cb.serial('correctly preloads stored state', (t) => {

  vester({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 101 })
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
    vester({
      feeds: {
        example: _((push, next) => {
          setTimeout(() => {
            push(null, { value: 'event 1', timestamp: 503 })
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
*/

test.cb.serial('should not be able to cancel unknown orders', t => {
  const strategy = ({ cancel }, action) => {
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

  vester({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
      })
    },
    client: createMockClient(true),
    backtesting: false,
    resume: true
  }, strategy)

})

// test.cb.serial('logs errors on skipped events during live trading', (t) => {
//   vester({
//     feeds: {
//       example: _((push, next) => {
//         setTimeout(() => {
//           push(null, { value: 'event 1' })
//         }, 0)
//       })
//     },
//     client: createMockClient(),
//     strategy: () => {},
//     resume: true,
//     backtesting: false,
//     onError: (err) => {
//       const actual = err.message
//       const expect = 'Skipped event from feed example due to missing timestamp property.'

//       t.is(actual, expect)
//       t.end()
//     }
//   })
// })

// test.cb.serial('logs errors on skipped events during backtests', (t) => {

//   vester({
//     feeds: {
//       example: [{ value: 'event 1' }]
//     },
//     client: createMockClient(),
//     strategy: () => {},
//     resume: true,
//     onError: (err) => {
//       const actual = err.message
//       const expect = 'Skipped event from feed example due to missing timestamp property.'

//       t.is(actual, expect)
//       t.end()
//     }
//   })

// })

test('throws if strategy is not a function', (t) => {
  t.throws(() => vester({
    strategy: 'foobar',
    resume: true
  }))
})

test.cb.serial('errors can be extracted from the stream', (t) => {
  const strat = vester({
    feeds: {
      events: [{ timestamp: 0 }]
    }
  }, (context, item) => {
    throw new Error('strat')
  })

  strat.errors((err) => {
    t.is(err.message, 'strat')
  }).done(() => {
    t.end()
  })
})

test.cb.serial('errors can be extracted from merged streams', (t) => {
  const strat1 = vester({
    feeds: {
      events: [{ timestamp: 0 }]
    }
  }, () => { throw new Error('strat1') })

  const strat2 = vester({
    feeds: {
      events: [{ timestamp: 0 }]
    }
  }, () => { throw new Error('strat2') })

  const errors = []
  _.merge([strat1, strat2]).errors((err) => {
    errors.push(err)
  }).done(() => {
    t.is(errors[0].message, 'strat1')
    t.is(errors[1].message, 'strat2')
    t.end()
  })
})

test.cb.serial('stream consumers recieve all events in the right order', (t) => {
  const events = []
  const strat = vester({
    feeds: {
      events: [{ timestamp: 0 }, { timestamp: 1 }]
    }
  }, () => {
    events.push('a')
  })

  strat.map((item) => {
    events.push('b')
    return item
  }).done(() => {
    t.deepEqual(events.join(''), 'abababab')
    t.end()
  })
})

test.cb.serial('stream consumers can apply backpressure', (t) => {
  const events = []
  const strat = vester({
    feeds: {
      events: [{ timestamp: 0 }, { timestamp: 1 }]
    }
  }, () => {
    events.push('a')
  })

  const fork1 = strat.fork().map((item) => {
    // eslint-disable-next-line no-empty
    for (let i = 0; i < 5000000; i += 1) {}
    events.push('b')
    return item
  })

  const fork2 = strat.fork().map((item) => {
    // eslint-disable-next-line no-empty
    for (let i = 0; i < 100; i += 1) {}
    events.push('c')
    return item
  })

  strat.fork().done(() => {
    t.deepEqual(events.join(''), 'abcabcabcabc')
    t.end()
  })

  fork1.resume()
  fork2.resume()
})
