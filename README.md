# Vester

Vester is a high-level Node.js framework for creating and running your own algorithmic trading systems.

It is inspired by the [LMAX architecture](https://martinfowler.com/articles/lmax.html) and built using [Redux](http://redux.js.org/) and a bunch of custom middleware.

## Features
- [x] Event driven
- [x] Less than 900k file size
- [x] Backtesting metrics
- [x] Multiple order types*
- [x] Slack notifications
- [x] Built-in CSV parsing
- [ ] Scheduling

\*Supported in live-trading.

## Installation

Install via [npm](https://www.npmjs.com/package/vester)

```bash
$ npm install vester
```
or
```bash
$ yarn add vester
```

## Get Started

Creating your own algorithm is easy as pie. Hook up any source of data you like and start trading in seconds.

```javascript
import { run } from 'vester'

const strategy = (context) => {
  context.order({
    symbol: 'GOOG',
    quantity: 30,
    price: 875.6
  })
}

// Make money!
run({ strategy })
```

## License

MIT license. See the LICENSE file for details.

## Responsibilities

The author of this software is not responsible for any indirect damages (foreseeable or unforeseeable), such as, if necessary, loss or alteration of or fraudulent access to data, accidental transmission of viruses or of any other harmful element, loss of profits or opportunities, the cost of replacement goods and services or the attitude and behavior of a third party.
