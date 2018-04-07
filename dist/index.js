"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("highland");
var redux_1 = require("redux");
var redux_immutable_1 = require("redux-immutable");
var http = require("http");
var socket = require("socket.io");
// Middleware
var createBrokerRealtime_1 = require("./middleware/createBrokerRealtime");
var createBrokerBacktest_1 = require("./middleware/createBrokerBacktest");
var createGuard_1 = require("./middleware/createGuard");
var createStrategy_1 = require("./middleware/createStrategy");
// Reducers
var capitalReducer_1 = require("./reducers/capitalReducer");
var positionsReducer_1 = require("./reducers/positionsReducer");
var ordersReducer_1 = require("./reducers/ordersReducer");
var timestampReducer_1 = require("./reducers/timestampReducer");
// Other
var streams_1 = require("./util/streams");
var applyMiddlewareSeq_1 = require("./applyMiddlewareSeq");
var constants_1 = require("./constants");
__export(require("./constants"));
/**
 * The entry point to the whole system.
 *
 * @param {Object} config The Vester configuration.
 * @param {boolean} config.backtesting
 * @param {number} config.capital
 * @param {string} config.slackUrl
 * @param {Object} config.initialStates
 * @param {Object} feeds
 * @param {Object} config.backtest
 * @param {string} config.backtest.timestamp
 * @param {function|number} config.commission
 * @param {Object} config.guard
 * @param {boolean} config.guard.shorting
 * @param {boolean} config.guard.margin
 * @param {Array} config.guard.restricted
 * @param {function} strategy
 * @return {Stream}
 *
 * @example
 * import vester from 'vester'
 *
 * function strategy({ order }, action) {
 *   order({
 *     identifier: 'AAPL',
 *     quantity: 100,
 *     price: 150
 *   })
 * }
 *
 * vester({
 *   strategy,
 *   backtesting: false
 * })
 */
function vester(config, strategy) {
    if (config === void 0) { config = {}; }
    config = __assign({ backtesting: true, startCapital: 0, slackUrl: '' }, config, { initialStates: __assign({}, config.initialStates), feeds: __assign({}, config.feeds), backtest: __assign({ timestamp: 0, commission: 0 }, config.backtest), guard: __assign({ shorting: false, margin: false, restricted: [] }, config.guard), dashboard: __assign({ active: false, port: 4449 }, config.dashboard) });
    if (typeof strategy !== 'function') {
        throw new Error('Expected strategy to be a function.');
    }
    /**
     * The strategy function is defined by the user (you), and it is called every time a new event occurs.
     *
     * @type {function}
     * @param {Object} context
     * @param {function} context.state The state of your strategy.
     * @param {function} context.metrics Some standard metrics for your strategy. Note that calls to this
     * function is very expensive, so use with caution.
     * @param {function} context.order Place an order.
     * @param {function} context.cancel Cancel an order.
     */
    var strategyMiddleware = createStrategy_1.default(strategy);
    var guardMiddleware = createGuard_1.default(config.guard);
    var brokerMiddleware;
    if (config.backtesting !== false || typeof config.client === 'undefined') {
        brokerMiddleware = createBrokerBacktest_1.default(config.backtest.commission);
    }
    else {
        brokerMiddleware = createBrokerRealtime_1.default(config.client);
    }
    var reducer = redux_immutable_1.combineReducers({
        capital: capitalReducer_1.default,
        positions: positionsReducer_1.default,
        orders: ordersReducer_1.default,
        timestamp: timestampReducer_1.default
    });
    var middlewares = [guardMiddleware, brokerMiddleware, strategyMiddleware];
    var stream;
    if (config.backtesting === false) {
        stream = streams_1.createMergedStream(config.feeds);
        stream.write({
            type: constants_1.INITIALIZED,
            payload: {
                timestamp: Date.now(),
                initialStates: config.initialStates,
                startCapital: config.startCapital
            }
        });
    }
    else {
        stream = streams_1.createSortedStream(config.feeds);
        stream.write({
            type: constants_1.INITIALIZED,
            payload: {
                timestamp: config.backtest.timestamp,
                initialStates: config.initialStates,
                startCapital: config.startCapital
            }
        });
    }
    var store = redux_1.createStore(reducer, applyMiddlewareSeq_1.default(stream, middlewares));
    var consumed = stream.consume(function (err, item, push, next) {
        if (err) {
            push(err, null);
            next();
        }
        else if (item === _.nil) {
            if (config.backtesting !== false) {
                try {
                    var finished = {
                        type: constants_1.FINISHED,
                        payload: {}
                    };
                    store.dispatch(finished);
                    push(null, {
                        state: store.getState().toJS(),
                        action: finished
                    });
                }
                catch (e) {
                    push(e, null);
                }
            }
            push(null, _.nil);
        }
        else if (typeof item.payload.timestamp === 'undefined') {
            push(new Error("Skipped event from feed \"" + item.type + "\" due to missing timestamp property."), null);
            next();
        }
        else {
            try {
                store.dispatch(item);
                push(null, {
                    state: store.getState().toJS(),
                    action: item
                });
            }
            catch (e) {
                push(e, null);
            }
            next();
        }
    });
    if (config.dashboard.active) {
        var app = http.createServer(function (req, res) {
            res.writeHead(200);
            res.end();
        });
        var io_1 = socket(app);
        app.listen(config.dashboard.port);
        var socketStream_1 = consumed.fork();
        consumed = consumed.fork();
        io_1.on(constants_1.SOCKETIO_CONNECTION, function (client) {
            var tick;
            var tock;
            client.on(constants_1.SOCKETIO_BACKTESTER_RUN, function () {
                tick = Date.now();
                socketStream_1
                    .batchWithTimeOrCount(500, 1000)
                    .each(function (events) {
                    io_1.emit(constants_1.SOCKETIO_BACKTESTER_EVENTS, { events: events });
                })
                    .done(function () {
                    tock = Date.now();
                    io_1.emit(constants_1.SOCKETIO_BACKTESTER_DONE, { tick: tick, tock: tock });
                    client.disconnect(true);
                    io_1.close();
                });
            });
        });
    }
    return consumed;
}
exports.vester = vester;
