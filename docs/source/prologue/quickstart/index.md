---
title: Quickstart
next: prologue/about
date: 2017-11-14 11:13:21
---

# Quickstart

## Setup

If Vester is not yet installed, we should start off by doing that.

```javascript
npm install vester
```

Next, create a file named `index.js` and start editing. At the top of the file we import the `run` function from Vester, like so:

```javascript
import run from 'vester'
```

## Getting Started

Just as we're about to quit our year-long scavenge for the ultimate trading strategy, one member of the team finds an old dusty PDF written in a language we cannot fully understand.

According to the author, the document contains clear instructions on how to buy and sell Microsoft shares ([MSFT](https://finance.google.com/finance?q=NASDAQ:MSFT)) for guaranteed profits.

Auspiciously, we're very good friends with a translator who interprets the formula for us, and so we instantly get on [Google Finance](https://finance.google.com/finance?q=NASDAQ:MSFT) to collect the prices and timestamps for the last few days.

```javascript
const prices = [
  { timestamp: 946684800, price: 10 },
  { timestamp: 946771200, price: 9 },
  { timestamp: 946857600, price: 10 },
  { timestamp: 946944000, price: 8 },
  { timestamp: 947030400, price: 7 },
  { timestamp: 947116800, price: 10 },
  { timestamp: 947203200, price: 9 },
]
```

Our translator friend explains that **if a price is higher than the previous price**, then the stock has an upwards momentum, and we can expect further increases in the near future. It also describes the reverse: **if a price is not higher than the previous price**, then the stock is probably to be trending downwards very soon.

We now have a somewhat concrete idea of how the strategy might look, and it's about time we got our hands dirty. Below is the implemented strategy.

```javascript
/* previous price */
let previous = Infinity

/* have we bought the stock? */
let entered = false

function magicFormula(context, event) {
  switch (event.type) {

    case 'prices':
      const current = event.payload.price
      if (current > previous && !entered) {
        /* upwards momentum: buy! */
        context.order({
          identifier: 'MSFT',
          quantity: 100,
          price: current
        })
        entered = true
      } else if (current <= previous && entered) {
        /* downwards momentum: sell! */
        context.order({
          identifier: 'MSFT',
          quantity: -100,
          price: current
        })
        entered = false
      }
      previous = current
      break

    case 'finished':
      console.log(context.metrics())
      break
  }
}
```

Having implemented the strategy, we call the `run` function, supplying it with the price data and the magic formula.
We also set a starting capital for the algorithm to use.

```javascript
run({
  feeds: { prices },
  strategy: magicFormula,
  startCapital: 10000
})
```

## Re-evaluating the formula

Running the code above produces the following output:

```javascript
{
  alpha: 0,
  beta: 0,
  calmar: 0,
  drawdown: 0.01,
  kurtosis: 0,
  omega: 0,
  returns: -0.01,
  sharpe: -0.37796447300922725,
  skew: 0,
  sortino: 0,
  stability: 0,
  tail: 0,
  volatility: 0
}
```

A whole bunch of words and a whole bunch of numbers. Though, initially the only thing we really care about is the `returns` key. The number at that key denotes our profit in percents.

Unfortunately our magic formula wasn't as magic as we initially might have thought. We actually lost money using it, and would be better off if we had just kept our money safe under a mattress.

**Now, do not throw the code into the bin just yet!**

Our translator friend had apparently made a mistake, we got it all backwards! The actual formula is defined as such: **if a price is lower than the previous price**, then the stock will bounce back up. Furthermore, **if a price is not lower than the previous price**, the stock is in for a movement south.

We swiftly run back to the keyboard to rewrite the buying and selling criterions.

```javascript
if (current < previous && !entered) {
  /* send buy order */
} else if (current >= previous && entered) {
  /* send sell order */
}
```

Running a new backtest with our updated criterions results in the following metrics:

```javascript
{
  alpha: 0,
  beta: 0,
  calmar: 0,
  drawdown: 0,
  kurtosis: 0,
  omega: 0,
  returns: 0.2,
  sharpe: 0.37796447300922725,
  skew: 0,
  sortino: 0,
  stability: 0,
  tail: 0,
  volatility: 0
}
```

The odl dusty PDF was right! We've now built a wealth machine with merely 90 lines of code. Running the strategy for merely a week brought us a 20% gain – neat!

## Conclusion

While finding magic trading formulas on the corners of the internet might seem unlikely, this simple process, from initial idea to metrics, is actually a great way to get started with algorithmic trading. A lot of trading ideas are really simple and intuitive like this.

Now, get out there and make some money!
