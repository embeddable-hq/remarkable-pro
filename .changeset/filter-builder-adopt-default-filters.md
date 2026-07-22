---
'@embeddable.com/remarkable-pro': patch
---

FilterBuilderPro and FilterBuilderWithGroupingPro get a new opt-in **Track default filters** (`syncDefaultFilters`) setting. When enabled, the filter tracks host-driven changes to its bound `defaultFilters` after mount — so the host can update or reset it at runtime (e.g. switching between or reverting to saved filter sets) without remounting the embed. The component's own onChange echo and null/undefined values are ignored so in-progress edits are preserved, and a well-formed empty clause resets the filters. When disabled (the default), behaviour is unchanged: `defaultFilters` only seeds the initial value.
