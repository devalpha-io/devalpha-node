import * as _ from 'highland'
import {
  Store,
  Middleware,
  StreamAction
} from './typings/index'

export const createConsumerCreator = (store: Store) => createConsumer(store)

export const createConsumer = (store: Store) => (middleware: Middleware) => (err: Error, item: StreamAction | Highland.Nil, push: Function, next: Function) => {
  if (err) {
    push(err)
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
