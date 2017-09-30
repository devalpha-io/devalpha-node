import { Map } from 'immutable'
import math, { chain, number as n, bignumber as b, sign } from 'mathjs'

import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED
} from '../constants'

const initialState = Map({
  cash: 0,
  commission: 0,
  reservedCash: 0
})

export default (state = initialState, action) => {
  switch (action.type) {
  case ORDER_PLACED: {
    const order = action.payload

    /* buy-side order */
    if (sign(order.quantity) === 1) {
      /* cost = |price * quantity| */
      const cost = chain(b(order.price)).multiply(b(order.quantity)).abs().done()

      /* reservedCash = reservedCash + cost + commission */
      const reservedCash = n(chain(b(state.get('reservedCash'))).add(b(cost)).add(b(order.commission)).done())

      /* cash = cash - cost - commission */
      const cash = n(chain(b(state.get('cash'))).subtract(b(cost)).subtract(b(order.commission)).done())

      state = state.set('reservedCash', reservedCash)
      state = state.set('cash', cash)
    }
    return state
  }

  case ORDER_FILLED: {
    const order = action.payload
    const direction = sign(order.quantity)

    if (direction === 1) {
      /* adjust commission for partially filled orders */
      /* adjustedCommission = expectedCommission * quantity / expectedQuantity */
      const adjustedCommission = chain(b(order.expectedCommission))
        .multiply(b(order.quantity))
        .divide(b(order.expectedQuantity))
        .done()

      /* order.expectedQuantity not used as we can be partially filled as well. */
      /* cost = quantity * expectedPrice + adjustedCommission */
      const cost = chain(b(order.quantity))
        .multiply(b(order.expectedPrice))
        .add(b(adjustedCommission))
        .done()
      state = state.set('reservedCash', math.subtract(state.get('reservedCash'), cost))
    } else {
      /* receivedCash = |quantity * price| - commission */
      const receivedCash = chain(b(order.quantity))
        .multiply(b(order.price))
        .abs()
        .subtract(b(order.commission))
        .done()

      /* cash = cash + receivedCash */
      const cash = n(math.add(b(state.get('cash')), b(receivedCash)))
      state = state.set('cash', cash)
    }

    /* adjust commission */
    state = state.set('commission', n(math.add(b(state.get('commission')), b(order.commission))))

    return state
  }

  case ORDER_CANCELLED: {
    const cancelledOrder = action.payload

    /* buy-side order */
    if (sign(cancelledOrder.quantity) === 1) {
      /* cost = |price * quantity| */
      const cost = chain(b(cancelledOrder.price)).multiply(b(cancelledOrder.quantity)).abs().done()

      /* reservedCash = reservedCash - cost - commission */
      const reservedCash = n(chain(b(state.get('reservedCash')))
        .subtract(b(cost)).subtract(b(cancelledOrder.commission)).done())

      /* cash = cash + cost + commission */
      const cash = n(chain(b(state.get('cash')))
        .add(b(cost)).add(b(cancelledOrder.commission)).done())

      state = state.set('reservedCash', reservedCash)
      state = state.set('cash', cash)
    }
    return state
  }

  default: {
    return state
  }
  }
}
