var tape = require('tape')
var ranges = require('../ranges')
var pull = require('pull-stream')
var reduce = require('../reduce')
var compare = require('../compare')
var crypto = require('crypto')

var v1 = [
  {key:  0, value: +new Date('2014-01-01')},
  {key:  1, value: +new Date('2014-01-07')},
  {key:  2, value: +new Date('2014-01-14')},
  {key:  3, value: +new Date('2014-01-21')},
  {key:  4, value: +new Date('2014-01-28')},
  {key:  5, value: +new Date('2014-02-04')},
  {key:  6, value: +new Date('2014-02-11')},
  {key:  7, value: +new Date('2014-02-18')},
  {key:  8, value: +new Date('2014-02-25')},
  {key:  9, value: +new Date('2014-03-04')},
  {key: 10, value: +new Date('2014-03-11')},
  {key: 11, value: +new Date('2014-03-18')},
  {key: 12, value: +new Date('2014-03-25')}
]

var v2 = v1.slice()



function flatten (ary) {
  var o = {}
  ary.forEach(function (row) {
    o[row.key] = row.value
  })
  return o
}

v2[8] = {key: 8, value: +new Date('2014-03-05')}
v2[9] = {key: 9, value: +new Date('2014-03-06')}

function ts (e) {return e.value}
var fortnight = 14*24*60*60*1000

function toTree (list, cb) {
  pull(
    pull.values(list),
    ranges(fortnight, ts),
    pull.through(console.log),
    reduce(cb)
  )
}

tape('not eq', function (t) {
  t.notDeepEqual(v1, v2)
  t.notEqual(JSON.stringify(v1), JSON.stringify(v2))


  toTree(v1, function (err, t1) {
    if(err) throw err

    toTree(v2, function (err, t2) {
      if(err) throw err

      t.ok(JSON.stringify(t1) !== JSON.stringify(t2))
      var diff = compare(t1, t2)

      var request = v1.filter(function (e) {
        for(var i in diff) {
          var v = diff[i]
          console.log(e, e.value >= v.start, e.value < v.start + v.length)
          if((e.value >= v.start) && (e.value < v.start + v.length))
            return true
        }
      })

      t.equal(request.length, 4)

      var f1 = flatten(v1)
      var f2 = flatten(v2)

      request.forEach(function (row) {
        f2[row.key] = row.value
      })

      t.deepEqual(f2, f1)

      t.end()
    })
  })
})

