---
'@embeddable.com/remarkable-pro': minor
---

TableScrollable: render every loaded row when the dashboard asks for auto height.

The component now declares `meta.autoHeight`, so a host rendering with
`height-mode="auto"` lets its tile grow to the content instead of clipping it. In that mode the
table drops its 50-row scroll paging for a single query with `countRows`, replaces its rows on each
response rather than appending, turns off the infinite-scroll prefetch, and says "Showing N of M
rows" when the allowance cut the query short. Fixed height is unchanged.

How many rows it loads when expanded is a new input of its own, **Max rows when expanded**
(`autoHeightMaxResults`, default 100). It is deliberately not the existing **Max results to
download**: that one sizes the CSV/XLSX export, and the two are worth tuning separately — a
reader will want far fewer rows on a page than in a spreadsheet.
