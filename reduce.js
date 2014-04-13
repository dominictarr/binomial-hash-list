
var pull = require('pull-stream')
var crypto = require('crypto')
function combine (a, b) {
  return crypto.createHash('sha256').update(a, 'hex').update(b, 'hex').digest('hex')
}

function roll (acc, item) {
    var updates = [0, 0, {level: 1, hash: item}]
    while(acc.length >= 2 && acc[0].level === acc[1].level) {
      var a = acc.shift(), b = acc.shift()
      updates.push({level: a.level + 1, hash: combine(a.hash, b.hash), parents: [a.hash, b.hash]})
    }
    acc.splice.apply(acc, updates)
    return acc
}

module.exports = function (cb) {

  return pull.reduce(roll, [], cb)

}

module.exports.reduce = roll
