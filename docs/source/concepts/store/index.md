---
title: Store
next: concepts/strategy/
---

# Store

The Store module holds the current state of the portfolio, as well as pending orders. The underlying implementation is an [Immutable.JS Redux Store](https://redux.js.org/docs/recipes/UsingImmutableJS.html), but you can think of it as a regular javascript object.

It consists of three reducers: `capitalReducer`, `positionsReducer` and `ordersReducer`. The first two are respectively keeping track of capital and positions, while the latter keeps track of orders.
