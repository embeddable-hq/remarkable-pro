# Architecture Overview

This project follows a modular, scalable architecture that separates reusable components, theming, internationalization, and internal scripts. The structure prioritizes **maintainability**, **extensibility**, and **clean integration**.

# Project Structure

```
src
├── components
│   ├── component.inputs.constants.ts         > shared input definitions composed in each definition.ts
│   ├── component.subinputs.constants.ts      > shared sub-input definitions
│   ├── preview.data.constants.ts             > static preview data used in the editor canvas
│   ├── charts                                > chart components
│   │   ├── charts.utils.ts                   > shared utils across all chart groups
│   │   ├── pies                              > component group (only when multiple variants exist)
│   │   │   ├── pies.utils.ts                 > shared utils for the group
│   │   │   ├── pies.types.ts                 > shared types for the group (if needed)
│   │   │   ├── PieChartPro                   > component name
│   │   │   │   ├── index.tsx                 > react component
│   │   │   │   ├── definition.ts             > component logic (meta, props, events, data, preview)
│   │   │   │   └── PieChartPro.emb.ts        > SDK integration wrapper
│   │   │   └── DonutChartPro
│   │   │       └── ...                       > same as above
│   │   ├── bars
│   │   │   └── ...
│   │   └── shared                            > components reused across chart groups
│   │       └── ChartCard
│   │           ├── ChartCard.tsx
│   │           ├── ChartCard.test.tsx
│   │           └── ChartCard.module.css
│   ├── editors                               > editor / control components
│   │   ├── dates                             > date picker variants (grouped)
│   │   │   ├── dates.utils.ts
│   │   │   └── DateRangePickerPresetsPro
│   │   │       └── ...
│   │   ├── SingleSelectFieldPro
│   │   │   └── ...
│   │   └── shared                            > components reused across editors
│   │       └── EditorCard
│   │           └── ...
│   ├── shared                                > components shared across charts and editors
│   │   └── EmptyContainerPro
│   │       └── ...
│   ├── types                                 > embeddable type definitions
│   │   └── DisplayFormat.type.emb.ts
│   └── utils                                 > shared component-level utilities
│       └── timeRange.utils.ts
├── editors                                   > standalone editor components
│   └── ColorEditor
│       ├── index.tsx
│       ├── ColorEditor.emb.ts
│       └── Color.type.emb.ts
├── theme                                     > theme functionality
│   ├── theme.constants.ts                    > theme default values
│   ├── theme.types.ts
│   ├── defaults                              > predefined default configurations
│   │   └── defaults.GranularityOptions.constants.ts
│   ├── formatter                             > controls how data is displayed to end users
│   │   ├── formatter.constants.ts
│   │   ├── formatter.types.ts
│   │   └── formatter.utils.ts
│   ├── i18n                                  > internationalization
│   │   ├── i18n.ts                           > i18n setup (singleton)
│   │   └── translations
│   │       ├── en.ts
│   │       └── de.ts
│   ├── styles
│   │   ├── styles.constants.ts
│   │   ├── styles.types.ts
│   │   └── styles.utils.ts
│   └── utils
│       └── export.utils.ts
├── utils                                     > global utility functions
│   ├── array.utils.ts
│   ├── color.utils.ts
│   └── ...
├── types                                     > global TypeScript type declarations
│   └── ...
└── assets
    └── icons

embeddable.theme.ts                           > default theme using `/theme` properties
embeddable.lifecycle.ts                       > hook for applying theme updates to the DOM and others
```

**Embeddable components** (charts, editors) always include:

- `index.tsx`: Main React component file
- `definition.ts`: Component logic (meta, props, events, data loading, preview)
- `ComponentName.emb.ts`: SDK integration wrapper

**Shared components** only include what they need — typically `ComponentName.tsx` and optionally a test and CSS module.

All components may also include:

- `.test.tsx`: Unit tests
- `.types.ts`: Local types (if needed)
- `.utils.ts`: Local utilities (if needed)
- `.utils.test.ts`: Unit tests for utilities (if needed)
- `.hooks.ts`: React hooks (if needed)
- `.module.css`: Component-specific styles (CSS Modules)

---

# Components

Contains **pre-configured charts and controls**, ready to use out of the box. These are **not intended for direct import** when building custom UI.

- `charts`: Pre-built chart components (e.g., `PieChart`)
- `editors`: Pre-built editor/control components (e.g., `DateRangePicker`)

Each includes:

- `definition.ts`: The source of truth — all component logic (meta, props, events, data loading, preview)
- `.emb.ts`: Thin integration wrapper — re-exports `meta` and `preview`, default-exports `defineComponent`
- `index.tsx`: Default export for the React component

---

## The `definition.ts` / `.emb.ts` Pattern

Each embeddable component is split across two files: `definition.ts` and `ComponentName.emb.ts`. This separation keeps all logic testable and reusable while keeping the SDK integration point minimal.

### `definition.ts` — The source of truth

This file owns everything the component needs to function. It exports a single named `const` object (camelCase version of the component name) that groups all parts together.

**Structure:**

