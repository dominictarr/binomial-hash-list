var toBase = require('to-base')

var heaps = function (n, b) {
  b = b || 2
  var parts = toBase(n, b)

  for(var i = parts.length - 1 ; i >= 0; i--) {
    var j = i
    while(parts[j] === 0) {
      if(parts[j + 1] == null) {
        parts.pop(); continue;
      }
      parts[j] = b
      parts[++j] --
    }
  }

  return parts
}

//time of earliest record, bucket size.
var buckets = function (start, end, size) {
  if(!size) size = end, end = Date.now()
  const base = 2
 //5 minutes
  size = size || 300000
  //1st Jan, 1970 GMT.
  start = new Date(0 - new Date().getTimezoneOffset())

  var nowish = Date.now()
  nowish = nowish - (nowish % size)
  //buckets since start
  
  //as of writing, 4,637,256 5 minute buckets since the dawn of time.
  var buckets = Math.floor((nowish - start) / size)

  var h = heaps(buckets, base)

  var groups = []
  var cumulative = 0
  var i = h.length
  while(i--) {
    var v = h[i]
    var bSize = Math.pow(base, i) * size
    groups.push({gte: cumulative, lt: cumulative += bSize, size: bSize, v: v})
    if(v == 2)
      groups.push({gte: cumulative, lt: cumulative += bSize, size: bSize})
  }

  return groups
}

module.exports = buckets


if(!module.parent)
  console.log(buckets(null, 5e3))

