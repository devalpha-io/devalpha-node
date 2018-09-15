import * as _ from 'highland'
import { createServer } from 'http'
import { parse } from 'url'

import { createStreamMerged, createStreamSorted } from './util/streams'
import { createConsumerCreator } from './util/consumers'
import {
  DevAlphaOptions,
  StreamAction,
  Strategy,
  RootState,
  Middleware,
  Consumer
} from './types'

import { rootReducer } from './reducers'
import {
  createGuard,
  createStrategy,
  createBrokerRealtime,
  createBrokerBacktest
} from './middleware'

import {
  INITIALIZED,
  FINISHED,
  DASHBOARD_EVENTS,
  DASHBOARD_FINISHED,
  SOCKET_PORT
} from './constants'

export * from './constants'
export * from './types'

/**
 * Create a trading stream, which uses supplied feeds as sources, and outputs feed events as well as
 * events produced by the supplied strategy.
 *
 * @param {any}      settings An object containing settings.
 * @param {Strategy} strategy A Strategy function.
 * @returns {Stream}
 */
export function createTrader(settings: any, strategy: Strategy) {
  const config: DevAlphaOptions = {
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
      port: SOCKET_PORT,
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
      /* istanbul ignore if */
      if (!reducing) {
        throw new Error('Cannot set state outside of reducer.')
      }
      state = nextState
    }
  }

  // Consumers
  const createConsumer = createConsumerCreator(store)

  const reducerMiddleware: Middleware = store => next => (action) => {
    reducing = true
    store.setState(rootReducer(store.getState(), action))
    reducing = false
    next(action)
  }

  // Check if finished
  const finishedConsumer: Consumer = (err, item, push, next) => {
    /* istanbul ignore if */
    if (err) {
      push(err)
      next()
    } else if (item === _.nil) {
      push(null, {
        type: FINISHED,
        payload: {
          timestamp: config.backtesting === false ? Date.now() : finishedAt
        }
      })
      push(null, _.nil)
    } else {
      if (config.backtesting !== false) {
        finishedAt = (<StreamAction>item).payload.timestamp
      }
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
    input = createStreamMerged(config.feeds)
  } else {
    startedAt = config.backtest.timestamp
    finishedAt = config.backtest.timestamp
    input = createStreamSorted(config.feeds)
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

  let output = input
    .doto(() => {
      if (config.backtesting !== false) {
        input.pause()
      }
    })
    .through<StreamAction, StreamAction>(
      _.seq(
        // use "as any" since functions does actually exist on _
        (_ as any).consume(finishedConsumer),
        (_ as any).filter(isValidAction),
        (_ as any).consume(createConsumer(guardMiddleware)),
        (_ as any).consume(createConsumer(brokerMiddleware)),
        (_ as any).consume(createConsumer(reducerMiddleware)),
        (_ as any).consume(createConsumer(strategyMiddleware))
      ) as (x: StreamAction) => StreamAction
    )
    .doto(() => {
      // @ts-ignore
      if (config.backtesting !== false && input._outgoing.length === 0) {
        input.resume()
      }
    })
    .map(action => ({
      state: store.getState(),
      action
    }))

  if (config.dashboard.active) {

    const socketStream = output.fork()
    output = output.fork()

    let id = 0;
    const createMessage = (message: any) => {
      let response = ''
      response += `id: ${id++}\n`
      response += `event: ${message.type}\n`
      response += `data: ${JSON.stringify(message.payload)}\n`
      response += `\n`
      return response
    }

    const app = createServer((req, res) => {
      const headers: any = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET',
        'Access-Control-Max-Age': 60 * 60 * 24 * 30,
        'Cache-Control': 'no-cache',
        'Connection': 'close'
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204, headers)
        return res.end()
      }

      const url = parse(req.url as string)
      if (url.pathname === '/') {
        headers['Content-Type'] = 'application/json'
        res.writeHead(200, headers)
        res.write(JSON.stringify({
          message: 'ok'
        }))
        res.end()
      } else if (url.pathname === '/backtest') {
        headers['Content-Type'] = 'text/event-stream',
        headers['Connection'] = 'keep-alive',
        res.writeHead(200, headers)
        startedAt = Date.now()
        socketStream
          .batchWithTimeOrCount(500, 1000)
          .each((events) => {
            res.write(createMessage({
              type: DASHBOARD_EVENTS,
              payload: { events }
            }))
          })
          .done(() => {
            finishedAt = Date.now()
            res.write(createMessage({
              type: DASHBOARD_FINISHED,
              payload: {
                startedAt,
                finishedAt
              }
            }))
            res.end()
            app.close()
          })
      } else {
        res.writeHead(404, headers)
        res.end()
      }
    })

    app.listen(config.dashboard.port)

  }

  return output
}

export const devalpha = (settings: any, strategy: Strategy) => {
  console.error('the devalpha function is deprecated, please use createTrader() instead')
  return createTrader(settings, strategy)
}
