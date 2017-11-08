--- 
title: API 
--- 

## applyMiddlewareBuffered

Creates a store enhancer that applies middleware to the dispatch method
of the Redux store, and buffers actions until all middlewares are finished processing
the action. This should be the first store enhancer in the composition chain.

**Parameters**

-   `buffer`   (optional, default `[]`)
-   `middlewares` **...[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** The chain of middlewares to be applied. (optional, default `[]`)

Returns **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** A store enhancer applying the middleware.

## index

The entry point to the whole system.

**Parameters**

-   `config` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The Vester configuration. (optional, default `{}`)

## createBrokerBacktest

Creates a broker middleware to be used when running backtests.
In contrast to the realtime broker middleware, this middleware both places and fills an order
in one cycle. This makes it possible to simulate what would happen if we always were able to
perform our transactions at the historical date and time.

**Parameters**

-   `commission` **([number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) \| [function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function))** Calculate the commission based on price and quantity (optional, default `0`)

Returns **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** Middleware

## createBrokerRealtime

Creates a broker middleware to be used running backtests.
In contrast to the backtest broker middleware, this middleware builds an order, then dispatches
the built order for the next round-trip. When the built order arrives back at this middleware,
it is executed synchronously.

**Parameters**

-   `createClient` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** Factory function for building the client to be used when sending
                                    requests to an _actual_ broker.

Returns **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** Middleware

## createRiskManager

The risk manager middleware has the capability to alter orders or even prevent them from being
requested in the first place. It should also warn the user when some risk metric is out of bounds.

**Parameters**

-   `settings` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A settings object.
-   `getMetrics`  

Returns **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** Middleware
