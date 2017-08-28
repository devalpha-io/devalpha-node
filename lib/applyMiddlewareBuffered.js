import composeAsync from './util/composeAsync'

export default function applyMiddlewareBuffered(buffer = [], middlewares = []) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const store = createStore(reducer, preloadedState, enhancer)

    const chain = middlewares.map(middleware => middleware({
      getState: store.getState,
      dispatch
    }))
    const composed = composeAsync(...chain)(store.dispatch)

    let running = false
    async function dispatch(action) {
      if (running) {
        buffer.push(action)
      } else {
        running = true
        await composed(action)
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
