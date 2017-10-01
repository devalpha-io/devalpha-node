import { combineReducers } from 'redux-immutable'
import capitalReducer from './capitalReducer'
import positionsReducer from './positionsReducer'
import ordersReducer from './ordersReducer'
import metricsReducer from './metricsReducer'
import globalReducer from './globalReducer'

const combinedReducer = combineReducers({
  capital: capitalReducer,
  positions: positionsReducer,
  orders: ordersReducer,
  metrics: metricsReducer
})

/**
 * Root reducer.
 *
 * Note that globalReducer is dependent on values from the other reducers, and so it needs to be
 * run after all of the other reducers.
 */
export default function rootReducer(state, action) {
  const intermediateState = combinedReducer(state, action)
  const finalState = globalReducer(intermediateState, action)
  return finalState
}
