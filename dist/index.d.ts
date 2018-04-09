/// <reference types="highland" />
import { VesterOptions, Strategy } from './typings';
export * from './constants';
/**
 * The entry point to the whole system.
 *
 * @param {Object} config The Vester configuration.
 * @param {boolean} config.backtesting
 * @param {number} config.capital
 * @param {Object} config.initialStates
 * @param {Object} feeds
 * @param {Object} config.backtest
 * @param {string} config.backtest.timestamp
 * @param {function|number} config.commission
 * @param {Object} config.guard
 * @param {boolean} config.guard.shorting
 * @param {boolean} config.guard.margin
 * @param {Array} config.guard.restricted
 * @param {function} strategy
 * @return {Stream}
 *
 * @example
 * import vester from 'vester'
 *
 * function strategy({ order }, action) {
 *   order({
 *     identifier: 'AAPL',
 *     quantity: 100,
 *     price: 150
 *   })
 * }
 *
 * vester({
 *   strategy,
 *   backtesting: false
 * })
 */
export declare function vester(config: VesterOptions, strategy: Strategy): Highland.Stream<{}>;
