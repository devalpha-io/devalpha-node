/// <reference types="highland" />
import * as Redux from 'redux';
import { StreamAction } from './typings';
/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store, and buffers actions until all middlewares are finished processing
 * the action. This should be the first store enhancer in the composition chain.
 *
 * @param {...function} middlewares The chain of middlewares to be applied.
 * @returns {function} A store enhancer applying the middleware.
 */
export default function applyMiddlewareSeq(stream: Highland.Stream<StreamAction>, middlewares?: Array<Function>): (createStore: Function) => (reducer: Redux.Reducer<StreamAction>, preloadedState: any, enhancer: any) => any;
