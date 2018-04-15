import Decimal from 'decimal.js'
import {
  Position,
  StreamAction
} from '../typings'

import {
  INITIALIZED,
  ORDER_FILLED,
  BAR_RECEIVED
} from '../constants'

export type PositionsState = {
  instruments: {
    [key: string]: Position
  },
  total: Decimal
}

const initialState = {
  instruments: {},
  total: new Decimal(0)
}

/**
 * Reducer function for managing open positions and their total value.
 *
 * @private
 * @param  {PositionsState =      initialState} state Current state.
 * @param  {StreamAction}    action An action received from the stream.
 * @return {PositionsState}           Next state.
 */
export function positionsReducer (state: PositionsState = initialState, action: StreamAction) {
  state = {
    ...state,
    instruments: Object.assign({}, state.instruments)
  }
  switch (action.type) {

    case INITIALIZED: {
      if (action.payload.initialStates.positions) {
        // TODO validate supplied data
        const initial = action.payload.initialStates.positions
        state = { ...state, ...initial }
      }
      break
    }

    case ORDER_FILLED: {
      const order = action.payload
      const { identifier } = order
      // @ts-ignore TS2322 Decimal.sign returns number (decimal.js@10.0.0)
      const direction: number = Decimal.sign(order.quantity)

      /* this is a new instrument, so add it and exit early */
      if (!state.instruments[identifier]) {
        /* value = quantity * price */
        const value = Decimal.mul(order.quantity, order.price)

        state.instruments[identifier] = {
          quantity: new Decimal(order.quantity),
          value,
          price: new Decimal(order.price)
        }

        state.total = Decimal.add(state.total, value)
        break
      }

      let instrument = state.instruments[identifier]

      /* update average aquired price if buying */
      if (direction === 1) {
        /* price =
         *   (order.price * order.quantity + (instrument.quantity * instrument.price)) /
         *   (instrument.quantity + order.quantity) */
        const price = Decimal.mul(order.price, order.quantity)
          .add(Decimal.mul(instrument.quantity, instrument.price))
          .div(Decimal.add(instrument.quantity, order.quantity))

        instrument.price = price
      }

      /* update quantity */
      /* quantity = instrument.quantity + order.quantity */
      const quantity = Decimal.add(instrument.quantity, order.quantity)

      /* update value */
      /* value = order.price * (instrument.quantity + order.quantity) */
      const value = Decimal.mul(order.price, Decimal.add(instrument.quantity, order.quantity))
        
      const oldValue = instrument.value

      instrument = { ...instrument, quantity, value }

      /* delete position and exit early if quantity is now 0 */
      if (instrument.quantity.eq(0)) {
        delete state.instruments[identifier]
        state.total = Decimal.sub(state.total, oldValue)
        break
      }

      state.instruments[identifier] = instrument

      state.total = Decimal.add(state.total, Decimal.sub(value, oldValue))
        
      break
    }

    case BAR_RECEIVED: {
      const bar = action.payload
      const { identifier } = bar

      if (state.instruments[identifier]) {
        /* create a zero-value position if non-existent, then do nothing more */
        const quantity = state.instruments[identifier].quantity
        const marketPrice = bar.close
        const oldValue = state.instruments[identifier].value

        /* calculate the new the value of the position */
        /* value = quantity * marketPrice */
        const value = Decimal.mul(quantity, marketPrice)
        /* assign the new position */
        state.instruments[identifier].value = value

        state.total = Decimal.add(state.total, Decimal.sub(value, oldValue))
      }

      break
    }

    default: {
      break
    }
  }
  
  return { ...state }
}
