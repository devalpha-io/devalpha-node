export default (options) => (store) => (next) => async (action) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(action.type, action.payload)
  }
  return next(action)
}
