import Decimal from 'decimal.js'

export type TimestampState = number

export type Bar = IBar & {
  [key: string]: any
}

export interface IBar {
  timestamp: number,
  identifier: string,
  open: number | Decimal,
  high: number | Decimal,
  low: number | Decimal,
  close: number | Decimal
}

export type OrdersState = {
  [key: string]: ExecutedOrder
}

export interface Position {
  quantity: Decimal,
  value: Decimal,
  price: Decimal
}

export type PositionsState = {
  instruments: {
    [key: string]: Position
  },
  total: Decimal
}

export type CapitalState = {
  cash: Decimal,
  commission: Decimal,
  reservedCash: Decimal,
  total: Decimal
}

export interface Feeds<R> {
  [key: string]: Highland.Stream<R>
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
  restricted?: string[]
}

export interface DevAlphaOptions {
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
  order: (order: RequestedOrder) => void,
  cancel: (id: string) => StreamAction,
}

export type Middleware = (store: Store) => (next: Function) => (action: StreamAction) => void

export type Consumer = (err: Error, item: StreamAction | Highland.Nil, push: Function, next: Function) => void


export interface Order {
  identifier: string
}

export interface LimitOrder extends Order { price: number }

export interface QuantityOrder extends Order { quantity: number }
export interface PercentageOrder extends Order { percent: number }

export interface StopOrder extends Order { trigger: number }
export interface TrailingOrder extends Order { threshold: number }

export type AutomatedOrder = StopOrder | TrailingOrder
export type SizedOrder = PercentageOrder | QuantityOrder

export type RequestedOrder = (
  (LimitOrder & SizedOrder) |
  (LimitOrder & SizedOrder & AutomatedOrder)
)

export interface CreatedOrder extends Order {
  commission: Decimal,
  quantity: Decimal,
  price: Decimal,
  timestamp: number
}

export interface ExecutedOrder extends CreatedOrder {
  id: string
}

export type Strategy = (context: Context, action: StreamAction) => void
