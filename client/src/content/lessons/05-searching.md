To search for a key, start at the root and **follow the golden yarn**:

1. Compare the key with the keys in the node.
2. If it is there, you are done.
3. Otherwise follow the child between the two keys it falls between.
4. If you reach a leaf without finding it, the key is not in the tree.

Because the tree is short, a search visits only **one node per level**.
