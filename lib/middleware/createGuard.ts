import * as Redux from 'redux'
import Decimal from 'decimal.js'
import {
  StreamAction,
  RootState,
  CreatedOrder,
  GuardOptions,
  ExecutedOrder
} from '../typings'

import {
  ORDER_CREATED,
  ORDER_REJECTED
} from '../constants'

/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @private
 * @param  {Object} settings A settings object.
 * @return {function} Middleware
 */
export default function createGuard(settings: GuardOptions) {
  return (store: Redux.Store<RootState>) => {
    const isRestrictedAsset = (order: CreatedOrder) => {
      if (settings.restricted.indexOf(order.identifier) > -1) {
        return true
      }
      return false
    }

    const isDisallowedShort = (order: CreatedOrder) => {
      const { quantity, identifier } = order
      if ((!settings.shorting) && quantity < 0) {

        const instrument = store.getState().positions.instruments[identifier]

        if (!instrument) {
          return true
        }

        if (new Decimal(instrument.quantity).lessThan(Decimal.abs(quantity))) {
          return true
        }
      }
      return false
    }

    const isDisallowedMargin = (order: CreatedOrder) => {
      if (!settings.margin) {
        const { quantity, price, commission } = order
        const cash = store.getState().capital.cash
        const cost = Decimal.mul(quantity, price).add(commission)

        if (cash < cost) {
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
