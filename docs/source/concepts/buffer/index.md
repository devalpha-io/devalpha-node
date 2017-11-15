---
title: Buffer
next: concepts/middleware
---

# Buffer

In order to allow asynchronous operations in the strategy, there must be a place to store events until the strategy is ready to take on new ones. This is exactly what the Buffer is for. It is very unlikely that you would ever have to get in contact with the Buffer. However, it might be interesting to get an idea of how it works, and what makes it so speedy.

## The Disruptor Pattern

At its core, the Buffer is simply a circular array, where each entry in the array corresponds to an event. The Buffer also has a collection of _producers_ and _consumers_ which, respectively, write and read into the Buffer. Here's what [Martin Fowler](https://martinfowler.com/articles/lmax.html#InputAndOutputDisruptors) has to say about this design pattern:

> Each producer and consumer has a sequence counter to indicate which slot in the buffer it's currently working on. Each producer/consumer writes its own sequence counter but can read the others' sequence counters. This way the producer can read the consumers' counters to ensure the slot it wants to write in is available without any locks on the counters. Similarly a consumer can ensure it only processes messages once another consumer is done with it by watching the counters.
