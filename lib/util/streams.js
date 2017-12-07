import _ from 'highland'
import Heap from 'fastpriorityqueue'

function createStreams(feeds) {
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
    // eslint-disable-next-line no-unused-vars
    const heap = new Heap(([k1, v1], [k2, v2]) => {
      if (typeof v2.timestamp === 'undefined') {
        if (typeof v1.timestamp === 'undefined') {
          return false
        }
        return true
      }

      if (typeof v1.timestamp === 'undefined') {
        return false
      }

      return v1.timestamp < v2.timestamp
    })

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
