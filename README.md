# ![Vester](https://fhqvst.github.io/vester/images/vester-splash.svg)

<p align="center">
  <a href="https://travis-ci.org/fhqvst/vester"><img src="https://img.shields.io/travis/fhqvst/vester.svg"></a>
  <a href="https://david-dm.org/fhqvst/vester"><img src="https://img.shields.io/david/fhqvst/vester.svg"></a>
  <a href="https://www.npmjs.com/package/vester"><img src="https://img.shields.io/npm/v/vester.svg"></a>
</p>

## About

Vester is a Javascript framework for creating and running your own algorithmic trading systems. It is built using TypeScript, weighs in at a less than 1500 lines of code, and is speedy as hell.

The internal architecture primarily consists of one big stream and a bunch of consumers. It is implemented using the excellent [Highland](https://highlandjs.org/) streams library, and also makes use of some helper functions from [Redux](https://redux.js.org/).

## Features

-   [x] Event sourced
-   [x] Tiny footprint
-   [x] Easily extensible
-   [x] Simple API

## Installation

Install using NPM:

`npm install vester`

## Quickstart

Getting started is easy as pie. Hook up any source of data you like and start trading in seconds.

```javascript
import { vester } from 'vester'

const feeds = {
  myQuandlFeed: [1, 2, 3, 4],
  myStreamFeed: fs.createReadStream(...)
}

const strategy = (context, action) {

  // Place an order
  if (action.type === 'myQuandlFeed') {
    context.order({
      identifier: action.payload.identifier,
      quantity: 100 * action.payload.signalStrength,
      price: 1000
    })
  }

  // Get current portfolio state
  const state = context.state()

  // Cancel an order
  if (state.capital.cash < 10000) {
    context.cancel({
      id: 123
    })
  }
}

// Make money!
vester({ feeds }, strategy).done(() => {
  console.log('Finished!')
})
```

## Settings

```javascript
const settings = {
  /**
   * Toggle backtesting/realtime mode. In backtesting mode, events from the feed stream are pulled 
   * as needed rather than pushed as created. This allows you to do a number of events for each
   * feed item, and then pull the next one only when you're finished with the current.
   *
   * NOTE: Vester will only activate realtime mode when this parameter is explicitly set to 
   * `false`. This means that setting `backtesting: 0` will not do the job.
   *
   * @type {boolean}
   */
  backtesting: true,

  /**
   * Only used in realtime mode. The client manages order execution, and is provided to the 
   * internal broker middleware.
   * @type {function}
   */
  client: null,

  /**
   * Define the starting capital of your algorithm. Use only in backtesting mode. In realtime mode
   * you're better of using the `initialStates` setting instead.
   * @type {number}
   */
  startCapital: 0,
  
  /**
   * Provide initial states for your algorithm. One obvious use case would be when realtime
   * trading, and you want to fetch positions, capital, or order information from your broker.
   * @type {object}
   */
  initialStates: {},

  /**
   * An object mapping event names to stream-like objects. See https://highlandjs.org/#_(source) 
   * for a definition of "stream-like". 
   * @type {object}
   */
  feeds: {},

  /**
   * Settings for your backtest.
   * @type {object}
   */
  backtest: {
    /**
     * Denotes when your backtest is started (the first date of your backtesting data).
     * @type {number}
     */
    timestamp: 0,

    /**
     * A number or a function used when calculating expected commission.
     * @type {number | function}
     */
    commission: 0
  },

  /**
   * Settings for the guard middleware, which will prevent or alter orders (based on your configuration).
   * @type {object}
   */
  guard: {
    /**
     * Allow/disallow shorting.
     * @type {boolean}
     */
    shorting: false,
    
    /**
     * Allow/disallow trading on margin.
     * @type {boolean}
     */
    margin: false,

    /**
     * An array of restricted instrument identifiers. Example: ['GOOG', 'SPOT'].
     * @type {Array}
     */
    restricted: []
  },

  /**
   * DevAlpha dashboard settings.
   * @type {object}
   */
  dashboard: {

    /**
     * Toggle the DevAlpha dashboard.
     * @type {boolean}
     */
    active: false,

    /**
     * Port used to pipe portfolio data.
     * @type {number}
     */
    port: 4449
  }
}
```

## Usage

The `vester`-function returns an unconsumed stream, and so it is up to you to consume it (thereby running the strategy). Highland provides a number of ways of doing this ([see here](https://highlandjs.org/#Consumption)), but the easiest one is probably just to use `.resume()` like so:

```javascript
const settings = {...}
const strategy = (context, action) => {...}

vester(settings, strategy).resume()
```

However, you could also do crazy things like this:

```javascript
import { vester, ORDER_FILLED, ORDER_FAILED } from 'vester'

const settings = {...}
const strategy = (context, action) => {...}

const stream = vester(settings, strategy)

const slackStream = stream.fork()
const redisStream = stream.fork()

// Get Slack notifications on filled or failed orders
slackStream.each((event) => {
  if (event.action.type === ORDER_FILLED) {
    slackLogger.log('Hooray! An order was filled!')
  } else if (event.action.type === ORDER_FAILED) {
    slackLogger.log('Whoops! One of your orders was not executed!')
  }
})

// Place the current state in a Redis store
redisStream.each((event) => {
  redisClient.set('state', JSON.stringify(event.state))
})
```

Pretty neat, huh?

## Resources

-   [Backtrader](https://www.backtrader.com/)
-   [PyBacktest](https://github.com/ematvey/pybacktest)
-   [Quandl](https://www.quandl.com/)
-   [QuantConnect](https://www.quantconnect.com/)
-   [Quantopian](http://quantopian.com/)
-   [Quantstart](https://www.quantstart.com/)
-   [Zipline](http://www.zipline.io/)

## License

GNU GPL license. See the LICENSE.md file for details.

## Responsibilities

The author of this software is not responsible for any indirect damages (foreseeable or unforeseeable), such as, if necessary, loss or alteration of or fraudulent access to data, accidental transmission of viruses or of any other harmful element, loss of profits or opportunities, the cost of replacement goods and services or the attitude and behavior of a third party.
