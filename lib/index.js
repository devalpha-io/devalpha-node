import 'babel-polyfill'

import _ from 'highland'
import { createStore } from 'redux'
import { combineReducers } from 'redux-immutable'

// Middleware
import createBrokerRealtime from './middleware/createBrokerRealtime'
import createBrokerBacktest from './middleware/createBrokerBacktest'
import createGuard from './middleware/createGuard'
import createStrategy from './middleware/createStrategy'
import createNotifier from './middleware/createNotifier'

// Reducers
import capitalReducer from './reducers/capitalReducer'
import positionsReducer from './reducers/positionsReducer'
import ordersReducer from './reducers/ordersReducer'
import timestampReducer from './reducers/timestampReducer'

// Other
import createBuffer from './createBuffer'
import { createMergedStream, createSortedStream } from './util/streams'
import applyMiddlewareBuffered from './applyMiddlewareBuffered'

import { INITIALIZED, FINISHED } from './constants'

/**
 * The entry point to the whole system.
 *
 * @name  run
 * @param {Object} config The Vester configuration.
 * @param {boolean} config.backtesting
 * @param {number} config.capital
 * @param {string} config.slackUrl
 * @param {Object} config.initialStates
 * @param {Object} config.feeds
 * @param {Object} config.backtest
 * @param {string} config.backtest.timestamp
 * @param {function|number} config.commission
 * @param {Object} config.guard
 * @param {boolean} config.guard.shorting
 * @param {boolean} config.guard.margin
 * @param {Array} config.guard.restricted
 * @return {Promise}
 *
 * @example
 * import run from 'vester'
 *
 * function strategy({ order }, action) {
 *   order({
 *     identifier: 'AAPL',
 *     quantity: 100,
 *     price: 150
 *   })
 * }
 *
 * run({
 *   strategy,
 *   backtesting: false
 * })
 */
module.exports = function run(config = {}) {
  config = {
    backtesting: true,
    startCapital: 0,
    slackUrl: '',
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
    }
  }

  if (typeof config.strategy !== 'function') {
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
  const strategy = createStrategy(config.strategy)

  const guard = createGuard(config.guard)

  let broker
  if (config.backtesting !== false || typeof config.client === 'undefined') {
    broker = createBrokerBacktest(config.backtest.commission)
  } else {
    broker = createBrokerRealtime(config.client)
  }

  const reducer = combineReducers({
    capital: capitalReducer,
    positions: positionsReducer,
    orders: ordersReducer,
    timestamp: timestampReducer
  })

  /* Create a new buffer to hold dispatched actions. */
  const buffer = createBuffer()

  const middlewares = [guard, broker, strategy]

  if (config.backtesting === false) {
    const stream = createMergedStream(config.feeds)
    /* istanbul ignore if */
    if (config.slackUrl) {
      const notifier = createNotifier({
        url: config.slackUrl
      })
      middlewares.unshift(notifier)
    }

    const store = createStore(reducer, applyMiddlewareBuffered(buffer, middlewares))

    store.dispatch({
      type: INITIALIZED,
      payload: {
        timestamp: Date.now(),
        initialStates: config.initialStates,
        startCapital: config.startCapital
      }
    })
    stream.each((item) => {
      if (typeof item.payload.timestamp !== 'undefined') {
        store.dispatch(item)
      } else {
        console.error(`Skipped event from feed ${item.type} due to missing timestamp property.`)
      }
    })
  } else {
    const stream = createSortedStream(config.feeds)
    const store = createStore(reducer, applyMiddlewareBuffered(buffer, middlewares))

    store.dispatch({
      type: INITIALIZED,
      payload: {
        timestamp: config.backtest.timestamp,
        initialStates: config.initialStates,
        startCapital: config.startCapital
      }
    })

    stream.consume((err, item, push, next) => {
        if (err) {
          push(err)
          next()
        } else if (item === _.nil) {
          push(null, item)
        } else {
          if (typeof item.payload.timestamp !== 'undefined') {
            store.dispatch(item)
          } else {
            console.error(`Skipped event from feed ${item.type} due to missing timestamp property.`)
          }
          buffer.subscribe('key', () => {
            if (buffer.isEmpty()) {
              buffer.unsubscribe('key')
              next()
            }
          })
        }
      })
      .done(() => {
        store.dispatch({
          type: FINISHED,
          payload: {}
        })
    })
  }

}
