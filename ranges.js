var through = require('pull-through')
var createHash = require('crypto').createHash
var stringify = require('json-stable-stringify')

module.exports = function (size, ts) {
  var start, current, hash
  if('function' !== typeof ts)
    throw new Error('ts(obj) must be provided')
  if(isNaN(size) || size < 0)
    throw new Error('size must be a positive integer')

  return through(function (data) {
    var t = ts(data)
    if(!start)
      current = start = t - t%size

    if(t > current + size) {
      this.queue({start: current, length: size, hash: hash.digest('hex')})
      current += size
    }
    console.log(current, data)
    hash = createHash('sha256')
    hash.update(stringify(data) + '\n', 'ascii')

  }, function () {
    this.queue({start: current, length: size, hash: hash.digest('hex')})
    this.queue(null)
  })
}
