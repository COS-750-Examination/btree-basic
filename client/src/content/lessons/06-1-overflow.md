New keys always go into a **leaf**, in sorted order. First we search for the leaf where the key belongs, exactly like a normal search.

If the leaf has room, we are done. With **order 3**, a node holds at most **2 keys**. Adding a third key makes the node **overflow**.
