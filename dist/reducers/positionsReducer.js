"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_1 = require("immutable");
var mathjs_1 = require("mathjs");
var constants_1 = require("../constants");
var initialState = immutable_1.Map({
    instruments: immutable_1.Map(),
    total: 0
});
exports.default = (function (state, action) {
    if (state === void 0) { state = initialState; }
    switch (action.type) {
        case constants_1.INITIALIZED: {
            if (action.payload.initialStates.positions) {
                // TODO validate supplied data
                var initial = action.payload.initialStates.positions;
                for (var _i = 0, _a = initialState.keys(); _i < _a.length; _i++) {
                    var key = _a[_i];
                    if (typeof initial[key] !== 'undefined') {
                        state = state.mergeIn([key], initial[key]);
                    }
                }
            }
            return state;
        }
        case constants_1.ORDER_FILLED: {
            var order = action.payload;
            var identifier = order.identifier;
            var direction = mathjs_1.sign(order.quantity);
            /* this is a new instrument, so add it and exit early */
            if (!state.hasIn(['instruments', identifier])) {
                /* value = quantity * price */
                var value_1 = mathjs_1.number(mathjs_1.multiply(mathjs_1.bignumber(order.quantity), mathjs_1.bignumber(order.price)));
                state = state.setIn(['instruments', identifier], immutable_1.Map({
                    quantity: order.quantity,
                    value: value_1,
                    price: order.price
                }));
                return state.set('total', mathjs_1.number(mathjs_1.add(mathjs_1.bignumber(state.get('total')), mathjs_1.bignumber(value_1))));
            }
            var instrument = state.getIn(['instruments', identifier]);
            /* update average aquired price if buying */
            if (direction === 1) {
                /* price =
                 *   (order.price * order.quantity + (instrument.quantity * instrument.price)) /
                 *   (instrument.quantity + order.quantity) */
                var price = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(order.price))
                    .multiply(mathjs_1.bignumber(order.quantity))
                    .add(mathjs_1.multiply(mathjs_1.bignumber(instrument.get('quantity')), mathjs_1.bignumber(instrument.get('price'))))
                    .divide(mathjs_1.add(mathjs_1.bignumber(instrument.get('quantity')), mathjs_1.bignumber(order.quantity)))
                    .done());
                instrument = instrument.set('price', price);
            }
            /* update quantity */
            /* quantity = instrument.quantity + order.quantity */
            var quantity = mathjs_1.number(mathjs_1.add(mathjs_1.bignumber(instrument.get('quantity')), mathjs_1.bignumber(order.quantity)));
            /* update value */
            /* value = order.price * (instrument.quantity + order.quantity) */
            var value = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(order.price))
                .multiply(mathjs_1.add(mathjs_1.bignumber(instrument.get('quantity')), mathjs_1.bignumber(order.quantity)))
                .done());
            var oldValue = instrument.get('value');
            instrument = instrument.merge({ quantity: quantity, value: value });
            /* delete position and exit early if quantity is now 0 */
            if (instrument.get('quantity') === 0) {
                state = state.deleteIn(['instruments', identifier]);
                return state.set('total', mathjs_1.number(mathjs_1.subtract(mathjs_1.bignumber(state.get('total')), mathjs_1.bignumber(oldValue))));
            }
            state = state.setIn(['instruments', identifier], instrument);
            state = state.set('total', mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('total')))
                .add(mathjs_1.subtract(mathjs_1.bignumber(value), mathjs_1.bignumber(oldValue)))
                .done()));
            return state;
        }
        case constants_1.BAR_RECEIVED: {
            var bar = action.payload;
            var identifier = bar.identifier;
            if (state.hasIn(['instruments', identifier])) {
                /* create a zero-value position if non-existent, then do nothing more */
                var quantity = state.getIn(['instruments', identifier, 'quantity']);
                var marketPrice = bar.close;
                var oldValue = state.getIn(['instruments', identifier, 'value']);
                /* calculate the new the value of the position */
                /* value = quantity * marketPrice */
                var value = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(quantity)).multiply(mathjs_1.bignumber(marketPrice)).done());
                /* assign the new position */
                state = state.setIn(['instruments', identifier, 'value'], value);
                state = state.set('total', mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(state.get('total')))
                    .add(mathjs_1.subtract(mathjs_1.bignumber(value), mathjs_1.bignumber(oldValue)))
                    .done()));
            }
            return state;
        }
        default: {
            return state;
        }
    }
});
