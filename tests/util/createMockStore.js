module.exports = function createMockStore(initialState = {}) {
  const state = initialState
  return {
    getState: () => state,
    setState(nextState) {
      state = nextState
    },
    dispatch: () => {}
  }
}
