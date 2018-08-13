import Decimal from 'decimal.js'
import {
  StreamAction,
  Bar,
  PositionsState,
  // @ts-ignore TS6133
  Position
} from '../types'

import {
  INITIALIZED,
  ORDER_FILLED
} from '../constants'

const initialState = {
  instruments: {},
  total: new Decimal(0)
}

/**
 * Tries to collect properties assembling a chart bar from an object.
 * @param {any} maybeBar A possible bar
 */
export function parseBar(maybeBar: any) {
  const bar: Bar = {} as Bar
  if (maybeBar.identifier) {
    bar.identifier = maybeBar.identifier
  } else {
    throw new TypeError('Invalid argument')
  }
  for (const key of ['open', 'high', 'low', 'close']) {
    if (typeof maybeBar[key] === 'undefined') {
      throw new TypeError('Invalid argument')
    } else {
      bar[key] = new Decimal(maybeBar[key])
    }
  }
  return bar
}

/**
 * Reducer function for managing open positions and their total value.
 *
 * @private
 * @param  {PositionsState =      initialState} state Current state.
 * @param  {StreamAction}    action An action received from the stream.
 * @return {PositionsState}           Next state.
 */
export function positionsReducer(state: PositionsState = initialState, action: StreamAction) {
  state = {
    ...state,
    instruments: Object.assign({}, state.instruments)
  }
  switch (action.type) {

    case INITIALIZED: {
      if (action.payload.initialStates.positions) {
        const initial = action.payload.initialStates.positions
        state = { ...state, ...initial }
      }
      break
    }

    case ORDER_FILLED: {
      const filledOrder = action.payload.filledOrder

      const { identifier } = filledOrder
      // @ts-ignore TS2322 Decimal.sign returns number (decimal.js@10.0.0)
      const direction: number = Decimal.sign(filledOrder.quantity)

      /* this is a new instrument, so add it and exit early */
      if (!state.instruments[identifier]) {
        /* value = quantity * price */
        const value = Decimal.mul(filledOrder.quantity, filledOrder.price)

        state.instruments[identifier] = {
          quantity: new Decimal(filledOrder.quantity),
          value,
          price: new Decimal(filledOrder.price)
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
        const price = Decimal.mul(filledOrder.price, filledOrder.quantity)
          .add(Decimal.mul(instrument.quantity, instrument.price))
          .div(Decimal.add(instrument.quantity, filledOrder.quantity))

        instrument.price = price
      }

      /* update quantity */
      /* quantity = instrument.quantity + order.quantity */
      const quantity = Decimal.add(instrument.quantity, filledOrder.quantity)

      /* update value */
      /* value = order.price * (instrument.quantity + order.quantity) */
      const value = Decimal.mul(filledOrder.price, Decimal.add(instrument.quantity, filledOrder.quantity))

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

    default: {
      try {
        const bar = parseBar(action.payload)
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
      } catch (e) {
        // Do nothing
      }

      break
    }
  }

  return { ...state }
}
