import {
  Store,
  StreamAction,
  Order,
  Middleware
} from '../typings'
import {
  ORDER_REQUESTED,
  ORDER_CREATED,
  ORDER_PLACED,
  ORDER_FILLED,
  ORDER_FAILED,
  ORDER_CANCEL,
  ORDER_CANCELLED
} from '../constants'

/**
 * Creates a broker middleware to be used running backtests.
 * In contrast to the backtest broker middleware, this middleware builds an order, then dispatches
 * the built order for the next round-trip. When the built order arrives back at this middleware,
 * it is executed synchronously.
 *
 * @private
 * @param  {function} createClient Factory function for building the client to be used when sending
 * requests to an _actual_ broker.
 * @return {Middleware} Middleware to be consumed by a Consumer.
 */
export function createBrokerRealtime(createClient: Function): Middleware {
  return (store: Store) => {

    const client = createClient({
      onFill: (order: Order) => store.dispatch({ type: ORDER_FILLED, payload: order })
    })

    return (next: Function) => (action: StreamAction) => {
      switch (action.type) {
      case ORDER_REQUESTED: {
        const requestedOrder = { ...action.payload }

        if (typeof requestedOrder.price === 'undefined') {
          store.dispatch({
            type: ORDER_FAILED,
            payload: {
              timestamp: Date.now(),
              error: new Error('missing order price')
            }
          })
          break
        }
        if (typeof requestedOrder.quantity === 'undefined') {
          store.dispatch({
            type: ORDER_FAILED,
            payload: {
              timestamp: Date.now(),
              error: new Error('missing order quantity')
            }
          })
          break
        }

        requestedOrder.commission = client.calculateCommission(requestedOrder)

        store.dispatch({ type: ORDER_CREATED, payload: requestedOrder })
        break
      }
      case ORDER_CREATED: {
        client.executeOrder({ ...action.payload }).then((res: Order) => {
          const executedOrder = res
          store.dispatch({ type: ORDER_PLACED, payload: { ...executedOrder } })
        }).catch((error: Error) => {
          store.dispatch({
            type: ORDER_FAILED,
            payload: {
              timestamp: Date.now(),
              error
            }
          })
        })
        break
      }
      case ORDER_CANCEL: {
        const id = action.payload.id
        if (store.getState().orders[id]) {
          client.cancelOrder({ id }).then(() => {
            const cancelledOrder = store.getState().orders[id]
            store.dispatch({ type: ORDER_CANCELLED, payload: { ...cancelledOrder } })
          }).catch((error: Error) => {
            store.dispatch({
              type: ORDER_FAILED,
              payload: {
                timestamp: Date.now(),
                error
              }
            })
          })
        } else {
          store.dispatch({
            type: ORDER_FAILED,
            payload: {
              timestamp: Date.now(),
              error: new Error(`could not find order with id ${id}`)
            }
          })
        }
        break
      }
      default:
        break
      }
      return next(action)
    }
  }
}
