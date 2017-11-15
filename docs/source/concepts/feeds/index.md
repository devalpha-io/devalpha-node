---
title: Feeds
next: concepts/buffer
---

# Feeds

## First Things First

One of the most fundamental concepts in Vester is that all strategies are simple functions that
react to events. The events come from Feeds, which are supplied by the user of the framework (you).

A Feed can be just about any kind of iterable sequence, such as Array, Stream, Generator, Promise, EventEmitter, Iterator, Iterable, and so on. Check <a href="http://highlandjs.org/#_(source)" target="_blank">this page</a> for a full reference. 

Vester also supports reading data directly from a CSV-file. If you supply the full path to the file, Vester will then parse each row into an event with the payload being and object with the following properties: `timestamp`, `open`, `high`, `low` and `close`.

Below are some examples of valid feeds:

```javascript
run({
  feeds: {
    sentimentData: [0.55, 0.6, ...],      /* Array */
    someCSV: 'data/MSFT.csv',             /* CSV-file */
    myPromise: request('https://...')     /* Promise */
    dataStream: fs.createReadStream(...), /* Stream */
    ...
  },
  ...
})
```

## Sorted Feeds

Sometimes you might want to backtest using multiple feeds, and if so then you of course want the events to be dispatched in the same order as they would in real-time. As long as the payload of each event contains a `timestamp` property, Vester will do this sorting for you.
