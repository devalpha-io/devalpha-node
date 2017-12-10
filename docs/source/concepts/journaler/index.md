---
title: Journaler
next: concepts/guard
---

# Journaler

The Journaler middleware writes the state after each event to a persistent storage. This makes it possible to hydrate the state after a crash or shutdown.

By default the journal file is stored as `journal.json` in the working directory, but you can change this by setting the `journal` property in your configuration.

```javascript
run({
  ...,
  journal: '/var/log/journal.json',
  ...
})
```

## Backtesting

This middleware is not active when backtesting, since rehydrating the store between backtests is pointless.
