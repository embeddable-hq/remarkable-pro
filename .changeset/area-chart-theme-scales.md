---
'@embeddable.com/remarkable-pro': patch
---

Fix the area chart losing its stacking when the theme's `areaChartPro.options` sets `scales`. Theme options are now deep-merged with the chart's own options.
