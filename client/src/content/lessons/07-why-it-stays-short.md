A B-tree only grows at the root, so **all leaves stay on the same level**. That keeps the tree **balanced** without any extra work.

With up to m children per node, a B-tree holding n keys has height about **logₘ(n)**. For m = 100 and a million keys, that is only about **3 levels**, versus about 20 for a balanced BST. Search and insertion both take **O(log n)** time.

Try **Cut out a BST too** in the visualiser to compare the shapes.
