---
title: About
next: prologue/api
date: 2017-11-14 11:13:21
---

# About

Vester is primarily intended for people who aren't professional mathematicians or researchers, but still want to put their programming skills to good use. I personally believe that there are a ton of good, intuitive and simple strategies which aren't available to hedge funds or high-frequency traders for whatever reasons, and hopefully Vester can aid you in finding those strategies.

We can visualize Vester as a vintage [reel-to-reel tape recorder](https://www.google.com/search?tbm=isch&ei=1N8rWuuJItH7kwWy0oPADw&btnG=S%C3%B6k&q=reel+to+reel+tape+recorder). The left reel contains events, the recorder is our strategy, and the right reel contains all of the trading orders that our strategy comes up with. Below we'll see how Vester can help us in implementing these trading strategies.

## Architecture

### Buffer

In order to allow asynchronous operations in the strategy, there must be a place to store events until the strategy is ready to take on new ones. This is exactly what the Buffer is for. It is very unlikely that you would ever have to get in contact with the Buffer. However, it might be interesting to get an idea of how it works, and what makes it so speedy.

At its core, the Buffer is simply a circular array, where each entry in the array corresponds to an event. The Buffer also has a collection of _producers_ and _consumers_ which, respectively, write and read into the Buffer. Here's what [Martin Fowler](https://martinfowler.com/articles/lmax.html#InputAndOutputDisruptors) has to say about this design pattern:

> Each producer and consumer has a sequence counter to indicate which slot in the buffer it's currently working on. Each producer/consumer writes its own sequence counter but can read the others' sequence counters. This way the producer can read the consumers' counters to ensure the slot it wants to write in is available without any locks on the counters. Similarly a consumer can ensure it only processes messages once another consumer is done with it by watching the counters.

### Middlewares

### Strategy

## Store

The Store module holds the current state of the portfolio, as well as pending orders. The underlying implementation is an [Immutable Redux Store](https://redux.js.org/docs/recipes/UsingImmutableJS.html), but you'll have access to it as a regular javascript object using through the `state()` function in your strategy.

It consists of four reducers: `capital`, `positions`, `orders` and `timestamp`.
