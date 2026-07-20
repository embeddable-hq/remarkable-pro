---
'@embeddable.com/remarkable-pro': patch
---

FilterBuilderPro and FilterBuilderWithGroupingPro now adopt host-driven changes to `defaultFilters` after mount (e.g. switching between or resetting saved filter sets), instead of only seeding once. The component's own onChange echo and null/undefined values are ignored so in-progress edits are preserved; a well-formed empty clause resets the filters.
