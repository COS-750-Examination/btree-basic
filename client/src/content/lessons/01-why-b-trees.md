How does a database find **one record among millions** while reading from disk only three or four times?

Reading from a disk is slow compared to memory, and a disk is always read in whole **blocks**. A binary search tree with a million keys is about 20 levels deep, so a search could need about 20 slow reads.

A B-tree packs **many keys into each node**, sized to fill one disk block. Each node has many children, so the tree is very short and a search only reads a handful of nodes.

> **Think of a library.** Instead of asking "left or right?" twenty times, you read a shelf label that splits the books into many sections at once.
