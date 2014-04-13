
var pull = require('pull-stream')
var crypto = require('crypto')

/*
  Given a stream of hashes, stack them into piles,
  so that there is always at least one (max two) at each size.

  If there are already 2 hashes that represent a given size,
  and you have a third thing to add, combine the first two,
  and add that to the next level.

  If there is already two at the next level, this will cascade.

  ---

  Okay so how do I add replication on top of this?
  use pull-handshake, read the hash tree,
  Send that to remote... compare that with local hash tree,
  and then, if you are the server, send old ranges

  (or else sit back and wait - it should be possible to have a
  2 sided replication with this protocol,
  but it's not needed for anything yet)

  how should I handle old ranges?
  should I align the ranges to absolute time ranges?
  that means handling empty ranges somehow...

  in my particular target usecase, sometimes old records
  are updated but without updating the timestamp properly
  (timestamp is not reliable, but new update will have correct timestamp)
  (there should not be new things that are inserted out of order)

  So... this will probably work.

  I should build this the straight forward way,
  and then simulate different scenarios to see how badly it breaks.

  So, in that case, all that I need is to track the timestamps
  start and end for each range...

  ---

  if I did want to quickly update the tree after empty ranges,
  the easyiest way would be to merge empty ranges
  without altering the hashes - then If I got a large
  empty range, I'd just have to calculate what the stacks are.
  compact all the current stacks.

  to ask whether agiven stack is compacted, it's just a matter of
  it's size + whether it's the first stack that size (otherwise,
  it only needs to have it's size. So, if I want to add in 36
  empty stacks, I could begin by folding up the current small stacks,
  then inserting new stuff in front.

  --

*/

function combine (a, b) {
  return crypto.createHash('sha256').update(a, 'hex').update(b, 'hex').digest('hex')
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
