"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var mathjs_1 = require("mathjs");
var constants_1 = require("../constants");
/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @private
 * @param  {Object} settings A settings object.
 * @return {function} Middleware
 */
function createGuard(settings) {
    return function (store) {
        var isRestrictedAsset = function (order) {
            if (settings.restricted.indexOf(order.identifier) > -1) {
                return true;
            }
            return false;
        };
        var isDisallowedShort = function (order) {
            var quantity = order.quantity, identifier = order.identifier;
            if ((!settings.shorting) && quantity < 0) {
                var instrument = store.getState().getIn(['positions', 'instruments', identifier]);
                if (!instrument) {
                    return true;
                }
                if (instrument.get('quantity') < mathjs_1.abs(quantity)) {
                    return true;
                }
            }
            return false;
        };
        var isDisallowedMargin = function (order) {
            if (!settings.margin) {
                var quantity = order.quantity, price = order.price, commission = order.commission;
                var cash = store.getState().get('capital').get('cash');
                var cost = mathjs_1.number(mathjs_1.chain(mathjs_1.bignumber(quantity)).multiply(mathjs_1.bignumber(price)).add(mathjs_1.bignumber(commission)).done());
                if (cash < cost) {
                    return true;
                }
            }
            return false;
        };
        return function (next) { return function (action) {
            switch (action.type) {
                case constants_1.ORDER_CREATED: {
                    var order = action.payload;
                    if (isRestrictedAsset(order) ||
                        isDisallowedShort(order) ||
                        isDisallowedMargin(order)) {
                        return next({
                            type: constants_1.ORDER_REJECTED,
                            payload: __assign({}, action.payload)
                        });
                    }
                    return next(action);
                }
                default:
                    break;
            }
            return next(action);
        }; };
    };
}
exports.default = createGuard;
