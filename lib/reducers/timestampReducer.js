import moment from 'moment'

import {
  INITIALIZED
} from '../constants'

export default (state = 0, action) => {
  switch (action.type) {
  case INITIALIZED:
    if (typeof action.payload.timestamp !== 'undefined') {
      return action.payload.timestamp
    }
    return state
  default:
    if (action.payload && typeof action.payload.timestamp !== 'undefined') {
      const timestamp = moment.unix(action.payload.timestamp)
      if (timestamp.isValid()) {
        return parseInt(timestamp.format('X'), 10)
      }
    }
    return state
  }
}
