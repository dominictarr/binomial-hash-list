var through = require('pull-through')
var createHash = require('crypto').createHash
var stringify = require('json-stable-stringify')

module.exports = function (size, ts) {
  var start, current, hash, count = 0
  if('function' !== typeof ts)
    throw new Error('ts(obj) must be provided')
  if(isNaN(size) || size < 0)
    throw new Error('size must be a positive integer')
  hash = createHash('sha256')
  return through(function (data) {
    var t = ts(data)
    if(!start)
      current = start = t - t%size

    if(t > current + size) {
      this.queue({start: current, length: size, hash: hash.digest('hex'), count: count})
      current += size
      hash = createHash('sha256')
      count = 0
    }
    count ++
    hash.update(stringify(data) + '\n', 'ascii')

  }, function () {
    if(current)
      this.queue({start: current, length: size, hash: hash.digest('hex')})
    this.queue(null)
  })
}
