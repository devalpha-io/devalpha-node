import Decimal from 'decimal.js'
import {
  StreamAction
} from '../typings'

import {
  INITIALIZED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED
} from '../constants'

export type CapitalState = {
  cash: Decimal,
  commission: Decimal,
  reservedCash: Decimal,
  total: Decimal
}

const initialState: CapitalState = {
  cash: new Decimal(0),
  commission: new Decimal(0),
  reservedCash: new Decimal(0),
  total: new Decimal(0)
}

/**
 * Reducer function for managing available and spent capital.
 *
 * @private
 * @param  {CapitalState =      initialState} state Current state.
 * @param  {StreamAction}    action An action received from the stream.
 * @return {CapitalState}           Next state.
 */
export function capitalReducer (state: CapitalState = initialState, action: StreamAction): CapitalState {
  state = { ...state }

  switch (action.type) {
    case INITIALIZED: {
      if (typeof action.payload.startCapital !== 'undefined') {
        state.cash = new Decimal(action.payload.startCapital)
        state.total = new Decimal(action.payload.startCapital)
      }
      if (action.payload.initialStates.capital) {
        // TODO validate supplied data
        // TODO check that total = cash + reservedCash
        const initial = action.payload.initialStates.capital
        
        if (typeof initial.cash !== 'undefined') state.cash = new Decimal(initial.cash)
        if (typeof initial.commission !== 'undefined') state.commission = new Decimal(initial.commission)
        if (typeof initial.reservedCash !== 'undefined') state.reservedCash = new Decimal(initial.reservedCash)
        if (typeof initial.total !== 'undefined') state.total = new Decimal(initial.total)
      }
      break
    }
    case ORDER_PLACED: {
      const order = action.payload
      // @ts-ignore TS2322 Decimal.sign returns number (decimal.js@10.0.0)
      const direction: number = Decimal.sign(order.quantity)
      let cash
      let reservedCash

      if (direction === 1) {
        /* cost = |price * quantity| */
        const cost = new Decimal(order.price).mul(order.quantity).abs()

        /* reservedCash = reservedCash + cost + commission */
        reservedCash = new Decimal(state.reservedCash).add(cost).add(order.commission)

        /* cash = cash - cost - commission */
        cash = new Decimal(state.cash).sub(cost).sub(order.commission)
      } else {
        /* reservedCash = reservedCash + commission */
        reservedCash = new Decimal(state.reservedCash).add(order.commission)

        /* cash = cash - commission */
        cash = new Decimal(state.cash).sub(order.commission)
      }

      state.reservedCash = reservedCash
      state.cash = cash

      state.total = Decimal.add(state.cash, state.reservedCash)

      break
    }

    case ORDER_FILLED: {
      const order = action.payload

      // @ts-ignore TS2322 Decimal.sign returns number (decimal.js@10.0.0)
      const direction: number = Decimal.sign(order.quantity)

      /* adjust commission for partially filled orders */
      /* adjustedCommission = expectedCommission * quantity / expectedQuantity */
      const adjustedCommission = new Decimal(order.expectedCommission)
        .mul(order.quantity)
        .div(order.expectedQuantity)

      if (direction === 1) {
        /* order.expectedQuantity not used as we can be partially filled as well. */
        /* cost = quantity * expectedPrice + adjustedCommission */
        const cost = new Decimal(order.quantity)
          .mul(order.expectedPrice)
          .add(adjustedCommission)

        /* reservedCash = reservedCash - cost */
        const reservedCash = Decimal.sub(state.reservedCash, cost)

        state.reservedCash = reservedCash
      } else {
        /* we might get filled at a higher price than expected, and thus pay higher commission */
        /* extraCommission = max(0, (commission - expectedCommission) * quantity) */
        const extraCommission = Decimal.max(0, 
          Decimal.sub(order.commission, order.expectedCommission).mul(order.commission)
        )

        /* receivedCash = |quantity * price| - extraCommission */
        const receivedCash = Decimal.mul(order.quantity, order.price)
          .abs()
          .sub(extraCommission)

        /* cash = cash + receivedCash */
        const cash = Decimal.add(state.cash, receivedCash)

        /* reservedCash = reservedCash - adjustedCommission */
        const reservedCash = Decimal.sub(state.reservedCash, adjustedCommission)

        state.cash = cash
        state.reservedCash = reservedCash
      }

      /* adjust commission */
      state.commission = Decimal.add(state.commission, order.commission)

      state.total = Decimal.add(state.cash, state.reservedCash)

      break
    }

    case ORDER_CANCELLED: {
      const cancelledOrder = action.payload
      // @ts-ignore TS2322 Decimal.sign returns number (decimal.js@10.0.0)
      const direction: number = Decimal.sign(cancelledOrder.quantity)

      /* buy-side order */
      if (direction === 1) {
        /* cost = |price * quantity| */
        const cost = Decimal.mul(cancelledOrder.price, cancelledOrder.quantity).abs()

        /* reservedCash = reservedCash - cost - commission */
        const reservedCash = Decimal.sub(state.reservedCash, cost).sub(cancelledOrder.commission)

        /* cash = cash + cost + commission */
        const cash = Decimal.add(state.cash, cost).add(cancelledOrder.commission)

        state.reservedCash = reservedCash
        state.cash = cash
      }
      break
    }

    default: {
      break
    }
  }

  return { ...state }
}
