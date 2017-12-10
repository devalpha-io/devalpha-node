---
title: Broker
next: concepts/strategy
---

# Broker

The Broker middleware will build orders upon request, and asynchronously execute them **in a later cycle**. There are two kinds of Broker middleware: one for backtesting and one for realtime trading.

## Backtesting Broker

The Backtesting Broker middleware will dispatch both `ORDER_PLACED` and `ORDER_FILLED` events synchronously (see [API Reference](/vester/prologue/api) for a full list of events).

It is important to note that in a backtesting environment, if your strategy wants to place multiple orders upon receiving a single event, we want to both place and fill these orders **before** next event is dispatched.

The commission calculations can be customized by defining the `backtest.commission` in your configuration.

```javascript
run({
  ...,
  backtest: {
    commission: (order) => {...}
  },
  ...
})
```

Setting the `backtest.commission` property to a number is also perfectly fine.

## Realtime Broker

In contrast to the backtest broker middleware, the Realtime Broker middleware will dispatch `ORDER_PLACED` and `ORDER_FILLED` events asynchronously. This allows the system to continue working on new events while waiting for responses from the brokerage. It takes a `createClient` function as an argument (see below for how to specify this in your configuration) which makes developing your own custom broker clients a breeze.

Vester thinks of the broker client as a black box, and so it only requires you to tell when an order has been filled. The rest is completely up to you.

```javascript
run({
  ...,
  client: ({ onFill }) => ({
    executeOrder: async (order) => {...},
    cancelOrder: async ({ id }) => {...},
    getMarketPrice: async (identifier) => {...},
    calculateCommission: (order) => {...}
  }),
  ...
})
```
