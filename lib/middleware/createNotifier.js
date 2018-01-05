import fetch from 'cross-fetch'

import {
  INITIALIZED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_CANCELLED
} from '../constants'

export default function createMiddleware(options = {}) {
  const onNotify = options.onNotify || (() => {})
  const onError = options.onError || (() => {})
  const { url } = options

  function notify(message) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })
      .then((response) => {
        if (response.ok) {
          onNotify(response)
        } else {
          onError(response)
        }
      })
      .catch(onError.bind(this))
  }

  return (store) => (next) => (action) => {
    switch (action.type) {
    case INITIALIZED: {
      const { startCapital } = action.payload
      notify(`Initialized strategy starting with ${startCapital}.`)
      break
    }
    case ORDER_PLACED: {
      const { identifier, quantity, price } = action.payload
      notify(`Placed an order on ${identifier} of ${quantity} units at ${price}.`)
      break
    }
    case ORDER_FILLED: {
      const {
        identifier,
        quantity,
        expectedQuantity,
        price
      } = action.payload
      let filled = 'Filled'

      /* istanbul ignore if */
      if (quantity !== expectedQuantity) filled = 'Partially filled'

      notify(`${filled} an order on ${identifier} of ${quantity} units at ${price}.`)
      break
    }
    case ORDER_CANCELLED: {
      const { id } = action.payload
      notify(`Cancelled order with id ${id}.`)
      break
    }
    default: {
      break
    }
    }
    return next(action)
  }
}
