export default function createRiskManager(settings) {
  return (store) => (next) => async (action) => {
    // TODO perform risk analysis
    return next(action)
  }
}
