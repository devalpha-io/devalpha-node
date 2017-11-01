import { Map, List } from 'immutable'
import { chain, number as n, bignumber as b, sign, add, multiply } from 'mathjs'

import {
  INITIALIZED,
  ORDER_FILLED,
  BAR_RECEIVED
} from '../constants'

const initialState = Map({
  instruments: Map(),
  history: List()
})

export default (state = initialState, action) => {
  switch (action.type) {

  case INITIALIZED: {
    if (action.payload.initialStates.positions) {
      // TODO validate supplied data
      const initial = action.payload.initialStates.positions
      state = state.mergeIn(['instruments'], initial.instruments)
      state = state.mergeIn(['history'], initial.history)
    }
    const history = Map({
      instruments: state.get('instruments'),
      timestamp: action.payload.timestamp
    })
    state = state.update('history', list => list.push(history))
    return state
  }

  case ORDER_FILLED: {
    const order = action.payload
    const identifier = order.identifier
    const direction = sign(order.quantity)

    /* this is a new instrument, so add it and exit early */
    if (!state.hasIn(['instruments', identifier])) {
      /* value = quantity * price */
      const value = n(multiply(b(order.quantity), b(order.price)))

      return state.setIn(['instruments', identifier], Map({
        quantity: order.quantity,
        value,
        price: order.price
      }))
    }

    let instrument = state.getIn(['instruments', identifier])

    /* update average aquired price if buying */
    if (direction === 1) {
      /* price = 
       *   (order.price * order.quantity + (instrument.quantity * instrument.price)) / 
       *   (instrument.quantity + order.quantity) */ 
      const price = n(chain(b(order.price))
        .multiply(b(order.quantity))
        .add(multiply(b(instrument.get('quantity')), b(instrument.get('price'))))
        .divide(add(b(instrument.get('quantity')), b(order.quantity)))
        .done())

      instrument = instrument.set('price', price)
    }

    /* update quantity */
    /* quantity = instrument.quantity + order.quantity */
    const quantity = n(add(b(instrument.get('quantity')), b(order.quantity)))

    /* update value */
    /* value = order.price * (instrument.quantity + order.quantity) */
    const value = n(chain(b(order.price))
      .multiply(add(b(instrument.get('quantity')), b(order.quantity)))
      .done())

    instrument = instrument.merge({ quantity, value })

    /* delete position and exit early if quantity is now 0 */
    if (instrument.get('quantity') === 0) {
      return state.deleteIn(['instruments', identifier])
    }

    state = state.setIn(['instruments', identifier], instrument)

    /* update history */
    const history = Map({
      instruments: state.get('instruments'),
      timestamp: order.timestamp
    })
    state = state.update('history', list => list.push(history))

    return state
  }

  case BAR_RECEIVED: {
    const bar = action.payload
    const identifier = bar.identifier

    if (state.hasIn(['instruments', identifier])) {
      /* create a zero-value position if non-existent, then do nothing more */
      const quantity = state.getIn(['instruments', identifier, 'quantity'])
      const marketPrice = bar.close

      /* calculate the new the value of the position */
      /* value = quantity * marketPrice */
      const value = n(chain(b(quantity)).multiply(b(marketPrice)).done())

      /* assign the new position */
      state = state.setIn(['instruments', identifier, 'value'], value)
    }

    /* update history */
    const history = Map({
      instruments: state.get('instruments'),
      timestamp: bar.timestamp
    })
    state = state.update('history', list => list.push(history))

    return state
  }

  default: {
    return state
  }
  }
}
