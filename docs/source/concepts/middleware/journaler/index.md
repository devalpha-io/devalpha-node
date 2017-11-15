---
title: Journaler
next: concepts/middleware/risk-manager
---

# Journaler

The Journaler middleware writes each event to a persistent storage. This makes it possible to simply replay all events so to end up in the same state as it was just before the crash.

By default the journal file is stored as `journal.json` in the working directory, but you can change this by setting the `journal` property in your configuration.

```javascript
run({
  ...,
  journal: '/var/log/journal.json',
  ...
})
```
