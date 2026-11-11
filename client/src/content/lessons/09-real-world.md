B-trees and their variants are the index structure behind most relational databases, such as PostgreSQL and MySQL, and many file systems, such as NTFS, APFS and Btrfs.

Each node is sized to one disk page, so finding a row among millions takes only a few page reads.

Most databases use a **B+ tree**. It keeps every record in the **leaves**, and links the leaves together in order, so a range query such as "all marks from 50 to 60" can walk along the leaves. The internal nodes only guide the search.
