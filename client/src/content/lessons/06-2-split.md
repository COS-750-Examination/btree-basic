Every B-tree has an order that limits how full a node can get. With order 3, a node holds at most 2 keys. Add a third and the node **overflows**: it splits around its **middle key**, and that middle key moves up to the parent.

> **Think of a shelf with room for two jars.** Put a third jar on it and the shelf splits in two. The middle jar goes up to the shelf above, so every shelf stays at the same height.
