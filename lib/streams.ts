import {
  StreamAction,
  Feeds,
  FeedItem
} from './typings'

import * as _ from 'highland'
import { FastPriorityQueue } from 'fastpriorityqueue.ts'

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

export function createRealtimeStream(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
  const streams: Feeds<Highland.Stream<FeedItem>> = createStreams(feeds)
  return _(Object.keys(streams)
    .map(key => streams[key].map((item: FeedItem) => ({
      type: key,
      payload: item
    })))).merge()
}

export function createBacktestStream(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction> {
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
