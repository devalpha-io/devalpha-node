import Decimal from 'decimal.js'
import {
  isValid,
  getTime
} from 'date-fns'
import {
  StreamAction
} from '../typings'

export type TimestampState = Decimal

const initialState = new Decimal(0)

export function timestampReducer (state: TimestampState = initialState, action: StreamAction) {
  return new Decimal(action.payload.timestamp)
}
