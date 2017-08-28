import { Map, List } from 'immutable'
import math, { chain, number as n, bignumber as b, sign } from 'mathjs'
import { calculateTotal, calculateReturnsTotal, calculateReturnsPeriod, calculateHistory } from './util'
import {
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED,
  LISTENER_ADDED,
  BAR_RECEIVED,
  INITIALIZED
} from '../constants'

const initialState = Map({
  cash: 0,
  commission: 0,
  orders: Map(),
  history: List(),
  listeners: Map(),
  positions: Map(),
  reservedCash: 0,
  returnsTotal: 0,
  returnsPeriod: 0,
  total: 0,
  timestamp: 0
})

export default (state = initialState, action) => {
  switch (action.type) {
  case INITIALIZED: {
    return state.set('history', calculateHistory(state, action.payload.timestamp))
  }

  case ORDER_PLACED: {
    let nextState = state
    const order = action.payload

    /* Buy-side order */
    if (sign(order.quantity) === 1) {
      const cost = chain(b(order.price)).multiply(b(order.quantity)).abs().done()
      const reservedCash = n(chain(b(state.get('reservedCash'))).add(b(cost)).add(b(order.commission)).done())
      const cash = n(chain(b(state.get('cash'))).subtract(b(cost)).subtract(b(order.commission)).done())
      nextState.set('reservedCash', reservedCash)
      nextState.set('cash', cash)
    }
    nextState = nextState.setIn(['orders', order.id], order)
    return nextState
  }

  case ORDER_FILLED: {
    let nextState = state
    const order = action.payload
    const identifier = order.identifier
    const direction = sign(order.quantity)

    if (direction === 1) {
      /* Adjust commission for partially filled orders */
      const adjustedCommission = chain(b(order.expectedCommission))
        .multiply(b(order.quantity))
        .divide(b(order.expectedQuantity))
        .done()
      /* order.expectedQuantity not used as we can be partially filled as well. */
      const cost = chain(b(order.quantity))
        .multiply(b(order.expectedPrice))
        .add(b(adjustedCommission))
        .done()
      nextState = nextState.set('reservedCash', math.subtract(nextState.get('reservedCash'), cost))
    } else {
      const receivedCash = chain(b(order.quantity))
        .multiply(b(order.price))
        .abs()
        .subtract(b(order.commission))
        .done()

      nextState = nextState.set('cash', n(math.add(b(nextState.get('cash')), b(receivedCash))))
    }

    /* adjust commission */
    nextState = nextState.set('commission', n(math.add(b(nextState.get('commission')), b(order.commission))))

    /* update instrument position */
    if (!nextState.hasIn(['positions', identifier])) {
      nextState = nextState.setIn(['positions', identifier], Map({
        quantity: order.quantity,
        value: n(math.multiply(b(order.quantity), b(order.price))),
        price: order.price
      }))
    } else {
      /* instrument already exists in positions, so we perform some calculations */
      let instrument = nextState.getIn(['positions', identifier])
      const oldQuantity = instrument.get('quantity')

      instrument = instrument.merge({
        quantity: n(math.add(b(instrument.get('quantity')), b(order.quantity))),
        value: n(math.multiply(b(instrument.get('quantity')), b(order.price)))
      })

      /* update average aquired price if buying */
      if (direction === 1) {
        /* avgPrice = ((order.price * order.qty) + (oldQuantity * oldPrice)) / (oldQuantity + order.qty) */
        instrument = instrument.set('price', chain(b(order.price))
          .multiply(b(order.quantity))
          .add(math.multiply(b(instrument.get('price')), b(oldQuantity)))
          .divide(b(instrument.get('quantity')))
          .done()
        )
      }

      /* reset average acquired price if quantity is now 0 */
      if (math.equal(instrument.get('quantity'), 0)) {
        instrument = instrument.set('price', 0)
      }

      nextState = nextState.setIn(['positions', identifier], instrument)
    }

    /* delete open order since it is now filled */
    nextState = nextState.deleteIn(['orders', order.id])

    /* calculate and update the new total and returns */
    nextState = nextState.set('total', calculateTotal(nextState))
    nextState = nextState.set('returnsTotal', calculateReturnsTotal(nextState))
    nextState = nextState.set('returnsPeriod', calculateReturnsPeriod(nextState))

    return nextState
  }

  case ORDER_CANCELLED: {
    const cancelledOrder = action.payload
    /* Buy-side order */
    if (sign(cancelledOrder.quantity) === 1) {
      const cost = chain(b(cancelledOrder.price)).multiply(b(cancelledOrder.quantity)).abs().done()
      return {
        ...state,
        reservedCash: n(chain(b(state.reservedCash)).add(b(cost)).add(b(cancelledOrder.commission)).done()),
        cash: n(chain(b(state.cash)).subtract(b(cost)).subtract(b(cancelledOrder.commission)).done())
      }
    }
    return state
  }

  case BAR_RECEIVED: {
    const bar = action.payload
    const identifier = bar.identifier

    let nextState = state
    if (!nextState.hasIn(['positions', identifier])) {
      // Create a zero-value position if non-existent, then do nothing
      nextState = state.setIn(['positions', identifier], Map({
        quantity: 0,
        value: 0,
        price: 0
      }))
      return nextState.set('history', calculateHistory(nextState))
    }
    const quantity = state.getIn(['positions', identifier]).get('quantity')
    const marketPrice = bar.close
    // Calculate the new the value of the position
    const value = n(chain(b(quantity)).multiply(b(marketPrice)).done())
    // Assign the new position
    nextState = nextState.setIn(['positions', identifier, 'value'], value)
    nextState = nextState.set('total', calculateTotal(nextState))
    nextState = nextState.set('returnsTotal', calculateReturnsTotal(nextState))
    nextState = nextState.set('returnsPeriod', calculateReturnsPeriod(nextState))
    nextState = nextState.set('history', calculateHistory(nextState))

    return nextState
  }

  case LISTENER_ADDED: {
    const listeners = {
      [action.payload.eventName]: action.payload.callback
    }
    return {
      ...state,
      ...listeners
    }
  }

  default:
    return state
  }
}
