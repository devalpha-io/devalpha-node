import { compose } from 'redux'

export default function applyMiddlewareBuffered(buffer = [], middlewares = []) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const store = createStore(reducer, preloadedState, enhancer)
    let running = false

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    const composed = compose(...chain)(store.dispatch, done)

    function dispatch(action) {
      if (running) {
        buffer.push(action)
      } else {
        running = true
        composed(action)
      }
    }

    function done() {
      buffer.notifyListeners()
      // TODO throw error otherwise
      running = false
      if (!buffer.isEmpty()) {
        running = true
        const item = buffer.next()
        composed(item)
      }
    }

    return { ...store, dispatch }
  }
}
