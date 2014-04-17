
var tree1 = require('./fixtures/tree1')
var tree2 = require('./fixtures/tree2')

var ranges = require('../ranges')
var reduce = require('../reduce')
var compare = require('../compare')
var pull = require('pull-stream')
var tape = require('tape')

console.log(compare(tree1.tree, tree2.tree))


tape('random', function (t) {
  var start = new Date('2000-01-01'), rolling = +start
  var total = 1000
  var gap = (Date.now() - +start)/(total/2)

  var input = []
  for(var i = 0; i < total; i++)
    input.push({
        key: '*'+Math.random(),
        value: {
          count: i,
          ts: new Date(rolling += Math.random()*gap).toISOString()
        }
      })

  var mutate = input.slice()
  var r = ~~(Math.random()*mutate.length)
  mutate[r] = JSON.parse(JSON.stringify(input[r]))
  mutate[r].value.foo = Math.random()

  pull(
    pull.values(input),
    ranges(24*60*60*1000, function (e) { return e.value.ts }),
//    pull.through(console.log),
    reduce(function (err, tree) {
      console.log(tree)
      pull(
        pull.values(mutate),
        ranges(24*60*60*1000, function (e) { return e.value.ts }),
        reduce(function (err, _tree) {
          var missing = compare(tree, _tree)
          console.log(missing)
          var send = mutate.filter(function (e) {
            var date = new Date(e.value.ts)
            for(var i in missing)
              if(missing[i].start <= date && missing[i].end > date)
                return true
          })
          console.log(send)
          t.notEqual(send.indexOf(mutate[r]), -1)
          t.end()

      }))
    })
  )
})

