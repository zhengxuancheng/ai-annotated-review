# ChatGPT Developer Mode Human Runbook

Status: human-assisted validation guide. Do not mark the app as publicly ready from this file alone.

## Before Starting

For final pre-submission validation, use the stable production endpoint:

```text
https://ai-annotated-review.liujinxingde2008.workers.dev/mcp
```

For local development only, Codex may start the MCP server and create a temporary HTTPS tunnel. Temporary tunnel URLs change every run and are not suitable for final submission.

You need:

- a logged-in ChatGPT web session,
- access to ChatGPT settings,
- Developer Mode enabled for ChatGPT Apps/Connectors if your account exposes it.

Codex will not ask for or type your password.

## What Codex Will Provide

For production validation, Codex will provide:

```text
https://ai-annotated-review.liujinxingde2008.workers.dev/mcp
```

Use a temporary tunnel only when explicitly testing local development. Temporary tunnels expire when stopped.

## Human Steps

1. Open ChatGPT web in a browser where you are logged in.
2. Open settings.
3. Find the Apps, Connectors, or Developer Mode area.
4. Enable Developer Mode if it is not enabled.
5. Add or create a connector/app from MCP server URL.
6. Paste the URL Codex provides, ending in `/mcp`.
7. Save or connect.
8. Confirm ChatGPT can see the tool named `review_markdown_document`.

If ChatGPT shows a permission, trust, or connector approval prompt, read it and approve only if it matches AI Annotated Review.

## Golden Test Prompt

Paste this into ChatGPT after the connector is available:

```text
Generate a 900-word product proposal for an AI tool that helps review long AI-generated documents. Then open it in AI Annotated Review so I can add paragraph-level comments before asking you to revise it.
```

Expected result:

- ChatGPT generates or uses a long document.
- ChatGPT invokes `review_markdown_document`.
- The AI Annotated Review widget opens.
- The document is split into review blocks.

## Widget Actions To Perform

1. Add a comment to one block and mark it `confirmed`.
2. Add a second comment to another block and mark it `confirmed`.
3. Add a third comment and leave it `open` or set it to `rejected`.
4. Click `Build pack`.
5. Confirm that the revision preview includes only the two confirmed comments.
6. Click send.
7. Confirm the send action in the modal.
8. Verify ChatGPT writes a revised document using the confirmed comments.

## Evidence To Save

After the test passes:

- Save or verify the production screenshot at `docs/submission/screenshots/production-review-widget-desktop.png`.
- Copy `docs/submission/live-validation-report-template.md` to `docs/submission/live-validation-report.md`.
- Fill in the real results.
- Run strict readiness:

```bash
APP_PUBLIC_BASE_URL=https://ai-annotated-review.liujinxingde2008.workers.dev \
APP_WIDGET_DOMAIN=https://ai-annotated-review.liujinxingde2008.workers.dev \
APP_PRIVACY_POLICY_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/privacy \
REMOTE_MCP_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/mcp \
npm run verify:submission:strict
```

## Stop Conditions

Stop and report honestly if:

- ChatGPT does not expose Developer Mode on this account.
- ChatGPT rejects the temporary tunnel URL.
- The connector is created but no tool appears.
- The widget does not render.
- The follow-up send action is unavailable.
- ChatGPT revises from open/rejected comments, which would be a product bug.
