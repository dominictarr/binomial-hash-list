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
        if(err) end_cb(err === true ? null : err)
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

function errorStream(err) {
  return {
    source: function (abort, cb) { cb(err) },
    sink: function (read) { read(err, function () {}) }
  }
}

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

    var err
    if(mine.server && yours.server)
      err = new Error('both ends cannot be servers')
    else if(!mine.server && !yours.server)
      err = new Error('at least one end must be a server')
    else if(mine.version.split('.')[0] !== yours.version.split('.')[0])
      err = new Error('major versions differ!')

    if(err) {
      cb(err)
      return errorStream(err)
    }

    var defer = pull.defer()

    if(!opts.server)
      return {
        sink: opts.write(function (err, w) {
            defer.resolve(function (end, cb) { cb(end || true) })
            cb(err, w)
          }),
        source: defer
      }

    var missing = compare(mine.tree, yours.tree)
      console.error('MISSING', missing)
    return {
      source: pull(
        cat(missing.reverse()
          .map(function(range) {
            return opts.read({gte: range.start, lt: range.end})
          }))
      ),
      sink: pull.drain(null, cb)
    }
  })
}
