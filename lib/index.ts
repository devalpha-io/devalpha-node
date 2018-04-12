import * as _ from 'highland'
import { combineReducers } from 'redux'
import * as http from 'http'
import * as socket from 'socket.io'

import { createRealtimeStream, createBacktestStream } from './streams'
import { createConsumerCreator } from './consumer'
import {
  VesterOptions,
  StreamAction,
  Strategy,
  RootState,
  Middleware,
  Consumer
} from './typings/index'

import reducers from './reducers'
import {
  createGuard,
  createStrategy,
  createBrokerRealtime,
  createBrokerBacktest
} from './middleware'

import {
  INITIALIZED,
  FINISHED,
  SOCKETIO_CONNECTION,
  DASHBOARD_INITIALIZE,
  DASHBOARD_EVENTS,
  DASHBOARD_FINISHED
} from './constants'

export * from './constants'

export function vester(settings: any, strategy: Strategy) {
  let config: VesterOptions = {
    backtesting: true,
    client: null,
    startCapital: 0,
    ...settings,
    initialStates: {
      ...settings.initialStates
    },
    feeds: {
      ...settings.feeds
    },
    backtest: {
      timestamp: 0,
      commission: 0,
      ...settings.backtest
    },
    guard: {
      shorting: false,
      margin: false,
      restricted: [],
      ...settings.guard
    },
    dashboard: {
      active: false,
      port: 4449,
      ...settings.dashboard
    }
  }

  if (typeof strategy !== 'function') {
    throw new Error('strategy must be a function')
  }

  // Store
  let state: RootState
  let reducing = false
  const store = {
    dispatch: (action: StreamAction) => input.write(action),
    getState: () => state,
    setState: (nextState: RootState) => {
      if (!reducing) {
        throw new Error('Cannot set state outside of reducer.')
      }
      state = nextState
    }
  }

  // Consumers
  const createConsumer = createConsumerCreator(store)
  
  const reducer = combineReducers(reducers as any)
  const reducerMiddleware: Middleware = (store) => (next) => (action) => {
    reducing = true
    store.setState(reducer(store.getState(), action))
    reducing = false
    next(action)
  }

  // Check if finished
  const finishedConsumer: Consumer = (err, item, push, next) => {
    if (err) {
      push(err)
      next()
    } else if (item === _.nil) {
      push(null, {
        type: FINISHED,
        payload: {
          timestamp: Date.now()
        }
      })
      push(null, _.nil)
    } else {
      push(null, item)
      next()
    }
  }

  // Guard
  const guardMiddleware = createGuard(config.guard)

  // Strategy
  const strategyMiddleware = createStrategy(strategy)

  // Broker
  let brokerMiddleware: Middleware
  if (config.backtesting !== false || !config.client) {
    brokerMiddleware = createBrokerBacktest(config.backtest.commission)
  } else {
    brokerMiddleware = createBrokerRealtime(config.client)
  }

  // Stream
  let input: Highland.Stream<StreamAction>
  let startedAt: number
  let finishedAt: number

  if (config.backtesting === false) {
    startedAt = Date.now()
    finishedAt = Date.now()
    input = createRealtimeStream(config.feeds)
  } else {
    startedAt = config.backtest.timestamp
    finishedAt = config.backtest.timestamp
    input = createBacktestStream(config.feeds)
  }

  input.write({
    type: INITIALIZED,
    payload: {
      timestamp: startedAt,
      initialStates: config.initialStates,
      startCapital: config.startCapital
    }
  })

  const isValidAction = (item: StreamAction) => item.payload && typeof item.payload.timestamp !== 'undefined'

  // @ts-ignore
  const pipeline = _.pipeline((s) => s
    .consume(finishedConsumer)
    .filter(isValidAction)
    .consume(createConsumer(guardMiddleware))
    .consume(createConsumer(brokerMiddleware))
    .consume(createConsumer(reducerMiddleware))
    .consume(createConsumer(strategyMiddleware))
  )

  let output = input
    .through(pipeline)
    .map((action) => ({
      state: store.getState(),
      action
    }))


  if (config.dashboard.active) {
    const app = http.createServer((_, res) => {
      res.writeHead(200)
      res.end()
    })
    const io = socket(app)

    app.listen(config.dashboard.port)

    const socketStream = output.fork()
    output = output.fork()

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

  return output
}
