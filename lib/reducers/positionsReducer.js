import { Map } from 'immutable'
import { chain, number as n, bignumber as b, sign, add, multiply, subtract } from 'mathjs'

import {
  INITIALIZED,
  ORDER_FILLED,
  BAR_RECEIVED
} from '../constants'

const initialState = Map({
  instruments: Map(),
  total: 0
})

export default (state = initialState, action) => {
  switch (action.type) {

  case INITIALIZED: {
    if (action.payload.initialStates.positions) {
      // TODO validate supplied data
      const initial = action.payload.initialStates.positions
      for (const key of initialState.keys()) {
        if (typeof initial[key] !== 'undefined') {
          state = state.mergeIn([key], initial[key])
        }
      }
    }
    return state
  }

  case ORDER_FILLED: {
    const order = action.payload
    const { identifier } = order
    const direction = sign(order.quantity)

    /* this is a new instrument, so add it and exit early */
    if (!state.hasIn(['instruments', identifier])) {
      /* value = quantity * price */
      const value = n(multiply(b(order.quantity), b(order.price)))

      state = state.setIn(['instruments', identifier], Map({
        quantity: order.quantity,
        value,
        price: order.price
      }))

      return state.set('total', n(add(b(state.get('total')), b(value))))
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

    const oldValue = instrument.get('value')

    instrument = instrument.merge({ quantity, value })

    /* delete position and exit early if quantity is now 0 */
    if (instrument.get('quantity') === 0) {
      state = state.deleteIn(['instruments', identifier])
      return state.set('total', n(subtract(b(state.get('total')), b(oldValue))))
    }

    state = state.setIn(['instruments', identifier], instrument)

    state = state.set('total', n(chain(b(state.get('total')))
      .add(subtract(
        b(value),
        b(oldValue)
      ))
      .done()))

    return state
  }

  case BAR_RECEIVED: {
    const bar = action.payload
    const { identifier } = bar

    if (state.hasIn(['instruments', identifier])) {
      /* create a zero-value position if non-existent, then do nothing more */
      const quantity = state.getIn(['instruments', identifier, 'quantity'])
      const marketPrice = bar.close
      const oldValue = state.getIn(['instruments', identifier, 'value'])

      /* calculate the new the value of the position */
      /* value = quantity * marketPrice */
      const value = n(chain(b(quantity)).multiply(b(marketPrice)).done())

      /* assign the new position */
      state = state.setIn(['instruments', identifier, 'value'], value)

      state = state.set('total', n(chain(b(state.get('total')))
        .add(subtract(
          b(value),
          b(oldValue)
        ))
        .done()))
    }

    return state
  }

  default: {
    return state
  }
  }
}
