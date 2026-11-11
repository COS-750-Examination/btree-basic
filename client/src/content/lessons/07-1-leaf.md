Deleting starts like searching: follow the yarn down until you find the key.

If the key is in a **leaf**, take it out. If the leaf still holds at least **⌈m/2⌉ − 1 keys**, the minimum for its order, you are done. With order 3 the minimum is 1, so deleting 30 from the leaf `[28 | 30]` leaves `[28]`, and the tree is still valid.

The root is the one exception to the minimum: it may hold a single key, and if it is a leaf it may become empty, which means the tree is empty.
