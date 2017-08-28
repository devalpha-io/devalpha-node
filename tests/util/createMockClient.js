export default function createMockClient() {
  function notify(listeners, item) {
    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i](item)
    }
  }

  const listeners = {
    fill: [],
    fail: [],
    cancel: []
  }

  let orderIdCounter = 0

  return {
    onFill(cb) {
      listeners.fill.push(cb)
    },
    onFail(cb) {
      listeners.fail.push(cb)
    },
    onCancel(cb) {
      listeners.cancel.push(cb)
    },
    executeOrder(order) {
      orderIdCounter += 1
      const executedOrder = { ...order, commission: 0, id: orderIdCounter }
      setImmediate(() => notify(listeners.fill, {
        ...executedOrder,
        expectedPrice: order.price,
        expectedQuantity: order.quantity,
        expectedCommission: order.commission
      }))
      return { ...executedOrder }
    },
    cancelOrder() {},
    calculateCommission() {
      return 0
    }
  }
}
