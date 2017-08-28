export function buildLimitOrder(order, commission) {
  return { ...order, commission }
}

export function buildMarketOrder() {
  // TODO
}
