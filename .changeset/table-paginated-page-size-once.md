---
'@embeddable.com/remarkable-pro': patch
---

Fix the paginated table reporting its page size to the host on every render when `setState` is an inline function. Each page size is now reported once.
