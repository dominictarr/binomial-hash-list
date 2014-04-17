var tape = require('tape')
var replicate = require('../')
var pull = require('pull-stream')

var fakeDb = require('./mock')

//an in memory database with the right api.


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
    return rolling += (Math.random()*14*24*60*60*1000)
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
    return rolling += (Math.random()*14*24*60*60*1000)
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
    return rolling += (Math.random()*14*24*60*60*1000)
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
    return rolling += (Math.random()*14*24*60*60*1000)
  }

  var db1 = fakeDb()
  var db2 = fakeDb()

  pull(
    pull.count(100),
    pull.map(function () {
      return {key: '' + Math.random(), value: {ts: week()}}
    }),
    db1.write(function (err) {
      var n = 2
      var server = db1.replicate(true, function (err) {
        if(err) throw err
        done()
      })
      var client = db2.replicate(false, function (err) {
        if(err) throw err
        done()
      })

      pull(server, client, server)

      function done(err) {
        if(--n) return
        console.log('REPLICATED!!!')
        t.deepEqual(db2.store, db1.store)
        t.end()
        //okay that was easy...
      }
    })
  )
})

