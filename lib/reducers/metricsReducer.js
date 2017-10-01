/**
 * This file is part of the "hack" used to calculate metrics.
 * The actual logic that belongs to these properties are calculated
 * in globalReducer instead.
 */

import { Map, List } from 'immutable'

const initialState = Map({
  history: List(),
  maxDrawdown: 0,
  sharpeRatio: 0,
  returnsTotal: 0,
  returnsPeriod: 0,
  total: 0,
  timestamp: 0
})

export default (state = initialState) => state
