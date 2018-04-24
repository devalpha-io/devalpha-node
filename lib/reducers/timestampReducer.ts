import {
  StreamAction,
  TimestampState
} from '../types'

const initialState = 0

/**
 * Reducer function keeping track of the current millisecond unix timestamp.
 *
 * @private
 * @param  {TimestampState =      initialState} state Current state.
 * @param  {StreamAction}    action An action received from the stream.
 * @return {TimestampState}           Next state.
 */
export function timestampReducer(state: TimestampState = initialState, action: StreamAction) {
  if (action.payload && typeof action.payload.timestamp !== 'undefined') {
    return action.payload.timestamp
  }
  return state
}
