# Create a New Component

When asked to create a component, **always stop first** and present the following 5 experiment options to the user before writing any code:

---

## Which flow would you like to follow?

1. **No context**
   - Follow instructions in `.claude/experiments/1-no-context.md`

2. **With identification & clarity but no context**
   - Follow instructions in `.claude/experiments/2-clarity-no-context.md`

3. **With identification & clarity with context without guidance**
   - Follow instructions in `.claude/experiments/3-clarity-repo-context-no-guidance.md`

4. **With identification & clarity with context with guidance**
   - Follow instructions in `.claude/experiments/4-clarity-repo-context-with-guidance.md`

5. **With identification & clarity with context with guidance on different component types**
   - Follow instructions in `.claude/experiments/5-clarity-repo-context-with-guidance-and-fixes.md`

---

> Wait for the user to choose an option by replying with its number, then read the corresponding file and follow its instructions exactly before proceeding.

---

After the component is created, pause and ask the user to run `/context` to log the current token usage. Wait for the user to confirm before continuing to Step 2.

<!-- ## Step 2 — Audit the new component

Run the design system audit on the component folder created in Step 1.

```
/design-system-audit audit {path/to/NewComponentFolder}
```

The audit result is for documentation purposes only. Do not fix or act on any findings. -->

## Step 2 — Start the dev server

Read `.claude/01-dev-server.md`.
Run the dev server and wait for it to be ready.

# Step 3 — Navigate the Embeddable UI

Read `.claude/02-navigate-embeddable.md`.

Before running the script, extract the `meta.label` value from the component
created in Step 1 and pass it as the `<component-name>` argument.

Run the script and wait for the new page to load.
