import { ExecutedOrder, StreamAction } from '../typings';
export declare type OrdersState = {
    [key: string]: ExecutedOrder;
};
export declare function ordersReducer(state: OrdersState, action: StreamAction): {
    [x: string]: ExecutedOrder;
};
