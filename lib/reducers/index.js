import { combineReducers } from 'redux-immutable'
import capitalReducer from './capitalReducer'
import positionsReducer from './positionsReducer'
import ordersReducer from './ordersReducer'

export default combineReducers({
  capital: capitalReducer,
  positions: positionsReducer,
  orders: ordersReducer
})
