Every B-tree has an order that limits how full a node can get. With order 3, a node holds at most 2 keys. Add a third and the node **overflows**: it splits around its **middle key**, and that middle key moves up to the parent.

> **Think of a shelf with room for two jars.** Put a third jar on it and the shelf splits in two. The middle jar goes up to the shelf above, so every shelf stays at the same height.

An overflowing node holds **m keys**. When m is odd there is one middle key. When m is **even** there are two, and we promote the **left** one, the key at position ⌈m/2⌉. For order 4, `[10 | 20 | 30 | 40]` splits into `[10]`, with **20** moving up, and `[30 | 40]`. Both halves still have at least the minimum number of keys.
