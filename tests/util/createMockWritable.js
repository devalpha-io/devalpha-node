import { Writable } from 'stream'

export default function createMockWritable() {
  const w = new Writable()
  w._write = (data, encoding, next) => {
    setTimeout(() => next(), 0)
  }
  return w
}
