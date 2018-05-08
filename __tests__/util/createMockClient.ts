export const createMockClient = (fail = false) => {
  let orderIdCounter = 0
  return ({ onFill }) => ({
    executeOrder: async (order) => {
      orderIdCounter += 1
      const builtOrder = Object.assign({}, order, {
        commission: 0,
        id: orderIdCounter.toString()
      })
      /* simulate network delay */
      await new Promise(r => setTimeout(r, 10))
      if (fail) {
        throw new Error()
      } else {
        /* simulate market delay */
        setTimeout(() => {
          onFill(builtOrder)
        }, 200)
      }

      return Object.assign({}, builtOrder)
    },
    cancelOrder: async ({ id }) => {
      /* simulate network delay */
      await new Promise(r => setTimeout(r, 10))
      if (fail) {
        throw new Error()
      } else {
        return id
      }
    },
    calculateCommission: () => 0
  })
}
