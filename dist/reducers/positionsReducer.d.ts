import Decimal from 'decimal.js';
import { Position, StreamAction } from '../typings';
export declare type PositionsState = {
    instruments: {
        [key: string]: Position;
    };
    total: Decimal;
};
export declare function positionsReducer(state: PositionsState, action: StreamAction): Decimal | {
    instruments: {
        [key: string]: Position;
    };
    total: Decimal;
};
