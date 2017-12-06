import _ from 'highland'
import Heap from 'fastpriorityqueue'

export function createStreams(feeds) {
  const streams = {}
  Object.keys(feeds).forEach(key => {
    const feed = feeds[key]
    if (!_.isStream(feed)) {
      streams[key] = _(feed)
    } else {
      streams[key] = feed
    }
  })
  return streams
}

export function createMergedStream(feeds) {
  const streams = createStreams(feeds)
  return _.merge(Object.keys(streams)
    .map(key => streams[key].map(item => ({
      type: key,
      payload: item
    }))))
}

export function createSortedStream(feeds) {
  const streams = createStreams(feeds)
  return _((push, next) => {
    const heap = new Heap((a, b) => !a.timestamp || a.timestamp > b.timestamp)

    Object.keys(streams).forEach((key) => {
      const stream = streams[key]
      stream.pull((err, item) => {
        if (!err && item !== _.nil) {
          heap.add([key, item])
        }
      })
    })

    while (!heap.isEmpty()) {
      const [key, item] = heap.poll()
      push(null, { type: key, payload: item })
      streams[key].pull((err, nextItem) => {
        if (!err && nextItem !== _.nil) {
          heap.add([key, nextItem])
        }
      })
      next()
    }

    push(null, _.nil)
  })
}
