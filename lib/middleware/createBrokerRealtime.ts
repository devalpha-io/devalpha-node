import Decimal from 'decimal.js'
import { createOrderCreator } from '../order'
import {
  Store,
  StreamAction,
  Middleware,
  CreatedOrder,
  ExecutedOrder
} from '../types'
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
      // @todo Don't require the client to provide expectedPrice/Quantity/Commission
      onFill: (order: ExecutedOrder) => {
        store.dispatch({
          type: ORDER_FILLED,
          payload: {
            placedOrder: { ...store.getState().orders[order.id] },
            filledOrder: {
              id: order.id,
              identifier: order.identifier,
              price: new Decimal(order.price),
              quantity: new Decimal(order.quantity),
              commission: new Decimal(order.commission),
              timestamp: order.timestamp
            },
            timestamp: order.timestamp
          }
        })
      }
    })

    const createOrder = createOrderCreator(store)(client.calculateCommission)

    return (next: Function) => (action: StreamAction) => {
      switch (action.type) {
        case ORDER_REQUESTED: {
          const order = { ...action.payload }
          const createdOrder: CreatedOrder = createOrder(order)
          store.dispatch({ type: ORDER_CREATED, payload: createdOrder })
          break
        }
        case ORDER_CREATED: {
          client.executeOrder({ ...action.payload }).then((res: any) => {
            const executedOrder: ExecutedOrder = {
              id: res.id,
              identifier: res.identifier,
              price: res.price,
              quantity: res.quantity,
              commission: res.commission,
              timestamp: res.timestamp
            }
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
