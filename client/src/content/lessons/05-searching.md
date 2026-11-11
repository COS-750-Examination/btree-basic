To search for a key, start at the root and **follow the golden yarn**:

1. Compare the key with the keys in the node, from left to right.
2. If it is there, you are done.
3. Otherwise, find where it fits: **before the first key**, **between two neighbouring keys**, or **after the last key**. Follow that child.
4. If you reach a leaf without finding it, the key is not in the tree.

A search visits **one node per level**, so it reads only as many nodes as the tree is tall. Inside a node the keys are sorted, so a computer can also binary-search them.
