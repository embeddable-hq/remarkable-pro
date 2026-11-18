---
'@embeddable.com/remarkable-pro': patch
---

The `onBarClicked` and `onLineClicked` payload types now include an optional `measureValues`, which the default bar and line click handlers already pass. The comparison line chart still passes `measureValue` only.
