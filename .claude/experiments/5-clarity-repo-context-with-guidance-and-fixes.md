# Flow 5 — Identification & Clarity, Repo Context with guidance and fixes

## Step 1 — Identify the Component

Review what the user has asked for. If the component's **purpose or behavior** is unclear or ambiguous, ask targeted questions before proceeding. Only ask what is truly needed — do not ask about things that are already evident from the request.

Agent needs to be able to identify the component and its type. Existing type:

- **charts** - components that display data
- **editors** - component that collect user feedback
- **shared** - components that decorative

Questions to ask when unclear:

- What is this component supposed to do?
- What does the user interact with, and what happens as a result?

> Do not ask about props, styling, or file location at this stage.
> Once the purpose and behavior are clear, move to Step 2.

---

## Step 2 — Scan the Repo with guidance

Before writing any code, and taken into consideration the component and its type, scan the existing codebase to understand how components of that type are built in this project:

The existing component types and their location:

- **charts** - (src/components/charts)
- **editors** - (src/components/editors)
- **shared** - (src/components/shared)

Concepts to understand within type:

- **Component structure** — how files and folders are organized per component
- **Naming conventions** — file names, component names, variable names
- **Styling approach** — CSS modules, Tailwind, styled-components, etc.
- **Patterns** — how props are defined, how state is managed, how components are exported
- **Reused primitives** — any shared components, hooks, or utilities commonly used
- **Configuration** — how the legends, tooltips, and others sub-components are specifed.

> Do not skip or summarize this step. Read actual files — do not infer from memory.

---

## Step 3 — Confirm with a Summary

Present a short summary for the user to confirm before writing any code:

```
📋 Component Summary
- Name: [ComponentName]
- Purpose: [What it does]
- Behavior: [How it works / key interactions]
- States: [Any relevant states, if applicable]

📂 Patterns found in repo
- Structure: [e.g. one folder per component with index.ts + Component.tsx]
- Styling: [e.g. Tailwind utility classes]
- Conventions: [e.g. named exports, props interface defined inline]

Reply with the number of your choice:
1 — Looks good, proceed
2 — I want to change something
```

> Do not proceed until the user confirms.

---

## Step 4 — Create the Component

Build the component strictly following the patterns found in Step 2 and confirmed in Step 3.
