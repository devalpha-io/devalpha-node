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

const initialState = Map({
  history: List(),
  metrics: Map({
    maxDrawdown: 0,
    sharpeRatio: 0
  }),
  returnsTotal: 0,
  returnsPeriod: 0,
  total: 0,
  timestamp: 0
})

export default (state = initialState, action) => {
  switch (action.type) {
  case INITIALIZED: {
    return state.set('history', buildHistory(state, action.payload.timestamp))
  }
  case ORDER_FILLED: {
    /* calculate and update the new total and returns */
    state = state.merge({
      total: buildTotal(state),
      returnsTotal: buildReturnsTotal(state),
      returnsPeriod: buildReturnsPeriod(state)
    })
    return state
  }
  case BAR_RECEIVED: {
    state = state.merge({
      total: buildTotal(state),
      returnsTotal: buildReturnsTotal(state),
      returnsPeriod: buildReturnsPeriod(state)
    })
    state = state.set('history', buildHistory(state))

    return state
  }

  default: {
    return state
  }
  }
}
