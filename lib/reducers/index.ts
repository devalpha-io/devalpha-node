import { capitalReducer } from './capitalReducer'
import { positionsReducer } from './positionsReducer'
import { ordersReducer } from './ordersReducer'
import { timestampReducer } from './timestampReducer'

export default {
  capital: capitalReducer,
  positions: positionsReducer,
  orders: ordersReducer,
  timestamp: timestampReducer
}
