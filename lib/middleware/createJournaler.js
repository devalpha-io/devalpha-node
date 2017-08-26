export default function createJournaler(journal) {
  return (store) => (next) => (action) => {
    if (process.env.NODE_ENV !== 'test') {
      const state = store.getState()
      // TODO actually journal
      setTimeout(() => {
        next(action)
      }, 50)
    } else {
      next(action)
    }
  }
}
