import { compose } from 'redux'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store, and buffers actions until all middlewares are finished processing
 * the action. This should be the first store enhancer in the composition chain.
 *
 * @private
 * @param {...function} middlewares The chain of middlewares to be applied.
 * @returns {function} A store enhancer applying the middleware.
 */
export default function applyMiddlewareBuffered(buffer = [], middlewares = []) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const store = createStore(reducer, preloadedState, enhancer)

    const chain = middlewares.map(middleware => middleware({
      getState: store.getState,
      dispatch
    }))
    const composed = compose(...chain)(store.dispatch)

    let running = false
    async function dispatch(action) {
      if (running) {
        buffer.push(action)
      } else {
        running = true
        try {
          await composed(action)
        } catch (e) {
          console.error(e.message)
        }
        buffer.notifyListeners()
        running = false

        if (!buffer.isEmpty()) {
          dispatch(buffer.next())
        }
      }
    }

    return { ...store, dispatch }
  }
}
