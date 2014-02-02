
var through = require('through')
var stringify = require('json-stable-stringify')
var Binomial = require('./')
var createHash = require('crypto').createHash

module.exports = function (opts) {
  opts = opts || {}

  var ranges = Binomial(opts.start, opts.size)
  var alg = opts.alg || 'sha256'

  if(opts.reverse)
    ranges = ranges.reverse()

  var _ts = opts.ts, getTs = _ts

  if(!_ts)
    throw new Error('a ts function or property name must be provided')

  if('string' === typeof _ts)
    getTs = function (data) {
      return new Date(data[_ts])
    }

  var current = ranges.shift()
  var hash = createHash(alg)
  var count = 0

  function next () {
    if(count >= 0) {
      current.hash = hash.digest('hex')
      current.count = count
      count = 0
      hash = createHash(alg)
      this.queue(current)
    }
    current = ranges.shift()

    if(!current) return this.queue(null)
  }

  return through(function (data) {
    var ts = getTs(data)
    count ++
    if(ts < current.lt) {
      var enc = (
          Buffer.isBuffer(data) ? null
        : 'string' === typeof data ? 'utf8'
        : data=stringify(data), 'ascii'
      )

      hash.update(data, enc)
      //this shouldn't happen
      if(ts < current.gte)
        this.emit('error',
          new Error('timestamps out of order:'+ts+'>='+current.gte))

    } else
      next.call(this)
  }, function () {
    next.call(this)
    this.queue(null)
  })

}
