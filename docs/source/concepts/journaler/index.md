---
title: Journaler
next: concepts/guard
---

# Journaler

The Journaler middleware writes the state after each event to a persistent storage. This makes it possible to hydrate the state after a crash or shutdown.

<div class="tile tile-centered tile-note tile-outside">
  <div class="tile-icon">
    <i class="icon icon-alert-triangle"></i>
  </div>
  <div class="tile-content">
    <p class="tile-subtitle">This module is **not active** when backtesting, since rehydrating the store between backtests is pointless.</p>
  </div>
</div>

By default the journal file is stored as `journal.json` in the working directory, but you can change this by setting the `journal` property in your configuration.

```javascript
run({
  ...,
  journal: '/var/log/journal.json',
  ...
})
```
