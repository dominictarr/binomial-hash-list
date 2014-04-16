var pull      = require('pull-stream')
var handshake = require('pull-handshake')
var reduce    = require('./reduce')
var ranges    = require('./ranges')
var compare   = require('./compare')
var cat       = require('pull-cat')

function empty () {
  return function (abort, cb) { cb(true) }
}

function onEnd(end_cb) {
  return function (read) {
    return function (abort, cb) {
      read(abort, function (err, data) {
        if(err) end_cb(err)
        cb(err, data)
      })
    }
  }
}

// createRead(opts)
//
// must return a readable pull-stream, and take
// start and end, which should be unix timestamps.

// createWrite(cb)
//
// must return a reader pull-stream and take
// a cb, this is called when all records have been written.
// * maybe this could be a transform stream, and then the replication can be 2 ways.

var version = require('./package').version

module.exports = function (opts, cb) {
  return handshake(function (cb) {
    pull(
      opts.read({}),
      ranges(opts.size, opts.ts),
      reduce(function (err, tree) {
        cb(err, {tree: tree, version: version, server: opts.server})
      })
    )
  }, function (mine, yours) {

    //TODO: replace this with stream errors!!!
    if(mine.server && yours.server)
      throw new Error('both ends cannot be servers')
    if(!mine.server && !yours.server)
      throw new Error('at least one end must be a server')
    if(mine.version.split('.')[0] !== yours.version.split('.')[0])
      throw new Error('major versions differ!')

    if(!opts.server) return { sink: opts.write(cb), source: pull.defer()}

    var missing = compare(mine, yours)
    return {
      source: pull(
        cat(missing.reverse()
          .map(function(range) {
            return opts.read({gte: range.start, lt: range.start + range.length})
          })),
        onEnd(cb || function () {})
      ),
      sink: pull.drain(null, cb)
    }
  })
}
