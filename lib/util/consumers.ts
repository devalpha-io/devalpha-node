import * as _ from 'highland'
import {
  Store,
  Middleware,
  StreamAction
} from './types'

/**
 * A convenience function which partially applies the createConsumer function with the given store.
 *
 * @private
 * @param {Store} store An Store object.
 * @return {Function} A partially applied createConsumer-function which only takes a middleware as parameter.
 */
export const createConsumerCreator = (store: Store) => createConsumer(store)

/**
 * A factory function for creating a Consumer. A Consumer consumes events in the stream and invokes
 * the middleware onto the events.
 *
 * @private
 * @param {Store} store An Store object.
 * @return {Function} A function which takes a middleware as parameter, which then returns a Consumer.
 */
// tslint:disable-next-line:max-line-length
export const createConsumer = (store: Store) => (middleware: Middleware) => (err: Error, item: StreamAction | Highland.Nil, push: Function, next: Function): void => {
  if (err) {
    push(err)
    next()
  } else if (item === _.nil) {
    push(null, _.nil)
  } else {
    try {
      middleware(store)((nextItem: StreamAction) => {
        if (nextItem) {
          push(null, nextItem)
        } else {
          push(null, item)
        }
        next()
      })(<StreamAction>item)
    } catch (err) {
      push(err)
      next()
    }
  }
}

