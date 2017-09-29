/**
 * The risk manager middleware has the capability to alter orders or even prevent them from being
 * requested in the first place. It should also warn the user when some risk metric is out of bounds.
 *
 * @param  {object} settings A settings object.
 * @return {function} Middleware
 */
export default function createRiskManager(settings) {
  return (store) => (next) => (action) => {
    // TODO perform risk analysis
    return next(action)
  }
}
