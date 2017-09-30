import { Map, List } from 'immutable'
import math, { chain, number as n, bignumber as b, sign } from 'mathjs'
import {
  buildTotal,
  buildReturnsTotal,
  buildReturnsPeriod,
  buildHistory
} from './util'

import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED,
  BAR_RECEIVED,
  INITIALIZED
} from '../constants'

const initialState = Map({
  cash: 0,
  commission: 0,
  history: List(),
  metrics: Map({
    maxDrawdown: 0,
    sharpeRatio: 0
  }),
  reservedCash: 0,
  returnsTotal: 0,
  returnsPeriod: 0,
  total: 0,
  timestamp: 0
})

/* TODO implement metrics */
export default (state = initialState, action) => {
  switch (action.type) {
  case INITIALIZED: {
    return state.set('history', buildHistory(state, action.payload.timestamp))
  }

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

    /* calculate and update the new total and returns */
    state = state.merge({
      total: buildTotal(state),
      returnsTotal: buildReturnsTotal(state),
      returnsPeriod: buildReturnsPeriod(state)
    })

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

  case BAR_RECEIVED: {
    state = state.merge({
      total: buildTotal(state),
      returnsTotal: buildReturnsTotal(state),
      returnsPeriod: buildReturnsPeriod(state)
    })
    state = state.set('history', buildHistory(state))

    return state
  }

  default: {
    return state
  }
  }
}
