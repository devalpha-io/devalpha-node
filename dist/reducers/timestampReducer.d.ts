import Decimal from 'decimal.js';
import { StreamAction } from '../typings';
export declare type TimestampState = Decimal;
export declare function timestampReducer(state: TimestampState, action: StreamAction): Decimal;
