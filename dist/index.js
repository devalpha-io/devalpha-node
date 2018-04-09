"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("highland");
const redux_1 = require("redux");
const http = require("http");
const socket = require("socket.io");
// Middleware
const createBrokerRealtime_1 = require("./middleware/createBrokerRealtime");
const createBrokerBacktest_1 = require("./middleware/createBrokerBacktest");
const createGuard_1 = require("./middleware/createGuard");
const createStrategy_1 = require("./middleware/createStrategy");
// Reducers
const capitalReducer_1 = require("./reducers/capitalReducer");
const positionsReducer_1 = require("./reducers/positionsReducer");
const ordersReducer_1 = require("./reducers/ordersReducer");
const timestampReducer_1 = require("./reducers/timestampReducer");
// Other
const streams_1 = require("./util/streams");
const applyMiddlewareSeq_1 = require("./applyMiddlewareSeq");
const constants_1 = require("./constants");
__export(require("./constants"));
/**
 * The entry point to the whole system.
 *
 * @param {Object} config The Vester configuration.
 * @param {boolean} config.backtesting
 * @param {number} config.capital
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
function vester(config = {}, strategy) {
    config = Object.assign({ backtesting: true, client: null, startCapital: 0 }, config, { initialStates: Object.assign({}, config.initialStates), feeds: Object.assign({}, config.feeds), backtest: Object.assign({ timestamp: 0, commission: 0 }, config.backtest), guard: Object.assign({ shorting: false, margin: false, restricted: [] }, config.guard), dashboard: Object.assign({ active: false, port: 4449 }, config.dashboard) });
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
    const strategyMiddleware = createStrategy_1.default(strategy);
    const guardMiddleware = createGuard_1.default(config.guard);
    let brokerMiddleware;
    if (config.backtesting !== false || !config.client) {
        brokerMiddleware = createBrokerBacktest_1.default(config.backtest.commission);
    }
    else {
        brokerMiddleware = createBrokerRealtime_1.default(config.client);
    }
    const reducer = redux_1.combineReducers({
        capital: capitalReducer_1.capitalReducer,
        positions: positionsReducer_1.positionsReducer,
        orders: ordersReducer_1.ordersReducer,
        timestamp: timestampReducer_1.timestampReducer
    });
    const middlewares = [guardMiddleware, brokerMiddleware, strategyMiddleware];
    let stream;
    let startedAt;
    let finishedAt;
    if (config.backtesting === false) {
        startedAt = Date.now();
        finishedAt = Date.now();
        stream = streams_1.createMergedStream(config.feeds);
    }
    else {
        startedAt = config.backtest.timestamp;
        finishedAt = config.backtest.timestamp;
        stream = streams_1.createSortedStream(config.feeds);
    }
    stream.write({
        type: constants_1.INITIALIZED,
        payload: {
            timestamp: startedAt,
            initialStates: config.initialStates,
            startCapital: config.startCapital
        }
    });
    const store = redux_1.createStore(reducer, applyMiddlewareSeq_1.default(stream, middlewares));
    let consumed = stream.consume((err, item, push, next) => {
        if (err) {
            push(err, null);
            next();
        }
        else if (item) {
            if (config.backtesting !== false) {
                try {
                    const finished = {
                        type: constants_1.FINISHED,
                        payload: {
                            timestamp: finishedAt
                        }
                    };
                    store.dispatch(finished);
                    push(null, {
                        state: store.getState(),
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
            push(new Error(`Skipped event from feed "${item.type}" due to missing timestamp property.`), null);
            next();
        }
        else {
            finishedAt = item.payload.timestamp;
            try {
                store.dispatch(item);
                push(null, {
                    state: store.getState(),
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
        const app = http.createServer((req, res) => {
            res.writeHead(200);
            res.end();
        });
        const io = socket(app);
        app.listen(config.dashboard.port);
        const socketStream = consumed.fork();
        consumed = consumed.fork();
        io.on(constants_1.SOCKETIO_CONNECTION, (client) => {
            client.on(constants_1.SOCKETIO_BACKTESTER_RUN, () => {
                startedAt = Date.now();
                socketStream
                    .batchWithTimeOrCount(500, 1000)
                    .each((events) => {
                    io.emit(constants_1.SOCKETIO_BACKTESTER_EVENTS, { events });
                })
                    .done(() => {
                    finishedAt = Date.now();
                    io.emit(constants_1.SOCKETIO_BACKTESTER_DONE, { startedAt, finishedAt });
                    client.disconnect(true);
                    io.close();
                });
            });
        });
    }
    return consumed;
}
exports.vester = vester;
