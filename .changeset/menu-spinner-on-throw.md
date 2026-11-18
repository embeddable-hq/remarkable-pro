---
'@embeddable.com/remarkable-pro': patch
---

Fix the chart card menu staying on its loading spinner when a menu option's `onClick` throws. The menu button now comes back, as it already did when `onClick` returned a rejected promise. The error is still thrown.
