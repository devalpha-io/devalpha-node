import { Map, List } from 'immutable'

import {
  buildTotal,
  buildReturnsTotal,
  buildReturnsPeriod,
  buildHistory
} from './util'

import {
  ORDER_FILLED,
  BAR_RECEIVED,
  INITIALIZED
} from '../constants'

export default (state, action) => {
  switch (action.type) {
  case INITIALIZED: {
    return state.setIn(['metrics', 'history'], buildHistory(state, action.payload.timestamp))
  }
  case ORDER_FILLED: {
    /* calculate and update the new total and returns */
    const metrics = state.get('metrics')
    state = state.mergeIn(['metrics'], {
      total: buildTotal(state),
      returnsTotal: buildReturnsTotal(metrics),
      returnsPeriod: buildReturnsPeriod(metrics)
    })
    return state
  }
  case BAR_RECEIVED: {
    const metrics = state.get('metrics')
    state = state.mergeIn(['metrics'], {
      total: buildTotal(state),
      returnsTotal: buildReturnsTotal(metrics),
      returnsPeriod: buildReturnsPeriod(metrics)
    })
    state = state.setIn(['metrics', 'history'], buildHistory(state))

    return state
  }

  default: {
    return state
  }
  }
}
