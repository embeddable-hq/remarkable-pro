# Flow 3 — Identification & Clarity, Repo Context no guidance

## Step 1 — Identify the Component

Review what the user has asked for. If the component's **purpose or behavior** is unclear or ambiguous, ask targeted questions before proceeding. Only ask what is truly needed — do not ask about things that are already evident from the request.

Questions to ask when unclear:

- What is this component supposed to do?
- What does the user interact with, and what happens as a result?

> Do not ask about props, styling, or file location at this stage.
> Once the purpose and behavior are clear, move to Step 2.

---

## Step 2 — Scan the Repo with no guidance

Before writing any code, thoroughly scan the existing codebase to understand how components are built in this project.

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
