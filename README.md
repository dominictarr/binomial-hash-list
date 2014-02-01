# binomial-hash-list

A list of increasingly larger hash trees, like a binomial heap.

## Abstract

This is a scheme for hashing a dataset where each object
has a timestamp, such that it's possible to compare two
binomial hash lists and efficently detect additions, assuming
that new records have a recent timestamp. (it's not essential 
that the timestamps are strictly ordered, or correct)

## Prior Work

A flat hashlist can be used to compare remote datasets,
as in [bittorrent], each object in the set is hashed,
then all the hashes (in a predefined, deterministic order)
are hashed into a "top hash". To compare the set on two different
nodes, initially just the top hash is sent. If both nodes
have the same tophash, then the list of hashes is sent.

In the case of bittorrent, the dataset is static, the hashes of each
object is known before hand. This scheme would not be efficient
with a dynamically growing dataset, because hashing the database after
one small change would produce a completely different hash, which would
require sending the hashes of every value in the database.

Another approach is to use a merkel tree. Objects are hashed into a tree,
grouped by prefixes of their hashes. As with the flat list of hashes,
the top hash is compared. If the top hash differs, then the next level
of hashes must be sent. The hashes at the next level of the tree are
compared, and so on. This is quite efficient if the number of different
records is small relative to the total dataset. As the number of new items
increases, the number of hashes which must be sent is increased,
but worse, more round-trips must be made. Also, the proportion of new items
is held constant, the average number of round-trips necessary increases with
the size of the dataset.

The increase is proportional to the log of the dataset, but internet users
are used to a fixed number of round trips to load even a popular page.

## Binomial Hash List

Binomial Hash Lists group time ordered data into increasingly larger buckets.
The most recent objects will fall in the smallest bucket, and the oldest
ones will fall into the oldest bucket.





## License

MIT
