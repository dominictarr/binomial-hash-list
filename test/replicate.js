var tape = require('tape')
var replicate = require('../')
var pull = require('pull-stream')

//an in memory database with the right api.

function fakeDb () {
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
        return a.ts - b.ts
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


tape('sanity', function (t) {

  var db1 = fakeDb()
  var db2 = fakeDb()

  db1.put('hello1', {})
  db1.put('hello2', {})
  db1.put('hello3', {})
  db1.put('hello4', {})
  db1.put('hello5', {})

  pull(db1.read(), db2.write(function (err) {
    if(err) throw err
    console.log(db2.store)
    t.deepEqual(db2.store, db1.store)
    t.equal(Object.keys(db2.store).length, 5)
    t.end()
  }))
})


tape('simple replicate', function (t) {
  var start = +new Date('2014-01-01'), rolling = start
  function week () {
    return rolling += Math.random()*14*24*60*60*1000
  }

  var db1 = fakeDb()
  var db2 = fakeDb()

  db1.put('hello1', {ts: week()})
  db1.put('hello2', {ts: week()})
  db1.put('hello3', {ts: week()})
  db1.put('hello4', {ts: week()})
  db1.put('hello5', {ts: week()})

  pull(db1.read(), db2.write(function (err) {
    if(err) throw err
    db1.put('hello3', {foo: true, ts: db1.get('hello3').ts})

    var server = db1.replicate(true)
    var client = db2.replicate(false, done)

    pull(server, client, server)

    function done(err, writes) {
      console.log('REPLICATED!!!')
      t.deepEqual(db2.store, db1.store)
      t.equal(Object.keys(db2.store).length, 5)
      t.end()
      //okay that was easy...
    }
  }))
})


tape('simple replicate 2', function (t) {
  var start = +new Date('2014-01-01'), rolling = start
  function week () {
    return rolling += Math.random()*14*24*60*60*1000
  }

  var db1 = fakeDb()
  var db2 = fakeDb()

  db1.put('hello1', {ts: week()})
  db1.put('hello2', {ts: week()})
  db1.put('hello3', {ts: week()})
  db1.put('hello4', {ts: week()})
  db1.put('hello5', {ts: week()})

  pull(db1.read(), db2.write(function (err) {
    if(err) throw err
    db1.put('hello5', {foo: true, ts: db1.get('hello5').ts})

    var server = db1.replicate(true)
    var client = db2.replicate(false, done)

    pull(server, client, server)

    function done(err, writes) {
      console.log('REPLICATED!!!')
      t.deepEqual(db2.store, db1.store)
      t.equal(Object.keys(db2.store).length, 5)
      t.end()
      //okay that was easy...
    }
  }))
})


tape('replicate to empty', function (t) {
  var start = +new Date('2012-01-01'), rolling = start

  function week () {
    return rolling += Math.random()*14*24*60*60*1000
  }

  var db1 = fakeDb()
  var db2 = fakeDb()

  pull(
    pull.count(100),
    pull.map(function () {
      return {key: '' + Math.random(), value: {ts: week()}}
    }),
    db1.write(function (err) {
      var server = db1.replicate(true)
      var client = db2.replicate(false, done)

      pull(server, client, server)

      function done(err) {
        console.log('REPLICATED!!!')
        t.deepEqual(db2.store, db1.store)
        t.end()
        //okay that was easy...
      }
    })
  )
})


tape('replicate to empty', function (t) {
  var start = +new Date('2012-01-01'), rolling = start

  function week () {
    return rolling += Math.random()*14*24*60*60*1000
  }

  var db1 = fakeDb()
  var db2 = fakeDb()

  pull(
    pull.count(100),
    pull.map(function () {
      return {key: '' + Math.random(), value: {ts: week()}}
    }),
    db1.write(function (err) {
      var server = db1.replicate(true)
      var client = db2.replicate(false, done)

      pull(server, client, server)

      function done(err) {
        console.log('REPLICATED!!!')
        t.deepEqual(db2.store, db1.store)
        t.end()
        //okay that was easy...
      }
    })
  )
})

