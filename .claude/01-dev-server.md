# 01 — Dev Server

## Prerequisites

Chrome must be running with remote debugging enabled before starting the dev server. If it's not already open, run:

```bash
npm run chrome:debug
```

## Starting the Server

Run the following command from the project root:

```bash
npm run embeddable:dev > /tmp/embeddable-dev.log 2>&1 &
```

Then wait for the server to be ready:

```bash
sleep 15 && grep -i "Preview workspace is available at" /tmp/embeddable-dev.log || cat /tmp/embeddable-dev.log
```

## Knowing When It's Ready

The server is ready when you see a line starting with:

```
Preview workspace is available at
```

Extract the full URL that follows — this is your workspace URL for this session. Do not proceed until this line appears.

## Stopping the Server

```bash
kill $(cat /tmp/embeddable-dev.pid)
```

## Troubleshooting

- **No output in log** — ensure you are running from the project root where `package.json` lives
- **Page blank or errors** — wait a few seconds and retry; the server may still be compiling
