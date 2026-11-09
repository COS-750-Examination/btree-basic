B-trees and their variants (especially the **B+ tree**) are the index structure behind most relational databases, such as PostgreSQL and MySQL, and many file systems, such as NTFS, ext4 and APFS.

Each node is sized to one disk page, so finding a row among millions takes only a few page reads.
