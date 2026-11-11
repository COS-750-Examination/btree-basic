A **B-tree of order m** is a multiway search tree in which:

1. Every node has **at most m children**, so it holds **at most m − 1 keys**.
2. Every node except the root holds **at least ⌈m/2⌉ − 1 keys**, so every internal node except the root has at least ⌈m/2⌉ children.
3. The **root** has **at least 2 children**, unless it is a leaf. A root that is a leaf may hold as few as 1 key.
4. A node with **k keys** that is not a leaf has **exactly k + 1 children**.
5. The keys in a node are **sorted**.
6. Each key **separates** its neighbouring subtrees: keys in the subtree to its left are smaller, and keys to its right are larger.
7. **All leaves are on the same level.**

| order m | keys per node (except the root) | children per internal node (except the root) |
| ------- | ------------------------------- | -------------------------------------------- |
| 3       | 1 to 2                          | 2 to 3                                       |
| 4       | 1 to 3                          | 2 to 4                                       |
| 5       | 2 to 4                          | 3 to 5                                       |

Order 3 is also called a **2-3 tree**, and order 4 a **2-3-4 tree**.

> **Watch the word "order".** Here, as in COS212, the order m is the **largest number of children** a node may have (Knuth's definition). Some textbooks instead use a _minimum degree_ t, where a node holds t − 1 to 2t − 1 keys. Always check which one a source means.
