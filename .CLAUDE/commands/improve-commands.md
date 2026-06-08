# update-commands.md

When this command runs, immediately ask:

1. What could we improve?
2. Which command is this related to? (if known)

Then proceed with the diagnosis process below.

---

Purpose

- Improve Claude command templates and context files using real execution feedback.
- Prevent the same mistake or omission from happening again.
- Keep commands minimal, correct, and aligned with how the codebase actually works.

This file applies to ALL custom commands in this workspace.

---

## What may be updated (in priority order)

1. The specific command template that was run
2. Repo-level CLAUDE.md
3. Workspace-level CLAUDE.md

Only update what is necessary. Prefer the smallest effective change.

---

## Hard rules

- Do NOT bloat commands or context files.
- Do NOT duplicate information that already exists in any CLAUDE.md.
- Stable, structural rules belong in CLAUDE.md.
- Command-specific behavior belongs in the command template.
- One-off issues should NOT become permanent rules.
- Prefer adding constraints or checklists over long explanations.
- Prefer referencing existing files or examples over embedding code.
- Never weaken existing constraints to “make it work”.

---

## Required input when running this process

The user must provide:

- Command used:
- Command intent (what the command is meant to do):
- What was expected:
- What actually happened:
- Evidence:
  - Error messages
  - Incorrect output
  - Diffs or file paths
- Root cause (best guess):
- Desired prevention:
  - What instruction, rule, or constraint would have avoided this?

If required input is missing, ask concise clarifying questions before proceeding.

---

## Diagnosis categories (choose one or more)

- Missing context or rule
- Ambiguous instruction
- Wrong pattern or example chosen
- Scope creep / overreach
- Workflow or environment mismatch
- State handling mismatch
- Repo boundary violation
- Duplicate work not detected
- Incorrect assumptions about build, export, or dependency flow

---

## Update process

1. Identify the failure mode
2. Decide where the fix belongs:
   - Command template
   - Repo CLAUDE.md
   - Workspace CLAUDE.md
3. Propose the smallest possible change
4. Ensure no duplication with existing context files
5. Produce exact text edits

---

## Output requirements

Output must include:

- Diagnosis
- Files to update (exact paths)
- Proposed edits:
  - Before / after snippets or exact insertion text
- Final updated content:
  - Only the sections that changed
  - Copy-pasteable
- Verification:
  - One short test prompt to validate the fix

Do NOT output full files unless explicitly requested.

---

## Success criteria

- The same failure should not happen again when the command is re-run.
- The command remains simple and readable.
- The rule or constraint is enforced consistently going forward.
