import os from 'os'

export default function createMiddleware(stream) {
  return () => (next) => (action) => new Promise((resolve, reject) => {
    stream.write(JSON.stringify(action) + os.EOL, () => {
      resolve(next(action))
    })
  })
}
