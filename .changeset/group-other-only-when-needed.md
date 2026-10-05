---
'@embeddable.com/remarkable-pro': patch
---

Only show the "Other" group in the grouped line chart and grouped/stacked bar charts when there are more groups than the configured limit. Previously "Other" always appeared (as an all-zero series when nothing was left to bucket), and exactly-at-limit data bucketed a single group into "Other" instead of showing it.
