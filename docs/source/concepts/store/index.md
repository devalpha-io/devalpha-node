---
title: Store
next: concepts/strategy/
---

# Store

The Store module holds the current state of the portfolio, as well as pending orders. The underlying implementation is an [Immutable Redux Store](https://redux.js.org/docs/recipes/UsingImmutableJS.html), but you'll have access to it as a regular javascript object using through the `state()` function in your strategy.

It consists of four reducers: `capital`, `positions`, `orders` and `timestamp`.
