import https from 'https'
import { parse } from 'url'

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
    https.request({
      ...parse(url),
      method: 'post',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let response = ''
      res.on('data', (chunk) => {
        response += chunk
      })
        .on('end', () => {
          if (res.statusCode < 200 || res.statusCode > 299) {
            return onError(response)
          }
          return onNotify(response)
        })
        .on('error', onError)
    })
      .on('error', onError)
      .end(JSON.stringify({ text: message }))
  }

  return (store) => (next) => (action) => {
    switch (action.type) {
    case INITIALIZED: {
      let initialCash = 0
      if (action.payload.initialStates.capital) {
        initialCash = action.payload.initialStates.capital.cash || 0
      }
      notify(`Initialized strategy starting with ${initialCash}.`)
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
