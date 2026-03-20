# Skill: Design System Compliance Audit

## Description

Scans the repo once to infer real design system patterns, caches them, then uses that cache as the benchmark to audit any component folder on demand.

---

## Scoring Rubric

| Score | Label                    | Meaning                                                                         |
| ----- | ------------------------ | ------------------------------------------------------------------------------- |
| **1** | ❌ Ignores design system | Hardcoded values, wrong tokens, wrong file structure vs repo conventions        |
| **2** | ⚠️ Partially follows     | Some patterns match, some deviate from what the repo establishes                |
| **3** | ✅ Fully compliant       | Matches the token usage, naming, structure and conventions seen across the repo |

---

## Phase 1 — Repo Scan & Cache (runs once)

### When to run Phase 1

- If `.claude/design-system-cache.json` does **not** exist → run Phase 1 automatically before any audit
- If the user explicitly says "rescan repo" or "refresh cache" → re-run Phase 1
- Otherwise → skip to Phase 2 and load the cache

### How to scan

1. Look inside exactly these two directories:
   - `src/components/charts`
   - `src/components/editors`
2. Inside each, find **all** subfolders whose name ends with `Pro` (e.g. `BarChartPro`, `RichEditorPro`). Collect every one of them from both directories — no limit.
3. From those files, infer and extract the following patterns:

#### Token patterns to extract

- **Color tokens**: What format are colors referenced in? (e.g. `theme.colors.x`, `var(--color-x)`, `tokens.color.x`, design system import aliases)
- **Spacing tokens**: How is spacing referenced? (e.g. `theme.spacing.x`, `space.x`, `var(--spacing-x)`)
- **Typography tokens**: How are font sizes, weights, line heights referenced?
- **Breakpoint tokens**: How are responsive breakpoints defined?
- **Any other token categories** found consistently across files

#### Naming conventions to extract

- Component export style in `index.ts` (named vs default, re-export pattern)
- Props interface naming pattern (e.g. `{Name}Props`, `I{Name}Props`)
- Styled/emb file naming pattern (e.g. `{Name}.emb.ts`, `{Name}.styled.ts`)
- Definition file structure (what is exported, in what order)

#### File structure conventions to extract

- Which files are always present in a component folder
- Which files are optional and under what conditions
- Import ordering or grouping patterns if consistent

4. Write the extracted patterns to `.claude/design-system-cache.json` in this format:

```json
{
  "scanned_at": "ISO timestamp",
  "components_sampled": ["path/to/CompA", "path/to/CompB"],
  "patterns": {
    "tokens": {
      "colors": "description of how colors are referenced, with real examples from the repo",
      "spacing": "description with examples",
      "typography": "description with examples",
      "breakpoints": "description with examples",
      "other": "any other token patterns found"
    },
    "naming": {
      "index_export": "description with example",
      "props_interface": "description with example",
      "emb_file": "description with example",
      "definition_file": "description with example"
    },
    "file_structure": {
      "required_files": ["list of files always present"],
      "optional_files": ["list of files sometimes present"],
      "notes": "any structural observations"
    }
  },
  "raw_examples": {
    "good_token_usage": ["up to 5 real code snippets showing correct token usage"],
    "file_structure_example": "one real index.ts or definition.ts as a reference"
  }
}
```

5. Tell the user:
   > "✅ Repo scan complete. Sampled all `Pro` components from `src/components/charts` and `src/components/editors`. Cache saved to `.claude/design-system-cache.json`. Ready to audit."

---

## Phase 2 — Component Audit

### Trigger

User says something like:

> "Audit `src/components/MyButton`"
> "Run the design system audit on `src/components/MyButton`"

### Step 1 — Load the cache

Read `.claude/design-system-cache.json`. This is the source of truth for what "correct" looks like.

### Step 2 — Read the target folder

List and read all files inside the given component folder.

### Step 3 — Evaluate each file

For every file, compare it against the **cached patterns** — not generic rules. Ask:

- Do token references match the format the repo actually uses?
- Does naming follow the exact conventions seen in sampled components?
- Is the file structure consistent with what the repo establishes as required/optional?
- Are there hardcoded values where the repo consistently uses tokens?

#### Per file-type focus:

**`index.ts`**

- Export pattern matches `patterns.naming.index_export`
- No style-related logic leaking in

**`*.emb.ts` / styled file**

- All color, spacing, typography, breakpoint references match `patterns.tokens.*`
- No raw hex, rgb, rgba, px values where the repo uses tokens

**`definition.ts`**

- Component name matches folder name (PascalCase)
- Props interface matches `patterns.naming.props_interface`
- Exported members match what the repo convention establishes

**Other files**

- No design values hardcoded in logic/util files
- Import patterns consistent with the repo

### Step 4 — Score each file

- **3** → matches repo patterns fully, no deviations
- **2** → mostly matches but has 1–2 deviations (e.g. one hardcoded value, slightly off naming)
- **1** → does not follow repo patterns — wrong token format, hardcoded values throughout, wrong naming or missing required files

### Step 5 — Calculate overall score

`overall = average of all file scores, rounded to nearest whole number`

### Step 6 — Output

```
## 📦 Component: {FolderName}
**Overall Score: {score}/3 — {label} {emoji}**

---

### File Breakdown

| File | Score | Notes |
|------|-------|-------|
| index.ts | 3 ✅ | Export matches repo convention |
| Button.emb.ts | 2 ⚠️ | Uses spacing tokens but `#FF0000` should be `theme.colors.error` (per repo pattern) |
| definition.ts | 1 ❌ | Props interface named `BtnProps` — repo uses `ButtonProps` |

---

### Issues Found
- `Button.emb.ts` ~line 12: Replace `#FF0000` → `theme.colors.error` (matches how ErrorBanner, Tag use it)
- `definition.ts`: Rename `BtnProps` → `ButtonProps` to match repo convention

### What's Done Well
- Token usage in spacing and typography is consistent with the repo
- File structure matches required files convention
```

---

## Commands Summary

| What you say                | What happens                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| `audit {path/to/Component}` | Runs Phase 2 (auto-runs Phase 1 first if no cache exists)                     |
| `rescan repo`               | Re-runs Phase 1 and overwrites the cache                                      |
| `show me the cache`         | Prints a summary of inferred patterns from `.claude/design-system-cache.json` |

---

## Notes

- The cache is the benchmark. If the repo has inconsistencies across components, score against the **majority pattern**
- Never invent conventions — only score against what was actually observed in the repo
- If a file is missing that the repo always includes, score it as **1** and flag it as absent
- If a component folder has files not seen in the repo, treat them as neutral (don't penalise, but note them)
