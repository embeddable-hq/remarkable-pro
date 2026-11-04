---
'@embeddable.com/remarkable-pro': minor
---

TableScrollable: render every loaded row when the dashboard asks for auto height.

The component now declares `meta.autoHeight`, so a host rendering with
`height-mode="auto"` lets its tile grow to the content instead of clipping it. In that mode the
table drops its 50-row scroll paging for a single query of `maxResults` rows with `countRows`,
replaces its rows on each response rather than appending, turns off the infinite-scroll prefetch,
and says "Showing N of M rows" when the allowance cut the query short. Fixed height is unchanged.
