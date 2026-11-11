If a leaf drops below the minimum, it **underflows**. First, look at its **immediate siblings**. If one holds **more than the minimum**, borrow through the parent:

1. The **separating key** in the parent moves **down** into the underflowing node.
2. The sibling's **nearest key** moves **up** to take its place.

We check the left sibling first, then the right. In this order-3 tree, deleting 8 leaves the left leaf empty. The right sibling `[28 | 30]` can spare a key, so 20 comes down and 28 goes up:

`[20]` over `[8]` and `[28 | 30]` becomes `[28]` over `[20]` and `[30]`.

> **Think of two shelves under one label.** One shelf is empty, so a jar slides across, but it has to pass through the label above to keep everything in order.
