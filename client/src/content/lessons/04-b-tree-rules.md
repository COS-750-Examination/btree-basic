A **B-tree of order m** follows four rules:

1. Every node has **at most m children** and so **at most m − 1 keys**.
2. Every node except the root has **at least ⌈m/2⌉ − 1 keys**.
3. Keys in a node are **sorted**, and each key separates the ranges of its neighbouring subtrees.
4. **All leaves are on the same level.**

For order 3 (a "2-3 tree"), each node holds 1 or 2 keys and has 2 or 3 children.
