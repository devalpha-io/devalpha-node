export default function createRiskManager(settings) {
  return (store) => (next) => (action) => {
    // TODO perform risk analysis
    return next(action)
  }
}
