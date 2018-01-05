import createRingBuffer from 'CBuffer'

export default function createBuffer(size = 2 ** 31) {
  const listeners = {}
  const ringBuffer = createRingBuffer(size)
  let input = 0
  let current = 0

  return {
    size: () => input - current,
    isEmpty() {
      return input === current
    },
    getInput() {
      return input
    },
    getCurrent() {
      return current
    },
    next() {
      if (current < input) {
        const item = ringBuffer[current]
        current += 1
        return item
      }
    },
    notifyListeners() {
      for (const key of Object.keys(listeners)) {
        listeners[key]()
      }
    },
    push(item) {
      ringBuffer[input] = item
      input += 1
    },
    subscribe(key, cb) {
      listeners[key] = cb
    },
    unsubscribe(key) {
      delete listeners[key]
    }
  }
}
