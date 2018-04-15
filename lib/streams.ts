import {
  StreamAction,
  Feeds,
  FeedItem
} from './typings'

import * as _ from 'highland'
import { FastPriorityQueue } from 'fastpriorityqueue.ts'

/**
 * The createStreams function creates Highland Streams from other objects such as Arrays and Promises.
 *
 * @private
 * @param {Feeds<FeedItem>} feeds A Feeds object mapping names to stream-like objects.
 * @return {Feeds<FeedItem>} A Feeds object mapping names to actual streams.
 */
function createStreams<FeedItem>(feeds: Feeds<FeedItem>): Feeds<FeedItem> {
  const streams: Feeds<FeedItem> = {}
  Object.keys(feeds).forEach(key => {
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
 * The createStreamRealtime function simply merges all of the streams together, pushing values as
 * they are received.
 *
 * @private
 * @param  {Feeds<FeedItem>}               feeds A Feeds object containing multiple streams.
 * @return {Highland.Stream<StreamAction>}       A single Highland Stream made from merged streams.
 */
export function createStreamRealtime(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
  const streams: Feeds<Highland.Stream<FeedItem>> = createStreams(feeds)
  return _(Object.keys(streams)
    .map(key => streams[key].map((item: FeedItem) => ({
      type: key,
      payload: item
    })))).merge()
}

/**
 * The createStreamBacktest function is a little more advanced than its sibling createStreamRealtime.
 * This function pulls one item at a time from all of the streams and places each item in a heap.
 * Then it compares items and pushes the one with the smallest timestamp. It then pulls a new item
 * and does the same thing again.
 *
 * Also, this function does not push new values unless the internal queue is empty. This makes sense
 * since we will only be using this stream while backtesting. Clearly it might be the case that we
 * perfor multiple actions for each incoming item, and so we wouldn't want to receive feed data for 
 * the next day before we have processed all events for the current day.
 *
 * @private
 * @param  {Feeds<FeedItem>}               feeds A Feeds object containing multiple streams.
 * @return {Highland.Stream<StreamAction>}       A single Highland Stream made from sorted streams.
 */
export function createStreamBacktest(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
  const streams: Feeds<Highland.Stream<FeedItem>> = createStreams(feeds)
  // eslint-disable-next-line no-unused-vars
  const heap = new FastPriorityQueue<StreamAction>((t1, t2) => {
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
  })

  Object.keys(streams).forEach((type) => {
    const stream = streams[type]
    stream.pull((err: Error, item: FeedItem | Highland.Nil) => {
      if (!err && (item !== _.nil)) {
        heap.add({
          type: type,
          payload: (<FeedItem>item)
        }, (<FeedItem>item).timestamp)
      }
    })
  })

  return _(function(push, next) {
    // @ts-ignore TS2683 This implicitly any
    if (this._outgoing.length > 0) {
      next()
    } else if (!heap.isEmpty()) {
      const polled = heap.poll()
      const streamItem = polled.object

      push(null, streamItem)

      streams[streamItem.type].pull((err: Error, nextItem: FeedItem | Highland.Nil) => {
        if (!err && (nextItem !== _.nil)) {
          heap.add({
            type: streamItem.type,
            payload: (<FeedItem>nextItem)
          }, (<FeedItem>nextItem).timestamp)
        }
        next()
      })
    } else {
      push(null, _.nil)
    }
  })
}
