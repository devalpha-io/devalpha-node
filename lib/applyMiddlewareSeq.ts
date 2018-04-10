import {
  StreamAction
} from './typings'

import { compose, Reducer } from 'redux'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store, and buffers actions until all middlewares are finished processing
 * the action. This should be the first store enhancer in the composition chain.
 *
 * @param {...function} middlewares The chain of middlewares to be applied.
 * @returns {function} A store enhancer applying the middleware.
 */
export default function applyMiddlewareSeq(stream: Highland.Stream<StreamAction>, middlewares: Array<Function> = []) {
  return (createStore: Function) => (reducer: Reducer<StreamAction>, preloadedState: any, enhancer: any) => {
    let running: boolean = false

    const store = createStore(reducer, preloadedState, enhancer)
    const chain = middlewares.map(middleware => middleware({
      getState: store.getState,
      dispatch
    }))

    const composed: any = compose(...chain)((action: StreamAction) => {
      store.dispatch(action)
      running = false
    })

    function dispatch(action: StreamAction) {
      if (running) {
        stream.write(action)
      } else {
        running = true
        composed(action)
      }
    }

    return { ...store, dispatch }
  }
}
