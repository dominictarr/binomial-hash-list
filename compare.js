// check what ranges are in serverTree that are not in clientTree.
// get their ranges and extents, so you can send them what they need.

function merge (into, from) {
  for(var k in from)
    into[k] = from[k]
  return into
}

function copy(e) {
  return {start: e.start, length: e.length, hash: e.hash}
}

module.exports = function (serverTree, clientTree) {

  var client = {}, request = []

  clientTree.forEach(function (e) {
    client[e.hash.hash] = e.hash
    if(e.parents)
      e.parents.forEach(function (e) {
        client[e.hash] = e
      })
  })

  serverTree.forEach(function (e) {
    if(client[e.hash.hash]) return
    if(e.parents) {
      var missing = [request.length, 0]
      for(var i in e.parents) {
        var k = e.parents[i].hash
        if(!client[k]) missing.push(e.parents[i])
      }
        if(missing.length == e.parents.length)
          request.push(copy(e))
        else
          [].splice.apply(request, missing)
    } else
      request.push(copy(e))
  })
  return request
}
