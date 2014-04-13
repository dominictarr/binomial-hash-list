var tape = require('tape')
var pull = require('pull-stream')
var crypto = require('crypto')
var reduce = require('../reduce')
var r = reduce.reduce

function h (i) {
  return crypto.createHash('sha256').update(i.toString()).digest('hex')
}

function n (N) {
  var ary
  pull(
    pull.count(N - 1),
    pull.map(function (i) {
      return crypto.createHash('sha256').update(i.toString()).digest('hex')
    }),
    pull.collect(function (e, a) {
      if(e) throw e
      ary = a
    })
  )

  return ary
}

//pull(
//  pull.count(100),
//  pull.map(function (i) {
//    return crypto.createHash('sha256').update(i.toString()).digest('hex')
//  }),
//  reduce(),
//  pull.drain(console.log)
//)
//


function combine (a, b) {
  return crypto.createHash('sha256').update(a, 'hex').update(b, 'hex').digest('hex')
}

tape('simple 3', function (t) {
  var a = n(3)
  console.log(a)
  var result = a.reduce(r, [])
  t.equal(result[0].hash, a[2])
  t.equal(result.length, 2)

  t.equal(result[0].level, 0)
  t.equal(combine(a[1],a[0]), result[1].hash)

  t.equal(result[1].level, 1)
  console.log(JSON.stringify(result, null, 2))
  t.end()
})

tape('simple 4', function (t) {
  var a = n(4)
  console.log(a)
  var result = a.reduce(r, [])
  t.equal(result[0].hash, a[3])

  t.equal(result.length, 3)

  t.equal(result[1].hash, a[2])

  t.equal(result[0].level, 0)
  t.equal(combine(a[1],a[0]), result[2].hash)
  t.equal(result[2].level, 1)
  console.log(JSON.stringify(result, null, 2))
  t.end()
})


tape('simple 7', function (t) {
  var a = n(7)
  console.log(a)
  var result = a.reduce(r, [])
  t.equal(result.length, 3)

  t.equal(result[0].hash, a[6])
  t.equal(result[0].level, 0)

  t.equal(result[1].hash, combine(a[5],a[4]))
  t.equal(result[1].level, 1)

  t.equal(result[2].hash, combine(combine(a[3],a[2]), combine(a[1], a[0])))
  t.equal(result[2].level, 2)

  console.log(JSON.stringify(result, null, 2))
  t.end()
})

