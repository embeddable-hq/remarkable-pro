---
'@embeddable.com/remarkable-pro': minor
---

Take `@embeddable.com/core` and `@embeddable.com/react` as peer dependencies.

The package compiles with those imports left external, so they were never meant to be a second
installed copy — but declaring them in `dependencies` let npm nest one whenever the host app's
range and this package's range disagreed. The SDK keeps its React contexts as module singletons, so
a nested copy hands the components a different context object: `useTheme()` falls back to its empty
default (`Cannot read properties of undefined (reading 'chartMenuOptions')`), and
`useEmbeddableLayout()` quietly reports `fixed` even on an auto-height dashboard. As peers they
resolve to whatever the host installed, and a genuine mismatch is reported at install time instead.

The ranges accept prereleases (`>=2.14.0-0`), so testing against an SDK `next` build no longer
needs an `overrides` entry in the host app.
