---
title: Quickstart
date: 2017-11-14 11:13:21
---

# Quickstart

We can visualize Vester as a vintage [reel-to-reel tape recorder](https://www.google.com/search?tbm=isch&ei=1N8rWuuJItH7kwWy0oPADw&btnG=S%C3%B6k&q=reel+to+reel+tape+recorder). The left reel contains events, the recorder is our strategy, and the right reel contains all of the trading orders that our strategy comes up with. Below we'll see how Vester can help us in implementing these trading strategies.

## Setup

If Vester is not yet installed, we should start off by doing that.

```javascript
npm install vester
```

Now, create a new file called `index.js`, and open up any editor of choice to start exploring Vester.

## Hello World

Now, let's assume we have gotten our hands on some magic sequence of numbers which potentially contains information on how to buy and sell Microsoft shares ([MSFT](https://finance.google.com/finance?q=NASDAQ:MSFT)) for maximum profit.

```javascript
const numbers = [1, 3, 2, 5, 6, 3]
```

More specifically we're suspecting that **if a number is larger than the previous number**, then the price has an upwards momentum, and the price is likely to increase in the near future. We're also suspecting the reverse: **if a number is not larger than the previous number**, then the price of the stock is probably to be trending downwards very soon.

Having a somewhat concrete idea of what we want to do, we start implementing our strategy.

```javascript
/* most recent number */
let previous = null

/* have we bought the stock? */
let entered = false

function momentumStrategy(context, event) {
  if (event.payload > previous) {
    if (!entered) {
      context.order({
        identifier: 'MSFT',
        quantity: 100
      })
    }
  } else {
    if (entered) {
      context.order({
        identifier: 'MSFT',
        quantity: -100
      })
    }
  }
}
```
