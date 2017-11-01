import 'babel-polyfill'

import path from 'path'
import _ from 'highland'
import { createStore } from 'redux'
import { createWriteStream } from 'fs'
import { combineReducers } from 'redux-immutable'

// Middleware
import createBrokerRealtime from './middleware/createBrokerRealtime'
import createBrokerBacktest from './middleware/createBrokerBacktest'
import createJournaler from './middleware/createJournaler'
import createRiskManager from './middleware/createRiskManager'
import createLogger from './middleware/createLogger'
import createStrategy from './middleware/createStrategy'
import createNotifier from './middleware/createNotifier'

// Reducers
import capitalReducer from './reducers/capitalReducer'
import positionsReducer from './reducers/positionsReducer'
import ordersReducer from './reducers/ordersReducer'

// Other
import createBuffer from './createBuffer'
import getMetrics from './selectors/metrics'
import { createMergedStream, createSortedStream } from './util/streams'
import applyMiddlewareBuffered from './applyMiddlewareBuffered'

import { INITIALIZED } from './constants'

/**
 * The entry point to the whole system.
 * 
 * @param  {object} config The Vester configuration.
 */
export default async function run(config = {}) {

  config = {
    backtesting: true,
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
    risk: {
      margin: 0,
      maxSlippage: 0,
      maxDrawdown: 1,
      ...config.risk
    }
  }

  if (typeof config.strategy !== 'function') {
    throw new Error('Expected strategy to be a function.')
  }

  if (typeof config.journal === 'undefined') {
    config.journal = createWriteStream(path.join(process.cwd(), 'journal.json'), {
      flags: 'a'
    })
  }

  const logger = createLogger()
  const journaler = createJournaler(config.journal)
  const strategy = createStrategy(config.strategy, getMetrics)
  const riskManager = createRiskManager(config.risk, getMetrics)

  let broker
  if (config.backtesting !== false || typeof config.client === 'undefined') {
    broker = createBrokerBacktest(config.backtest.commission)
  } else {
    broker = createBrokerRealtime(config.client)
  }

  const reducer = combineReducers({
    capital: capitalReducer,
    positions: positionsReducer,
    orders: ordersReducer
  })

  /* Create a new buffer to hold dispatched actions. */
  const buffer = createBuffer()

  if (config.backtesting === false) {
    const stream = createMergedStream(config.feeds)
    const middlewares = [logger, journaler, riskManager, broker, strategy]
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
        initialStates: config.initialStates
      }
    })
    stream.each((item) => {
      store.dispatch(item)
    })
  } else {
    const stream = createSortedStream(config.feeds)
    const middlewares = [logger, riskManager, broker, strategy]
    const store = createStore(reducer, applyMiddlewareBuffered(buffer, middlewares))

    store.dispatch({
      type: INITIALIZED,
      payload: {
        timestamp: config.timestamp,
        initialStates: config.initialStates
      }
    })
    buffer.subscribe(() => {
      if (buffer.isEmpty()) {
        stream.pull((err, item) => {
          if (item !== _.nil) {
            store.dispatch(item)
          }
        })
      }
    })
  }

}
