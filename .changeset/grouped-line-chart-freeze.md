---
'@embeddable.com/remarkable-pro': patch
---

Fix browser freeze on grouped line charts when the data contains an outlier date far in the future: gap filling is now skipped when it would generate more than 20,000 buckets, and per-group value lookups are indexed instead of scanned.
