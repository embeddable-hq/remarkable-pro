# 02 — Navigate Embeddable

## Prerequisites

- The dev server must be running (Step 1 complete)
- `~/.embeddable/credentials` must exist (created automatically when `npm run embeddable:dev` runs)

## Step 1 — Open the workspace and click "Create Embeddable"

Run the following script, passing the workspace URL from Step 1:

```bash
node scripts/open-embeddable.js <workspace-url>
```

The script will:

1. Read the saved Playwright session from `.playwright-session.json` (if it exists)
2. Open the workspace page in a browser — already logged in
3. Find and click the "Create Embeddable" button
4. Wait for the new page to load
5. Print the new page URL to the terminal

## First Run Only

If no session file exists, the browser will open and ask you to log in manually. Once you reach the workspace page, the session is saved automatically. All subsequent runs will reuse it.

## Session Expired

If the session has expired, the script will detect it, delete the saved session file, and exit with an error. Re-run the script to log in again.

## Knowing When It's Ready

The script will print:

```
New page URL: https://...
```

Do not proceed until this line appears.
