import Decimal from 'decimal.js';
import { StreamAction } from '../typings';
export declare type CapitalState = {
    cash: Decimal;
    commission: Decimal;
    reservedCash: Decimal;
    total: Decimal;
};
export declare function capitalReducer(state: CapitalState, action: StreamAction): CapitalState;
