---
'@embeddable.com/remarkable-pro': minor
---

Add "Limit top group by" bucketing (server-ranked, with an "Other" bucket) to BarChartGroupedPro, BarChartGroupedHorizontalPro, BarChartStackedPro, BarChartStackedHorizontalPro, and LineChartGroupedPro. Ranks the groupBy dimension by total measure contribution and folds everything past the limit into a single "Other" series, independent of any x/y-axis limiting. Limited to sum/count measures.
