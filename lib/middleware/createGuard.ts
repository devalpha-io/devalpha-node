import Decimal from 'decimal.js'
import {
  Store,
  StreamAction,
  CreatedOrder,
  GuardOptions,
  ExecutedOrder,
  Middleware
} from '../types'

import {
  ORDER_CREATED,
  ORDER_REJECTED
} from '../constants'

/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @private
 * @param  {Object} options A options object.
 * @return {Middleware} Middleware to be consumed by a Consumer.
 */
export function createGuard(options: GuardOptions): Middleware {
  return (store: Store) => {
    const isRestrictedAsset = (order: CreatedOrder) => {
      if (options.restricted && options.restricted.indexOf(order.identifier) > -1) {
        return true
      }
      return false
    }

    const isDisallowedShort = (order: CreatedOrder) => {
      const { quantity, identifier } = order
      if ((!options.shorting) && quantity < 0) {

        const instrument = store.getState().positions.instruments[identifier]

        if (!instrument) {
          return true
        }

        if (new Decimal(instrument.quantity).lt(Decimal.abs(quantity))) {
          return true
        }
      }
      return false
    }

    const isDisallowedMargin = (order: CreatedOrder) => {
      if (!options.margin) {
        const { quantity, price, commission } = order
        const cash = store.getState().capital.cash
        const cost = Decimal.mul(quantity, price).add(commission)

        if (cash.lessThan(cost)) {
          return true
        }
      }
      return false
    }

    return (next: Function) => (action: StreamAction) => {
      switch (action.type) {
        case ORDER_CREATED: {
          const order: ExecutedOrder = <ExecutedOrder> action.payload
          if (
            isRestrictedAsset(order) ||
            isDisallowedShort(order) ||
            isDisallowedMargin(order)
          ) {
            return next({
              type: ORDER_REJECTED,
              payload: { ...action.payload }
            })
          }
          return next(action)
        }
        default:
          break
      }
      return next(action)
    }
  }
}
