---
'@embeddable.com/remarkable-pro': minor
---

Add `theme.defaults.weekStartsOn` to set the first day of the week for chart gap filling. Set it to `0` when the database week starts on Sunday (e.g. Snowflake `WEEK_START = 7`). Week click filters now cover 7 days from the clicked bucket, so they match the database week start.
