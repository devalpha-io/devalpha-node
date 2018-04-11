import {
  StreamAction
} from '../typings'

export type TimestampState = number

const initialState = 0

// @ts-ignore: TS6133 Unused local
export function timestampReducer (state: TimestampState = initialState, action: StreamAction) {
  if (action.payload && typeof action.payload.timestamp !== 'undefined') {
    return action.payload.timestamp
  }
  return state
}
