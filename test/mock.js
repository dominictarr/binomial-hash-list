var replicate = require('../')
var pull = require('pull-stream')

module.exports = function () {
  var store = {}, db
  return db = {
    store: store,
    get: function (key) {
      return store[key]
    },
    put: function (key, value) {
      store[key] = value
      value.ts = value.ts || Date.now()
      return this
    },
    read: function (opts) {
      var array = Object.keys(store).map(function (key) {
        return {key: key, value: store[key]}
      }).sort(function (a, b) {
        return a.value.ts - b.value.ts
      })

      return pull(pull.values(array), pull.filter(function (item) {
        if(opts && opts.gte && item.ts <  opts.gte) return false
        if(opts && opts.gt  && item.ts <= opts.gt)  return false
        if(opts && opts.lte && item.ts >  opts.lte) return false
        if(opts && opts.lt  && item.ts >= opts.lt)  return false
        return true
      }))
    },
    write: function (cb) {
      var writes = 0
      return pull.drain(function (row) {
        writes ++
        store[row.key] = row.value
      }, function (err) { cb(err, writes) })
    },
    replicate: function (server, cb) {
      return replicate({
        ts: function (e) { return e.value.ts },
        size: 7*24*60*60*1000, //one week
        read: db.read, write: db.write,
        server: server
      }, cb)
    }
  }
}

