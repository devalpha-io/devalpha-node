import moment from 'moment'

export default (state = 0, action) => {
  if (action.payload && typeof action.payload.timestamp !== 'undefined') {
    const timestamp = moment.unix(action.payload.timestamp)
    if (timestamp.isValid()) {
      return parseInt(timestamp.format('X'), 10)
    }
  }
  return state
}
