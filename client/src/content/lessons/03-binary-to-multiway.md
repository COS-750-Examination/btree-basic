A B-tree node can hold **several keys**, kept in sorted order.

A node with **k keys** has **k + 1 children**. Each child holds the keys that fall **between two neighbouring keys** of its parent.

For the node `[20 | 40]`:

| child | holds keys        |
| ----- | ----------------- |
| 1st   | smaller than 20   |
| 2nd   | between 20 and 40 |
| 3rd   | larger than 40    |
