
var pull = require('pull-stream')
var crypto = require('crypto')

function combine (a, b) {
//    process.assert(b.start == a.end, 'non adjacent ranges:'+[a.start,a.start + a.length , b.start].join(', '))
    return {
      start : Math.min(a.start, b.start),
      end   : Math.max(a.end, b.end),
      hash  :
        crypto.createHash('sha256')
          .update(a.hash, 'hex')
          .update(b.hash, 'hex')
          .digest('hex')
      }
  }

function inject (combine) {
  return function (acc, item) {
      var updates = [0, 0, {level: 0, hash: item}]
      while(acc.length >= 2 && acc[0].level === acc[1].level) {
        var a = acc.shift(), b = acc.shift()
        updates.push({level: a.level + 1, hash: combine(a.hash, b.hash), parents: [a.hash, b.hash]})
      }
      acc.splice.apply(acc, updates)
      return acc
  }

}

module.exports = function (cb) {
  return pull.reduce(inject(combine), [], cb)
}

module.exports.reduce = inject(combine)
module.exports.inject = inject
