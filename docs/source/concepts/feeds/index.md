---
title: Feeds
next: concepts/notifier
---

# Feeds

One of the most fundamental concepts in Vester is that all strategies are simple functions that
react to events. The events come from Feeds, which are supplied by the user of the framework (you).

<div class="tile tile-centered tile-note tile-outside">
  <div class="tile-icon">
    <i class="icon icon-alert-triangle"></i>
  </div>
  <div class="tile-content">
    <p class="tile-subtitle">All events **must contain a timestamp property** containing a valid unix timestamp in milliseconds. If the timestamp property is missing, Vester will skip processing that event.</p>
  </div>
</div>

A Feed can be just about any kind of iterable sequence, such as Array, Stream, Generator, Promise, EventEmitter, Iterator, Iterable, and so on. Check <a href="http://highlandjs.org/#_(source)" target="_blank">this page</a> for a full reference. 

Below are some examples of valid feeds:

```javascript
run({
  feeds: {

    /* promise */
    myPromise: request('https://...'),

    /* stream */
    dataStream: fs.createReadStream(...),

    /* array */
    sentimentData: [
      {
        sentiment: 0.55,
        timestamp: 9466848000000
      },
      {
        sentiment: 0.6,
        timestamp: 9467712000000
      },
    ]
    ...
  },
  ...
})
```

## Sorted Feeds

Sometimes you might want to backtest using multiple feeds, and if so then you of course want the events to be dispatched in the same order as they would in real-time. As long as the payload of each event contains a `timestamp` property, Vester will do this sorting for you.
