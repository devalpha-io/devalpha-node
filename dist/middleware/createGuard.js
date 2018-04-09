"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const constants_1 = require("../constants");
/**
 * The guard middleware has the capability to alter orders or even prevent them from being
 * requested in the first place.
 *
 * @private
 * @param  {Object} settings A settings object.
 * @return {function} Middleware
 */
function createGuard(settings) {
    return (store) => {
        const isRestrictedAsset = (order) => {
            if (settings.restricted.indexOf(order.identifier) > -1) {
                return true;
            }
            return false;
        };
        const isDisallowedShort = (order) => {
            const { quantity, identifier } = order;
            if ((!settings.shorting) && quantity < 0) {
                const instrument = store.getState().positions.instruments[identifier];
                if (!instrument) {
                    return true;
                }
                if (new decimal_js_1.default(instrument.quantity).lessThan(decimal_js_1.default.abs(quantity))) {
                    return true;
                }
            }
            return false;
        };
        const isDisallowedMargin = (order) => {
            if (!settings.margin) {
                const { quantity, price, commission } = order;
                const cash = store.getState().capital.cash;
                const cost = decimal_js_1.default.mul(quantity, price).add(commission);
                if (cash < cost) {
                    return true;
                }
            }
            return false;
        };
        return (next) => (action) => {
            switch (action.type) {
                case constants_1.ORDER_CREATED: {
                    const order = action.payload;
                    if (isRestrictedAsset(order) ||
                        isDisallowedShort(order) ||
                        isDisallowedMargin(order)) {
                        return next({
                            type: constants_1.ORDER_REJECTED,
                            payload: Object.assign({}, action.payload)
                        });
                    }
                    return next(action);
                }
                default:
                    break;
            }
            return next(action);
        };
    };
}
exports.default = createGuard;
