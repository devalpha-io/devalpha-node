import Decimal from 'decimal.js'
import { CapitalState } from '../reducers/capitalReducer'
import { OrdersState } from '../reducers/ordersReducer'
import { PositionsState } from '../reducers/positionsReducer'
import { TimestampState } from '../reducers/timestampReducer'

export interface Feeds<R> {
  [key: string]: any
}

export interface FeedItem {
  timestamp: number,
  [key: string]: any
}

export interface StreamAction {
  type: string,
  payload: FeedItem
}

export interface GuardOptions {
  shorting?: boolean,
  margin?: boolean,
  restricted?: Array<string>
}

export interface VesterOptions {
  backtesting: boolean,
  client: any,
  startCapital: number,
  initialStates: RootState,
  feeds: {
    [key: string]: any
  },
  backtest: {
    timestamp: number,
    commission: number | Function,
  },
  guard: GuardOptions,
  dashboard: {
    active: boolean,
    port: number
  }
}

export interface Store {
  dispatch: Function,
  getState: Function,
  setState: Function
}

export interface RootState {
  capital: CapitalState,
  orders: OrdersState,
  positions: PositionsState,
  timestamp: TimestampState
}

export interface Context {
  state: () => RootState,
  order: (order: any) => StreamAction,
  cancel: (id: string) => StreamAction,
}

export type Middleware = (store: Store) => (next: Function) => (action: StreamAction) => void

export type Consumer = (err: Error, item: StreamAction | Highland.Nil, push: Function, next: Function) => void

export interface Order {
  identifier: string,
  quantity: number,
  price?: number
}

export interface RequestedOrder extends Order {

}

export interface CreatedOrder extends Order {
  id: string,
  commission: number,
  timestamp: number,
  price: number
}

export interface ExecutedOrder extends Order {
  id: string,
  timestamp: number,
  commission: number,
  price: number
}

export interface Position {
  quantity: Decimal,
  value: Decimal,
  price: Decimal
}

type Strategy = (context: Context, action: StreamAction) => void
