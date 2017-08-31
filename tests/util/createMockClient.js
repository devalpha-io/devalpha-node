export default function createMockClient() {
  let orderIdCounter = 0
  return ({ onFill }) => ({
    executeOrder(order) {
      orderIdCounter += 1
      const executedOrder = { ...order, commission: 0, id: orderIdCounter }
      setTimeout(() => onFill({
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
  })
}
