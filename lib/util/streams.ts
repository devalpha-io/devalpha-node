import {
  StreamAction,
  Feeds,
  FeedItem
} from './types'

import * as _ from 'highland'
import { FastPriorityQueue } from 'fastpriorityqueue.ts'

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
 * @param  {Feeds<FeedItem>}               feeds A Feeds object containing multiple streams.
 * @return {Highland.Stream<StreamAction>}       A single Highland Stream made from merged streams.
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
export function createStreamSorted(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
  const streams: Feeds<FeedItem> = createStreams(feeds)
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

  const sortedStreams: Highland.Stream<StreamAction>[] = []
  const callbacks: any = {}
  
  let initialized = 0

  Object.keys(streams).forEach((type) => {
    const stream = streams[type]
    sortedStreams.push(stream.consume((err: Error, item: FeedItem | Highland.Nil, push: Function, next: Function) => {
      callbacks[type] = () => {
        callbacks[type] = undefined
        next()
      }
      if (err) {
        push(err)
      } else if (item === _.nil) {
        if (!heap.isEmpty()) {
          const streamItem = heap.poll().object
          if (callbacks[streamItem.type]) {
            callbacks[streamItem.type]()
          }
          push(null, streamItem)
        }
        push(null, _.nil)
      } else {
        push(null, {
          type,
          payload: item
        })
      }
    }))
  })

  const streamCount = sortedStreams.length
  // @ts-ignore
  return _.merge(sortedStreams).consume((err: Error, action: StreamAction | Highland.Nil, push: Function, next: Function) => {
    if (err) {
      push(err)
      next()
    } else if (action === _.nil) {
      while (!heap.isEmpty()) {
        const streamItem = heap.poll().object
        push(null, streamItem)
      }
      push(null, _.nil)
    } else {
      initialized += 1
      // @ts-ignore
      heap.add(action, action.payload.timestamp)
      if (initialized >= streamCount) {
        if (!heap.isEmpty()) {
          const streamItem = heap.poll().object
          if (callbacks[streamItem.type]) {
            callbacks[streamItem.type]()
          }
          push(null, streamItem)
        } else {
          push(null, _.nil)
        }
      }
      next()
    }
  })
}
