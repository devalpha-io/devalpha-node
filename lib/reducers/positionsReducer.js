import { Map } from 'immutable'
import math, { chain, number as n, bignumber as b, sign } from 'mathjs'

import {
  ORDER_FILLED,
  BAR_RECEIVED
} from '../constants'

const initialState = Map()

export default (state = initialState, action) => {
  switch (action.type) {

  case ORDER_FILLED: {
    const order = action.payload
    const identifier = order.identifier
    const direction = sign(order.quantity)

    /* this is a new instrument, so add it and exit early */
    if (!state.has(identifier)) {
      /* value = quantity * price */
      const value = n(math.multiply(b(order.quantity), b(order.price)))

      return state.set(identifier, Map({
        quantity: order.quantity,
        value,
        price: order.price
      }))
    }

    let instrument = state.get(identifier)

    /* update average aquired price if buying */
    if (direction === 1) {
      /* price = 
       *   (order.price * order.quantity + (instrument.quantity * instrument.price)) / 
       *   (instrument.quantity + order.quantity) */ 
      const price = n(chain(b(order.price))
        .multiply(b(order.quantity))
        .add(math.multiply(b(instrument.get('quantity')), b(instrument.get('price'))))
        .divide(math.add(b(instrument.get('quantity')), b(order.quantity)))
        .done())

      instrument = instrument.set('price', price)
    }

    /* update quantity */
    /* quantity = instrument.quantity + order.quantity */
    const quantity = n(math.add(b(instrument.get('quantity')), b(order.quantity)))

    /* update value */
    /* value = order.price * (instrument.quantity + order.quantity) */
    const value = n(chain(b(order.price))
      .multiply(math.add(b(instrument.get('quantity')), b(order.quantity)))
      .done())

    instrument = instrument.merge({ quantity, value })

    /* delete position and exit early if quantity is now 0 */
    if (math.equal(instrument.get('quantity'), 0)) {
      return state.delete(identifier)
    }

    state = state.set(identifier, instrument)

    return state
  }

  case BAR_RECEIVED: {
    const bar = action.payload
    const identifier = bar.identifier

    if (state.has(identifier)) {
      /* create a zero-value position if non-existent, then do nothing more */
      const quantity = state.getIn([identifier, 'quantity'])
      const marketPrice = bar.close

      /* calculate the new the value of the position */
      /* value = quantity * marketPrice */
      const value = n(chain(b(quantity)).multiply(b(marketPrice)).done())

      /* assign the new position */
      state = state.setIn([identifier, 'value'], value)
    }

    return state
  }

  default: {
    return state
  }
  }
}
