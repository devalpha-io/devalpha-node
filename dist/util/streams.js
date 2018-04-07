"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var highland_1 = require("highland");
var fastpriorityqueue_1 = require("fastpriorityqueue");
function createStreams(feeds) {
    var streams = {};
    Object.keys(feeds).forEach(function (key) {
        var feed = feeds[key];
        if (!highland_1.default.isStream(feed)) {
            streams[key] = highland_1.default(feed);
        }
        else {
            streams[key] = feed;
        }
    });
    return streams;
}
function createMergedStream(feeds) {
    var streams = createStreams(feeds);
    return highland_1.default.merge(Object.keys(streams)
        .map(function (key) { return streams[key].map(function (item) { return ({
        type: key,
        payload: item
    }); }); }));
}
exports.createMergedStream = createMergedStream;
function createSortedStream(feeds) {
    var streams = createStreams(feeds);
    // eslint-disable-next-line no-unused-vars
    var heap = new fastpriorityqueue_1.default(function (_a, _b) {
        var k1 = _a[0], v1 = _a[1];
        var k2 = _b[0], v2 = _b[1];
        if (typeof v2.timestamp === 'undefined') {
            if (typeof v1.timestamp === 'undefined') {
                return false;
            }
            return true;
        }
        if (typeof v1.timestamp === 'undefined') {
            return false;
        }
        return v1.timestamp < v2.timestamp;
    });
    Object.keys(streams).forEach(function (key) {
        var stream = streams[key];
        stream.pull(function (err, item) {
            if (!err && item !== highland_1.default.nil) {
                heap.add([key, item]);
            }
        });
    });
    return highland_1.default(function (push, next) {
        if (this._outgoing.length > 0) {
            next();
        }
        else if (!heap.isEmpty()) {
            var _a = heap.poll(), key_1 = _a[0], item = _a[1];
            push(null, { type: key_1, payload: item });
            streams[key_1].pull(function (err, nextItem) {
                if (!err && nextItem !== highland_1.default.nil) {
                    heap.add([key_1, nextItem]);
                }
                next();
            });
        }
        else {
            push(null, highland_1.default.nil);
        }
    });
}
exports.createSortedStream = createSortedStream;
