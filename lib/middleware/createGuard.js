import { abs, chain, number as n, bignumber as b } from 'mathjs'

import {
  ORDER_CREATED,
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
    const isRestrictedAsset = (order) => {
      if (settings.restricted.indexOf(order.identifier) > -1) {
        return true
      }
      return false
    }

    const isDisallowedShort = (order) => {
      const { quantity } = order
      if (!settings.shorting && quantity < 0) {
        const identifier = { order }
        const instrument = store.getState().get('positions').getIn(['instruments', identifier])

        if (!instrument) {
          return true
        }

        if (instrument.get('quantity') < abs(order.quantity)) {
          return true
        }
      }
      return false
    }

    const isDisallowedMargin = (order) => {
      if (!settings.margin) {
        const { quantity, price, commission } = order
        const cash = store.getState().get('capital').get('cash')
        const cost = n(chain(b(quantity)).multiply(b(price)).add(b(commission)).done())

        if (cash < cost) {
          return true
        }
      }
      return false
    }

    return (next) => (action) => {
      switch (action.type) {
      case ORDER_CREATED: {
        const order = action.payload
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
        return next(action)
      }
    }
  }
}
