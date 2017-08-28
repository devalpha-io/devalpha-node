import path from 'path'
import _ from 'highland'
import { createStore } from 'redux'

import { createMergedStream, createSortedStream } from './util/streams'
import createDefaultBroker from './middleware/createDefaultBroker'
import createMockBroker from './middleware/createMockBroker'
import createJournaler from './middleware/createJournaler'
import createRiskManager from './middleware/createRiskManager'
import createLogger from './middleware/createLogger'
import createStrategy from './middleware/createStrategy'
import createBuffer from './createBuffer'
import applyMiddlewareBuffered from './applyMiddlewareBuffered'

import reducer from './reducer'

import { INITIALIZED } from './constants'

export default async function run(config = {}) {

  config = {
    risk: {
      margin: 0,
      maxSlippage: 0,
      maxDrawdown: 1,
      ...config.risk
    },
    backtest: {
      initialCash: 0,
      timestamp: 0,
      commission: 0,
      ...config.backtest
    },
    feeds: {
      ...config.feeds
    },
    journal: path.join(process.cwd(), 'journal.json'),
    backtesting: true,
    ...config
  }

  if (typeof config.strategy !== 'function') {
    throw new Error('Expected strategy to be a function.')
  }

  const logger = createLogger()
  const journaler = createJournaler(config.journal)
  const strategy = createStrategy(config.strategy)
  const riskManager = createRiskManager(config.risk)

  let broker
  if (config.backtesting !== false || typeof config.client === 'undefined') {
    broker = createMockBroker(config.backtest.commission)
  } else {
    broker = createDefaultBroker(config.client)
  }

  const buffer = createBuffer()

  if (config.backtesting === false) {
    const stream = createMergedStream(config.feeds)
    const store = createStore(reducer, applyMiddlewareBuffered(
      buffer, [logger, journaler, riskManager, broker, strategy])
    )

    store.dispatch({ type: INITIALIZED, payload: {} })
    stream.each((item) => {
      store.dispatch(item)
    })
  } else {
    const stream = createSortedStream(config.feeds)
    const store = createStore(reducer, applyMiddlewareBuffered(
      buffer, [logger, riskManager, broker, strategy])
    )

    store.dispatch({ type: INITIALIZED, payload: { timestamp: config.timestamp } })
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