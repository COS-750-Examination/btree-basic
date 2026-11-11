If **neither sibling can spare a key**, **merge**: the underflowing node, the **separating key** from the parent and one sibling join into a single node. The merged node never holds more than m − 1 keys.

The parent has lost a key, so it may underflow too. Fix it the same way, borrowing or merging, one level further up.

If the **root** loses its last key, its only child becomes the **new root**, and the tree gets **one level shorter, at the top**. This is the mirror image of a root split, so all leaves still stay on the same level.

In this order-3 tree, deleting 8 leaves the left leaf empty, and its sibling `[30]` has nothing to spare. The leaf, 20 and `[30]` merge into `[20 | 30]`. The root is now empty, so `[20 | 30]` becomes the root.
