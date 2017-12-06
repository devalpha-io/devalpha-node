# ![Vester](https://fhqvst.github.io/vester/images/vester-splash.svg)

<p align="center">
  <img src="https://img.shields.io/travis/fhqvst/vester.svg">
  <img src="https://img.shields.io/david/fhqvst/vester.svg">
  <img src="https://img.shields.io/npm/v/vester.svg">
</p>

<p align="center">
  Vester is a high-level Node.js framework for creating and running your own algorithmic trading systems.
</p>
<p align="center">
  It is inspired by the <a href="https://martinfowler.com/articles/lmax.html">LMAX architecture</a> and built using <a href="http://redux.js.org">Redux</a> and some custom middleware.
</p>

## Features
- [x] Event sourced
- [x] Less than 900k bundle size
- [x] Backtesting metrics
- [x] Multiple order types*
- [x] Slack notifications
- [ ] Scheduling

\*Supported in live-trading.

## Installation
Coming soon.

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
