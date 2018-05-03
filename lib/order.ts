import Decimal from 'decimal.js'
import {
  CreatedOrder,
  Store
} from './types'

/**
 * A convenience function which partially applies the createOrder function with the given store and
 * a calculateCommission function.
 *
 * @private
 * @param {Store} store An Store object.
 * @param {Function} calculateCommission A function for calculating the expected commission of an order.
 * @return {Function} A partially applied createOrder-function which only takes an order as parameter.
 */
export const createOrderCreator = (store: Store) => (calculateCommission: Function) => createOrder(store)(calculateCommission)

/**
 * A factory function for creating a proper CreatedOrder.
 *
 * @private
 * @param {Order} order The order which to use when creating a CreatedOrder.
 * @return {CreatedOrder} A CreatedOrder.
 */
export const createOrder = (store: Store) => (calculateCommission: Function) => (order: any): CreatedOrder => {
  // @ts-ignore this will be used in the future for calculating percentages
  const s = store
  const createdOrder = {} as CreatedOrder

  if (typeof order.timestamp === 'undefined') {
    throw new Error('missing order timestamp')
  } else {
    createdOrder.timestamp = order.timestamp
  }

  if (typeof order.identifier === 'undefined') {
    throw new Error('missing order identifier')
  } else {
    createdOrder.identifier = order.identifier
  }
  
  if (typeof order.price === 'undefined') {
    throw new Error('missing order price')
  } else {
    createdOrder.price = new Decimal(order.price)
  }
  
  if (typeof order.quantity !== 'undefined' && typeof order.percent === 'undefined') {
    createdOrder.quantity = new Decimal(order.quantity)
  } else if (typeof order.quantity === 'undefined' && typeof order.percent !== 'undefined') {
    throw new Error('percentage orders not yet supported')
  } else {
    throw new Error('please specify quantity or percent, not both')
  }

  if (typeof order.trigger !== 'undefined' || typeof order.threshold !== 'undefined') {
    throw new Error('stop loss orders not yet supported')
  }

  createdOrder.commission = new Decimal(calculateCommission(order))

  return createdOrder
}
