export default function createJournaler(journal) {
  return (store) => (next) => async (action) => {
    if (process.env.NODE_ENV !== 'test') {
      const state = store.getState()
      // TODO actually journal
      await new Promise(r => setTimeout(r, 50))
      return next(action)
    }
    return next(action)
  }
}
