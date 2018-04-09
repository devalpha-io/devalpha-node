import * as Redux from 'redux';
import { StreamAction, RootState } from '../typings';
/**
 * Creates a broker middleware to be used running backtests.
 * In contrast to the backtest broker middleware, this middleware builds an order, then dispatches
 * the built order for the next round-trip. When the built order arrives back at this middleware,
 * it is executed synchronously.
 *
 * @private
 * @param  {function} createClient Factory function for building the client to be used when sending
 * requests to an _actual_ broker.
 * @return {function} Middleware
 */
export default function createBrokerRealtime(createClient: Function): (store: Redux.Store<RootState>) => (next: Function) => (action: StreamAction) => void;
