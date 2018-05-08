var _ = require('highland')

let done = false
console.log('starting')
setTimeout(() => {
  console.log('hello')
  done = true
}, 2000)

_((push, next) => {
  if (!done) {
    setImmediate(() => next())
  } else {
    push(null, 'item')
    push(null, _.nil)
  }
}).each((x) => {
  console.log('finished')
})
