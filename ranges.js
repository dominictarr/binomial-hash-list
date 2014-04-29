var through = require('pull-through')
var createHash = require('crypto').createHash
var stringify = require('json-stable-stringify')
var assert = process.assert
module.exports = function (size, ts) {
  var start, current, hash, count = 0
  if('function' !== typeof ts)
    throw new Error('ts(obj) must be provided')
  if(isNaN(size) || size < 0)
    throw new Error('size must be a positive integer')
  hash = createHash('sha256')
  var prev = 0
  return through(function (data) {
    var t = ts(data)
    if('number' !== typeof t)
      t = 'string' === typeof t ? +new Date(t) : +t

    if(!start)
      current = start = t - t % size

    if(t >= current + size) {
      this.queue({start: current, end: current + size, date: new Date(current), hash: hash.digest('hex'), count: count})
      while(t >= current + size)
        current += size
      hash = createHash('sha256')
      count = 0
    }

    // *****************************
    // allow duplicate timestamps...
    // cross our fingers for a general order
    // assuming level-search the secondary sort will be the key
    // this will still work, as long as the order tends to be the same.
    // *****************************

    if(!(t >= prev))
      this.emit('error', new Error('timestamp out of order, got:' + t + ' but had: ' + prev))
    prev = t
    if(!(t >= current))
      this.emit('error', 'timestamp too low, expected: ' + t + ' >= ' + current)
    if(!(t <  current + size))
      this.emit('error', 'timestamp too high, expected: ' + t +  ' < ' + (current + size))

    count ++
    hash.update(stringify(data) + '\n', 'ascii')

  }, function () {
    if(current)
      this.queue({start: current, end: current + size, hash: hash.digest('hex')})
    this.queue(null)
  })
}
