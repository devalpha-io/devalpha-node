import * as Redux from 'redux';
import { StreamAction, RootState } from '../typings';
/**
 * Creates a broker middleware to be used when running backtests.
 * In contrast to the realtime broker middleware, this middleware both places and fills an order
 * in one cycle. This makes it possible to simulate what would happen if we always were able to
 * perform our transactions at the historical date and time.
 *
 * @private
 * @param  {number|function} commission Calculate the commission based on price and quantity
 * @return {function} Middleware
 */
export default function createBrokerBacktest(commission?: number | Function): (store: Redux.Store<RootState>) => (next: Function) => (action: StreamAction) => any;
