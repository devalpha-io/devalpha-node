import { abs } from 'mathjs'

import {
  ORDER_REQUESTED,
  ORDER_REJECTED
} from '../constants'

/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @param  {object} settings A settings object.
 * @return {function} Middleware
 */
export default function createGuard(settings) {
  return (store) => {
    const isRestricted = (order) => {
      if (settings.restricted.indexOf(order.identifier) > -1) {
        return true
      }
      return false
    }

    const isDisallowedShort = (order) => {
      if (settings.longOnly) {
        const { identifier, quantity } = order
        const instrument = store.getState().positions.getIn(['instruments', identifier])

        if (quantity < 0 && !instrument) {
          return true
        }

        if (quantity < 0 && instrument && instrument.quantity < abs(order.quantity)) {
          return true
        }
      }
      return false
    }

    return (next) => (action) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        const order = action.payload
        if (
          isRestricted(order) ||
          isDisallowedShort(order)
        ) {
          return next({
            type: ORDER_REJECTED,
            payload: { ...action.payload }
          })
        }
        break
      }
      default:
      }
      return next(action)
    }
  }
}
