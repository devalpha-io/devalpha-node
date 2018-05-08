import {
  StreamAction,
  Feeds,
  FeedItem
} from '../types'

import * as _ from 'highland'

/**
 * The createStreams function creates Highland Streams from other objects such as Arrays and Promises.
 *
 * @private
 * @param {Feeds<FeedItem>} feeds A Feeds object mapping names to stream-like objects.
 * @return {Feeds<FeedItem>} A Feeds object mapping names to actual streams.
 */
function createStreams(feeds: any): Feeds<FeedItem> {
  const streams: Feeds<FeedItem> = {}
  Object.keys(feeds).forEach((key) => {
    const feed = feeds[key]
    if (_.isStream(feed)) {
      streams[key] = <Highland.Stream<FeedItem>> feed
    } else {
      streams[key] = _(feed)
    }
  })
  return streams
}

/**
 * The createStreamMerged function simply merges all of the streams together, pushing values as
 * they are received.
 *
 * @private
 * @param  {Feeds<FeedItem>} feeds A Feeds object containing multiple streams.
 * @return {Highland.Stream<StreamAction>} A single Highland Stream made from merged streams.
 */
export function createStreamMerged(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
  const streams: Feeds<FeedItem> = createStreams(feeds)
  return _(Object.keys(streams)
    .map(key => streams[key].map((item: FeedItem) => ({
      type: key,
      payload: item
    })))).merge()
}

/**
 * The createStreamSorted function is a little more advanced than its sibling createStreamMerged.
 * This function pulls one item at a time from all of the streams and places each item in a Map.
 * Then it compares items and pushes the one with the smallest timestamp. Finally, it pulls a new item
 * and repats it all over again.
 *
 * @private
 * @param  {Feeds<FeedItem>}               feeds A Feeds object containing multiple streams.
 * @return {Highland.Stream<StreamAction>}       A single Highland Stream made from sorted streams.
 */
export function createStreamSorted(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
  const buffer = new Map()
  const streams: Feeds<FeedItem> = createStreams(feeds)
  const pred = (x1: any, x2: any) => {
    const t1 = x1.payload && x1.payload.timestamp
    const t2 = x2.payload && x2.payload.timestamp

    if (typeof t1 === 'undefined' && typeof t2 === 'undefined') {
      return false
    }
    if (typeof t2 === 'undefined') {
      return true
    }
    if (typeof t1 === 'undefined') {
      return false
    }
    return t1 < t2
  }

  // Highland typings does not like streams of streams, so we solve it using "as any"
  const sources: Highland.Stream<Highland.Stream<StreamAction>> = _(Object.keys(streams)
    .map(key => streams[key].map<StreamAction>((item: FeedItem) => ({
      type: key,
      payload: item
    })))) as any

  return sources.collect().flatMap((srcs: Highland.Stream<StreamAction>[]) => {
    const nextValue = (src: Highland.Stream<StreamAction>, push: Function, next: Function) => {
      src.pull((err, x) => {
        if (err) {
          push(err)
          nextValue(src, push, next)
        } else if (x === _.nil as any) {
          // push last element in buffer
          if (buffer.get(src)) {
            push(null, buffer.get(src))
          }
          // must be final stream
          if (buffer.size <= 1) {
            push(null, _.nil)
          } else {
            // remove stream from map of streams and
            // from array of source streams
            buffer.delete(src)
            srcs.splice(srcs.indexOf(src), 1)
            next()
          }
        } else {
          if (buffer.size === srcs.length) {
            push(null, buffer.get(src))
          }
          // replace old buffer key/value with new one
          buffer.set(src, x)
          next()
        }
      })
    }

    if (!srcs.length) {
      return _([])
    }

    let first = true
    return _((push, next) => {
      // need to buffer first element of all streams first before beginning
      // comparisons
      if (first) {
        for (const src of srcs) {
          nextValue(src, push, next)
        }
        first = false
      }

      let srcToPull
      if (buffer.size === srcs.length) {
        for (const pair of Array.from(buffer.entries())) {
          srcToPull = srcToPull === undefined || pred(pair[1], srcToPull[1]) ? pair : srcToPull
        }
        // @ts-ignore
        nextValue(srcToPull[0], push, next)
      }
    }) as Highland.Stream<StreamAction>
  })
}
