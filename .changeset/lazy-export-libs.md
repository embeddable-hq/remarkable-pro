---
'@embeddable.com/remarkable-pro': patch
---

Load the XLSX and PNG export libraries only when an export runs, instead of with every chart. `exportXLSX` now returns a promise.
