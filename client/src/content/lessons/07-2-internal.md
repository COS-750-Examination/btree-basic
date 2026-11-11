A key in an **internal node** separates two subtrees, so we cannot simply pull it out. Instead we swap in its **predecessor**: the **largest key in its left subtree**.

To find it, step into the child to the **left** of the key, then keep taking the **rightmost** child until you reach a leaf. Its last key is the predecessor. It moves up to replace the deleted key and is removed from its leaf.

Every key in the left subtree is smaller than the predecessor, and every key in the right subtree is larger, so the order still holds. The deletion has become a **deletion from a leaf**.

> Some textbooks use the **successor** (the smallest key in the right subtree) instead. Both work. This app and its visualiser use the predecessor.
