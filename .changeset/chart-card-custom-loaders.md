---
'@embeddable.com/remarkable-pro': minor
---

Add `theme.components.ChartCardSkeleton` and `theme.components.ChartCardLoading` to replace the default ChartCard loaders (first-load skeleton and reload/export spinner). Each is a render function that receives the library's React instance, so themes can build loaders (including hooks) without importing React: `ChartCardLoading: ({ createElement: h }) => h('div', { className: 'my-spinner' })`.
