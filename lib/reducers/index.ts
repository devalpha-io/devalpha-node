import { combineReducers } from 'redux'

import { capitalReducer } from './capitalReducer'
import { positionsReducer } from './positionsReducer'
import { ordersReducer } from './ordersReducer'
import { timestampReducer } from './timestampReducer'

/**
 * use "as any" as an escape hatch for https://github.com/Microsoft/TypeScript/issues/5711
 */
export const rootReducer = combineReducers({
  capital: capitalReducer,
  positions: positionsReducer,
  orders: ordersReducer,
  timestamp: timestampReducer
}) as any
