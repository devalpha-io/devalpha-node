import fs from 'fs'

export default function createMiddleware(filename) {
  return (store) => (next) => (action) => new Promise((resolve, reject) => {
    if (filename !== '') {
      fs.writeFile(filename, JSON.stringify(store.getState().toJS()), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(next(action))
        }
      })
    } else {
      resolve(next(action))
    }
  })
}