```ts
import { DataResponse, LoadDataRequest, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';

// 1. Meta — component identity, inputs, events, variables
const meta = {
  name: 'PieChartPro',
  label: 'Pie Chart',
  category: 'Pie Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    // ...
  ],
  events: [
    {
      name: 'onSegmentClick',
      label: 'A segment is clicked',
      properties: [{ name: 'dimensionValue', label: 'Clicked dimension', type: 'string' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

// 2. Preview config — static data used in the Embeddable editor canvas
const previewConfig = {
  dimension: previewData.dimension,
  measure: previewData.measure,
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

// 3. Data loading — pure functions that describe what data to fetch
const loadDataResultsArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure, inputs.dimension],
});

const loadDataResults = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsArgs(inputs));

// 4. Events — map raw UI values to Embeddable event payloads
const events = {
  onSegmentClick: (value: { dimensionValue?: string }) => ({
    dimensionValue: value.dimensionValue ?? Value.noFilter(),
  }),
};

// 5. Props — maps inputs (+ optional state) to what the React component receives
const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  results: loadDataResults(inputs),
});

// 6. Named export — everything grouped under one object
export const pieChartPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: { props, events },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
} as const;
```

**Key rules:**

- `meta` must use `as const satisfies EmbeddedComponentMeta` for full type inference downstream
- `inputs` are composed from shared constants in `component.inputs.constants.ts`; spread and override properties as needed (`{ ...inputs.fontSize, name: 'changeFontSize', label: 'Trend font-size' }`)
- `loadDataResultsArgs` and `loadDataResults` are always separate functions — `loadDataResultsArgs` is a pure function for testing and reuse; `loadDataResults` calls `loadData` with those args
- `props` receives `inputs` and optionally `[state, setState]` as a tuple when the component needs local state
- The exported object uses `as const` so all keys are read-only and types are fully inferred

### State

When a component needs local state (e.g. granularity selection, pagination, search), export a type for it from `definition.ts`:

```ts
export type BarChartDefaultProState = {
  granularity?: Granularity;
};
```

Then `props` receives the state tuple:

```ts
const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [BarChartDefaultProState, (state: BarChartDefaultProState) => void],
) => {
  // use state, call setState to update
  return { ...inputs, setGranularity: (g: Granularity) => setState({ granularity: g }) };
};
```

### Multiple data queries

Components that fire more than one `loadData` call (e.g. comparison KPIs, paginated tables) add additional `results*` keys to the exported object, each with their own `loadDataArgs` and `loadData` pair:

```ts
export const kpiChartNumberComparisonPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: { props },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  resultsComparison: {
    loadDataArgs: loadDataResultsComparisonArgs,
    loadData: loadDataResultsComparison,
  },
} as const;
```

### `ComponentName.emb.ts` — The integration wrapper

This file is intentionally minimal. Its only job is to wire the `definition.ts` exports into the Embeddable SDK:

```ts
import { defineComponent } from '@embeddable.com/react';
import { pieChartPro } from './definition';

export const preview = pieChartPro.preview;

export const meta = pieChartPro.meta;

export default defineComponent(pieChartPro.Component, meta, pieChartPro.config);
```

It always has this exact shape: three statements, nothing more.

### Why this split?

| Concern                                      | Where it lives                    |
| -------------------------------------------- | --------------------------------- |
| What the component is (name, inputs, events) | `definition.ts` → `meta`          |
| How it fetches data                          | `definition.ts` → `results.*`     |
| How it maps data to props                    | `definition.ts` → `config.props`  |
| How it handles events                        | `definition.ts` → `config.events` |
| What it looks like in the editor canvas      | `definition.ts` → `preview`       |
| Embeddable SDK registration                  | `*.emb.ts`                        |
| React rendering                              | `index.tsx`                       |

Keeping all logic in `definition.ts` means it can be imported by tests, by other components that share a definition, or by utilities — without pulling in the Embeddable SDK.

### Shared input constants

Inputs are defined once in `component.inputs.constants.ts` and composed in each `definition.ts`. Use spread to override individual properties:

```ts
// Use as-is
inputs.title

// Override a single property
{ ...inputs.fontSize, name: 'changeFontSize', label: 'Trend font-size' }

// Override and add properties
{ ...inputs.measures, inputs: [...inputs.measures.inputs, inputs.color] }
```

---

## Theme

Theme is split into 4 parts:

1. `formatter`: controls how the data is displayed to the end user
2. `i18n`: controls how the labels are displayed to the end user
3. `styles`: styles functionality
4. `utils`: utils used by the theme

## Types

Contains shared **global types** for the project.

**Note:** Component-specific types should live **inside the component** itself (`*.types.ts`), not in this folder.

## Extending the Library

### Adding a new component

1. Create a folder in `charts` or `editors`
2. Add:
   - `definition.ts` — all component logic (see pattern above)
   - `ComponentName.emb.ts` — the three-line SDK wrapper
   - `index.tsx` with the React component as the default export

## Best Practices

- Use strong typing with TypeScript across all files
- Maintain consistent folder and file naming
- Keep the `embeddable` components isolated and non-exported
- All component logic belongs in `definition.ts`; `*.emb.ts` must stay minimal
