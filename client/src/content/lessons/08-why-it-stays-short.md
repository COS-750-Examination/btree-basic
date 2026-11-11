A B-tree only grows at the root, so **all leaves stay on the same level**. That keeps the tree **balanced** without any extra work.

Every node except the root has at least ⌈m/2⌉ children, so the height grows only **logarithmically**: between about **log_m(n)** levels when nodes are full and about **log\_⌈m/2⌉(n)** when they are half full. For m = 100 and a million keys, that is **about 4 levels**, whether the nodes are full or half full, against about 20 for even a perfectly balanced BST.

Search, insertion and deletion all take **O(log n)** time, and each one reads only one node per level from disk.

Try **Cut out a BST too** in the visualiser to compare the shapes.
