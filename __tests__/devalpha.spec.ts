import * as _ from 'highland'
import * as EventSource from 'eventsource'
import {
  devalpha,
  createTrader,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCELLED,
  INITIALIZED,
  FINISHED,
  DASHBOARD_INITIALIZE,
  DASHBOARD_EVENTS,
  DASHBOARD_FINISHED,
  SOCKET_PORT
} from '../lib'
import { createMockClient } from './util/createMockClient'

const t = { context: {} }

test('backtest event order', done => {
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

  createTrader({
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
    }
  }, strategy).resume()

  setTimeout(() => {
    const expected = 'abcdedeabcdede'
    const actual = executions.join('')
    expect(actual).toBe(expected)
    done()
  }, 100)

})

test('live trading event order', done => {

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

  createTrader({
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
    backtesting: false
  }, strategy).resume()

  setTimeout(() => {
    const expected = 'abcabcddddeeee'
    const actual = executions.join('')
    expect(actual).toBe(expected)
    done()
  }, 1000)

})

test('state() returns an object', done => {

  const strategy = ({ state }, action) => {
    expect(typeof (state())).toBe('object')
    done()
  }

  createTrader({
    backtesting: false
  }, strategy).resume()
})

test('failing orders are dispatched', done => {
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
      done()
      break
    default:
      break
    }
  }

  createTrader({
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
    backtesting: false
  }, strategy).resume()

})

test('orders are cancellable', done => {
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
      expect(actual).toEqual(expected)
      done()
      break
    default:
      break
    }
  }

  createTrader({
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
    backtesting: false
  }, strategy).resume()

})

test('should not be able to cancel unknown orders', done => {
  const strategy = ({ cancel }, action) => {
    switch (action.type) {
    case 'example':
      cancel('1')
      break
    case ORDER_FAILED:
      done()
      break
    default:
      break
    }
  }

  createTrader({
    feeds: {
      example: _((push, next) => {
        setTimeout(() => {
          push(null, { value: 'event 1', timestamp: 100 })
        }, 0)
      })
    },
    client: createMockClient(true),
    backtesting: false
  }, strategy).resume()

})

test('throws if strategy is not a function', () => {
  expect(() => createTrader({
    strategy: 'foobar'
  }).resume()).toThrow()
})

test(
  'stream returns items containing action and state during live trading',
  done => {
    const events = []
    const strat = createTrader({
      feeds: {},
      backtesting: false
    }, () => {})

    strat.each(({ state, action }) => {
      expect(typeof state.capital).toBe('object')
      expect(typeof state.orders).toBe('object')
      expect(typeof state.positions).toBe('object')
      expect(typeof state.timestamp).toBe('number')
      events.push(action.type)
    }).done(() => {
      expect(events).toEqual([INITIALIZED, FINISHED])
      done()
    })
  }
)

test(
  'stream returns items containing action and state during backtests',
  done => {
    const events = []
    const strat = createTrader({
      feeds: {}
    }, () => {})

    strat.each(({ state, action }) => {
      expect(typeof state.capital).toBe('object')
      expect(typeof state.orders).toBe('object')
      expect(typeof state.positions).toBe('object')
      expect(typeof state.timestamp).toBe('number')
      events.push(action.type)
    }).done(() => {
      expect(events).toEqual([INITIALIZED, FINISHED])
      done()
    })
  }
)

test('errors can be extracted from the stream', done => {
  const strat = createTrader({
    feeds: {
      events: [{ timestamp: 0 }]
    }
  }, () => {
    throw new Error('strat')
  })

  strat.errors((err) => {
    expect(err.message).toBe('strat')
  }).done(() => {
    done()
  })
})

test('errors can be extracted from merged streams', done => {
  const strat1 = createTrader({
    feeds: {
      events: [{ timestamp: 0 }]
    }
  }, () => { throw new Error('strat1') })

  const strat2 = createTrader({
    feeds: {
      events: [{ timestamp: 0 }]
    }
  }, () => { throw new Error('strat2') })

  const errors = []
  _.merge([strat1, strat2]).errors((err) => {
    errors.push(err)
  }).done(() => {
    expect(errors[0].message).toBe('strat1')
    expect(errors[1].message).toBe('strat2')
    done()
  })
})

test('stream consumers recieve all events in the right order', done => {
  const events = []
  const strat = createTrader({
    feeds: {
      events: [{ timestamp: 0 }, { timestamp: 1 }]
    }
  }, (context, action) => {
    events.push('a')
  })

  strat.each(() => {
    events.push('b')
  }).done(() => {
    expect(events.join('')).toEqual('abababab')
    done()
  })
})

test('stream consumers can apply backpressure', done => {
  const events = []
  const strat = createTrader({
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
    expect(events.join('')).toEqual('abcabcabcabc')
    done()
  })

  fork1.resume()
  fork2.resume()
})

test('dashboard works as expected', (done) => {
  let clientEvents = []
  const serverEvents = []
  let runTime = -1

  const trader = createTrader({
    feeds: {
      events: [{ timestamp: 0 }, { timestamp: 1 }]
    },
    dashboard: {
      active: true
    }
  }, () => {
    serverEvents.push('a')
  }).resume()

  const client = new EventSource(`http://127.0.0.1:${SOCKET_PORT}/backtest`)
  client.addEventListener(DASHBOARD_EVENTS, ({ data }) => {
    const events = JSON.parse(data).events
    clientEvents = [...clientEvents, ...events]
  })
  client.addEventListener(DASHBOARD_FINISHED, ({ data }) => {
    const { startedAt, finishedAt } = JSON.parse(data)
    runTime = finishedAt - startedAt

    expect(serverEvents.length).toBe(4)
    expect(clientEvents.length).toBe(4)
    expect(runTime > 0).toBe(true)

    done()
  })

  expect(serverEvents.length).toBe(0)
  expect(clientEvents.length).toBe(0)
})

test('calling devalpha logs to console', (done) => {
  const actions = []
  const strategy = ({ order }, action) => {}
  console.error = jest.fn()
  devalpha({
    feeds: {
      example: [
        {
          value: 'event 1',
          timestamp: 100
        }
      ]
    }
  }, strategy).each((x) => {
    actions.push(x)
  })

  setTimeout(() => {
    expect(console.error.mock.calls.length).toBe(1)
    expect(actions.length).toBe(3)
    done()
  }, 100)
})
