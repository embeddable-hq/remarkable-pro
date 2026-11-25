---
'@embeddable.com/remarkable-pro': patch
---

Fix TableScrollable showing its first page twice under React StrictMode (dev builds). The row effect now skips a re-run for the response it has already shown.
