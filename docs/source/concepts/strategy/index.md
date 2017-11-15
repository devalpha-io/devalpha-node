---
title: Strategy
---

# Strategy

As described in the [Feed chapter](/vester/concepts/feeds), strategies are simple functions that
react to events. the Strategy function is called with two arguments: `context` and `event`.

## Context

### State

The current state of your portfolio can be accessed at `context.state`.

### Metrics

Your portfolio risk metrics can be found at `context.metrics`.

### Order and Cancel

Call `order` to place and order, or `cancel` to cancel an order. The `order` function expects an object containing an `identifier`, a `quantity` and (optionally) a `price`. The `cancel` function expects a string denoting the ID of the order which to cancel.

## Event

The event object consists of two properties: `type` and `payload`. See [API References](/vester/prologue/api) for a full list of event types.
