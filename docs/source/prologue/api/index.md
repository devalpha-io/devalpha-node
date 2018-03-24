---
title: API
---

# API


### Table of Contents

-   [vester](#vester)
-   [strategy](#strategy)

## vester

The entry point to the whole system.

**Parameters**

-   `config` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** The Vester configuration. (optional, default `{}`)
    -   `config.backtesting` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 
    -   `config.capital` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 
    -   `config.slackUrl` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
    -   `config.initialStates` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `config.feeds` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `config.backtest` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
        -   `config.backtest.timestamp` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
    -   `config.commission` **([function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function) \| [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number))** 
    -   `config.guard` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
        -   `config.guard.shorting` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 
        -   `config.guard.margin` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 
        -   `config.guard.restricted` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** 
    -   `config.onError` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
import vester from 'vester'

function strategy({ order }, action) {
  order({
    identifier: 'AAPL',
    quantity: 100,
    price: 150
  })
}

vester({
  strategy,
  backtesting: false
})
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

## strategy

The strategy function is defined by the user (you), and it is called every time a new event occurs.

**Parameters**

-   `context` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `context.state` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** The state of your strategy.
    -   `context.metrics` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** Some standard metrics for your strategy. Note that calls to this
        function is very expensive, so use with caution.
    -   `context.order` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** Place an order.
    -   `context.cancel` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** Cancel an order.
