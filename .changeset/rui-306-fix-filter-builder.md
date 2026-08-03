---
'@embeddable.com/remarkable-pro': patch
---

FilterBuilderPro and FilterBuilderWithGroupingPro: fix `syncDefaultFilters` not re-applying a previously adopted `defaultFilters` value after the filter list was cleared. Deleting the last filter emits `null`, which was leaving stale adoption state behind — so pushing the same clause back in from the host was silently ignored. The host can now revert to or re-push a filter set after it's been cleared, and it will be re-applied as expected.
