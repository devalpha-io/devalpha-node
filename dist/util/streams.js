"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("highland");
const fastpriorityqueue_ts_1 = require("fastpriorityqueue.ts");
function createStreams(feeds) {
    const streams = {};
    Object.keys(feeds).forEach(key => {
        const feed = feeds[key];
        if (feed) {
            streams[key] = feed;
        }
        else {
            streams[key] = _(feed);
        }
    });
    return streams;
}
function createMergedStream(feeds) {
    const streams = createStreams(feeds);
    return _(Object.keys(streams)
        .map(key => streams[key].map((item) => ({
        type: key,
        payload: item
    })))).merge();
}
exports.createMergedStream = createMergedStream;
function createSortedStream(feeds) {
    const streams = createStreams(feeds);
    // eslint-disable-next-line no-unused-vars
    const heap = new fastpriorityqueue_ts_1.FastPriorityQueue((t1, t2) => {
        if (typeof t1 === 'undefined') {
            if (typeof t2 === 'undefined') {
                return false;
            }
            return true;
        }
        if (typeof t1 === 'undefined') {
            return false;
        }
        return t1 < t2;
    });
    Object.keys(streams).forEach((type) => {
        const stream = streams[type];
        stream.pull((err, item) => {
            if (!err && item) {
                heap.add({
                    type: type,
                    payload: item
                }, item.timestamp);
            }
        });
    });
    return _(function (push, next) {
        if (this._outgoing.length > 0) {
            next();
        }
        else if (!heap.isEmpty()) {
            const streamItem = heap.poll().object;
            push(null, streamItem);
            streams[streamItem.type].pull((err, nextItem) => {
                if (!err && nextItem) {
                    heap.add({
                        type: streamItem.type,
                        payload: nextItem
                    }, nextItem.timestamp);
                }
                next();
            });
        }
        else {
            push(null, _.nil);
        }
    });
}
exports.createSortedStream = createSortedStream;
