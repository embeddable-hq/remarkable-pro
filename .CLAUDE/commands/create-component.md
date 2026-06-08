If required fields are missing, ask concise clarifying questions before proceeding.

Component name:
<COMPONENT_NAME>

Component category:
<chart | control>

User-facing purpose (1 sentence):
<PURPOSE>

Primary interactions:

- <e.g. select, click, hover, drill, filter>
- <optional>

Reference components (read these and follow their patterns):

- <PATH_TO_EXISTING_COMPONENT_1> (.tsx + .emb)
- <PATH_TO_EXISTING_COMPONENT_2> (.tsx + .emb)

Constraints:

- Read CLAUDE.md. Do not restate it.
- Use remarkable-ui primitives; do not reimplement primitive logic in Pro.
- Match input `category` values from reference components (e.g., "Component Data", "Component Settings", "Pre-configured variables").
- If this is another version of an identical component (same purpose, inputs, outputs), STOP and report the existing component paths. Do not create anything.
- Charts and controls must use their respective background card components/patterns.
- Do not introduce new abstractions or dependencies unless explicitly requested.

State handling (must match existing components):

- Initial loading state (first data load)
- Updating state (data refresh caused by user interaction)
- Error state (query failure)
- Empty / no-data state (valid query returns no rows)

Select controls with `clearable` option:

- When `clearable=false` and no default, auto-select first option on mount
- Use a ref to ensure auto-select only runs once (props may not be ready on first render)
- Call `onChange` to pass auto-selected value back to Embeddable

Before coding:

1. Confirm whether an equivalent component already exists.
2. Identify required `.emb` inputs, events, and data configuration.
3. Identify required `.tsx` props and UI responsibilities.
4. List exact files to create or modify.

Output:

- Component summary
- Duplicate check result
- Files to create/change (with paths)
- `.emb` configuration outline
- `.tsx` responsibilities
- State handling approach
- Tests or docs to update

Stop after the plan and wait for approval.
