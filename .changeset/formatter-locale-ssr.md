---
'@embeddable.com/remarkable-pro': patch
---

The theme formatter no longer reads `navigator.language` at import time, which throws on Node before 21 and on some edge runtimes. Without a navigator it falls back to `en-US`.
