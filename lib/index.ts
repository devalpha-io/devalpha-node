import {
  StreamAction,
  Strategy
} from './typings'

import * as _ from 'highland'
import { createStore, combineReducers } from 'redux'
import * as http from 'http'
import * as socket from 'socket.io'

// Middleware
import createBrokerRealtime from './middleware/createBrokerRealtime'
import createBrokerBacktest from './middleware/createBrokerBacktest'
import createGuard from './middleware/createGuard'
import createStrategy from './middleware/createStrategy'

// Reducers
import { capitalReducer } from './reducers/capitalReducer'
import { positionsReducer } from './reducers/positionsReducer'
import { ordersReducer } from './reducers/ordersReducer'
import { timestampReducer } from './reducers/timestampReducer'

// Other
import { createMergedStream, createSortedStream } from './util/streams'
import applyMiddlewareSeq from './applyMiddlewareSeq'

import {
  INITIALIZED,
  FINISHED,
  SOCKETIO_CONNECTION,
  DASHBOARD_INITIALIZE,
  DASHBOARD_EVENTS,
  DASHBOARD_FINISHED
} from './constants'

export * from './constants'

/**
 * The entry point to the whole system.
 *
 * @example
 * import vester from 'vester'
 *
 * function strategy({ order }, action) {
 *   order({
 *     identifier: 'AAPL',
 *     quantity: 100,
 *     price: 150
 *   })
 * }
 *
 * vester({
 *   strategy,
 *   backtesting: false
 * })
 */
export function vester(config: any, strategy: Strategy) {
  config = {
    backtesting: true,
    client: null,
    startCapital: 0,
    ...config,
    initialStates: {
      ...config.initialStates
    },
    feeds: {
      ...config.feeds
    },
    backtest: {
      timestamp: 0,
      commission: 0,
      ...config.backtest
    },
    guard: {
      shorting: false,
      margin: false,
      restricted: [],
      ...config.guard
    },
    dashboard: {
      active: false,
      port: 4449,
      ...config.dashboard
    }
  }

  if (typeof strategy !== 'function') {
    throw new Error('Expected strategy to be a function.')
  }

  /**
   * The strategy function is defined by the user (you), and it is called every time a new event occurs.
   *
   * @type {function}
   * @param {Object} context
   * @param {function} context.state The state of your strategy.
   * @param {function} context.metrics Some standard metrics for your strategy. Note that calls to this
   * function is very expensive, so use with caution.
   * @param {function} context.order Place an order.
   * @param {function} context.cancel Cancel an order.
   */
  const strategyMiddleware = createStrategy(strategy)

  const guardMiddleware = createGuard(config.guard)

  let brokerMiddleware
  if (config.backtesting !== false || !config.client) {
    brokerMiddleware = createBrokerBacktest(config.backtest.commission)
  } else {
    brokerMiddleware = createBrokerRealtime(config.client)
  }

  const reducer = combineReducers({
    capital: capitalReducer,
    positions: positionsReducer,
    orders: ordersReducer,
    timestamp: timestampReducer
  } as any)

  const middlewares = [guardMiddleware, brokerMiddleware, strategyMiddleware]

  let stream: Highland.Stream<StreamAction>
  let startedAt: number
  let finishedAt: number

  if (config.backtesting === false) {
    startedAt = Date.now()
    finishedAt = Date.now()
    stream = createMergedStream(config.feeds)
  } else {
    startedAt = config.backtest.timestamp
    finishedAt = config.backtest.timestamp
    stream = createSortedStream(config.feeds)
  }

  stream.write({
    type: INITIALIZED,
    payload: {
      timestamp: startedAt,
      initialStates: config.initialStates,
      startCapital: config.startCapital
    }
  })

  const store = createStore(reducer, applyMiddlewareSeq(stream, middlewares))

  let consumed = stream.consume((err, item, push, next) => {
    if (err) {
      push(err)
      next()
    } else if (item === _.nil) {
      if (config.backtesting !== false) {
        try {
          const finished = {
            type: FINISHED,
            payload: {
              timestamp: finishedAt
            }
          }
          store.dispatch(finished)
          push(null, {
            state: store.getState(),
            action: finished
          })
        } catch (e) {
          push(e)
        }
      }
      push(null, _.nil)
    } else if (typeof (<StreamAction>item).payload.timestamp === 'undefined') {
      push(new Error(`Skipped event from feed "${(<StreamAction>item).type}" due to missing timestamp property.`))
      next()
    } else {
      finishedAt = (<StreamAction>item).payload.timestamp
      try {
        store.dispatch(<StreamAction>item)
        push(null, {
          state: store.getState(),
          action: item
        })
      } catch (e) {
        push(e)
      }
      next()
    }
  })

  if (config.dashboard.active) {
    const app = http.createServer((_, res) => {
      res.writeHead(200)
      res.end()
    })
    const io = socket(app)

    app.listen(config.dashboard.port)

    const socketStream = consumed.fork()
    consumed = consumed.fork()

    io.on(SOCKETIO_CONNECTION, (client) => {
      client.on(DASHBOARD_INITIALIZE, () => {
        startedAt = Date.now()
        socketStream
          .batchWithTimeOrCount(500, 1000)
          .each((events) => {
            io.emit(DASHBOARD_EVENTS, { events })
          })
          .done(() => {
            finishedAt = Date.now()

            io.emit(DASHBOARD_FINISHED, {
              startedAt,
              finishedAt
            })

            client.disconnect(true)
            io.close()
          })
      })
    })
  }

  return consumed
}
