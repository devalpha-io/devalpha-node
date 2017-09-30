import test from 'ava'
import sinon from 'sinon'
import { Map, List, is } from 'immutable'

import reducer from '../lib/reducers/capitalReducer'
import {
  INITIALIZED,
  ORDER_FILLED,
  BAR_RECEIVED
} from '../lib/constants'

/**
 * We use this file to test the globalReducer, as it is strongly dependent on the other reducers,
 * and as such there is no point in testing it on its own.
 */
test.todo('return the initial state')
