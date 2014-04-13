var tape = require('tape')
var pull = require('pull-stream')
var bhl = require('../stream')

function generate (min, max, n) {

  var sp = (max - min)/n
  var a = []
  var soFar = min
  while(n--)
    a.push({
      ts: soFar += ((max - soFar)/n)*2*Math.random(),
      key: n,
      value: Math.random()
    })

  return a
}

tape('simple', function (t) {

  pull(
    pull.values(generate(0, Date.now(), 1000)),
    bhl({start: 0, size: 300e3, ts: 'ts'}),
    pull.collect(function (e, ary) {
      console.log(ary)
    })
  )

})

