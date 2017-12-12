# ![Vester](https://fhqvst.github.io/vester/images/vester-splash.svg)

<p align="center">
  <a href="https://travis-ci.org/fhqvst/vester"><img src="https://img.shields.io/travis/fhqvst/vester.svg"></a>
  <a href="https://david-dm.org/fhqvst/vester"><img src="https://img.shields.io/david/fhqvst/vester.svg"></a>
  <a href="https://www.npmjs.com/package/vester"><img src="https://img.shields.io/npm/v/vester.svg"></a>
</p>

## About
Vester is a high-level Node.js framework for creating and running your own algorithmic trading systems. 

It is primarily intended for people who aren't professional mathematicians or researchers, but still want to put their programming skills to good use. I personally believe that there are a ton of good, intuitive and simple strategies which aren't available to hedge funds or high-frequency traders for whatever reasons, and hopefully Vester can aid you in finding those strategies.

The framework is inspired by the <a href="https://martinfowler.com/articles/lmax.html">LMAX architecture</a> and built using <a href="http://redux.js.org">Redux</a> and some custom middleware.

## Features
- [x] Event sourced
- [x] Less than 900k bundle size
- [x] Backtesting metrics
- [x] Functional architecture
- [x] Slack notifications
- [ ] Scheduling

## Installation
Install using NPM:

`npm install vester`

## Documentation
[Website](https://fhqvst.github.io/vester/)

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

## Resources
- [Backtrader](https://www.backtrader.com/)
- [PyBacktest](https://github.com/ematvey/pybacktest)
- [Quandl](https://www.quandl.com/)
- [QuantConnect](https://www.quantconnect.com/)
- [Quantopian](http://quantopian.com/)
- [Quantstart](https://www.quantstart.com/)
- [Zipline](http://www.zipline.io/)

## License

GNU GPL license. See the LICENSE.md file for details.

## Responsibilities

The author of this software is not responsible for any indirect damages (foreseeable or unforeseeable), such as, if necessary, loss or alteration of or fraudulent access to data, accidental transmission of viruses or of any other harmful element, loss of profits or opportunities, the cost of replacement goods and services or the attitude and behavior of a third party.
