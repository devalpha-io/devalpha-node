import Decimal from 'decimal.js'
import {
  StreamAction
} from '../typings'

export type TimestampState = Decimal

const initialState = new Decimal(0)

// @ts-ignore: TS6133 Unused local
export function timestampReducer (state: TimestampState = initialState, action: StreamAction) {
  return new Decimal(action.payload.timestamp)
}
