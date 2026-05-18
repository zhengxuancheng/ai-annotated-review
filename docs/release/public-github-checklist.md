# Public GitHub Checklist

Status: public source repository created. This is separate from OpenAI app approval.

## Repository

- Target owner: `zhengxuancheng`
- Target repository name: `ai-annotated-review`
- Target visibility: public
- License: Apache-2.0
- Default branch: `main`
- Repository URL: `https://github.com/zhengxuancheng/ai-annotated-review`
- Created and pushed: 2026-05-18

## Required Files

- [x] `README.md`
- [x] `LICENSE`
- [x] `CONTRIBUTING.md`
- [x] `SECURITY.md`
- [x] `SUPPORT.md`
- [x] `CODE_OF_CONDUCT.md`
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [x] `.github/ISSUE_TEMPLATE/bug_report.yml`
- [x] `.github/ISSUE_TEMPLATE/feature_request.yml`
- [x] `.github/ISSUE_TEMPLATE/adapter_proposal.yml`

## Pre-Push Checks

Current pre-push status on 2026-05-18:

- [x] `npm run verify:reality`
- [x] `npm run verify:license`
- [x] `npm run verify:submission:strict` with production environment variables
- [x] `npm run verify` with Node v24.14.0

Command reference:

```bash
npm run verify:reality
npm run verify:license
APP_PUBLIC_BASE_URL=https://ai-annotated-review.liujinxingde2008.workers.dev \
APP_WIDGET_DOMAIN=https://ai-annotated-review.liujinxingde2008.workers.dev \
APP_PRIVACY_POLICY_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/privacy \
REMOTE_MCP_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/mcp \
npm run verify:submission:strict
```

Run the full gate with Node 22+:

```bash
npm run verify
```

## Public Claims To Preserve

- The app is an open-source companion workflow for reviewing long AI outputs.
- Current practical targets are public web app, Chrome side panel extension, and CLI adapter.
- The ChatGPT Apps SDK adapter is a technical preview.
- The app renders its own review surface.
- The app does not modify native ChatGPT or Claude message bubbles.
- The browser extension imports selected text only.
- The app is not OpenAI-approved until dashboard approval happens.
- Claude Desktop MCPB, VS Code/Cursor, and deeper Codex/Claude skills are roadmap items, not current v1 support.

## Completed GitHub Actions

- [x] Created public GitHub repository `zhengxuancheng/ai-annotated-review`.
- [x] Pushed local `main` branch.
- [x] Set repository description.
- [x] Set repository topics: `chatgpt-apps-sdk`, `mcp`, `markdown`, `annotation`, `ai-tools`, `open-source`.

## Do Not Publish

- Secrets, tokens, API keys, Cloudflare local state, or `.wrangler` cache.
- `node_modules`, generated `dist`, generated `dist-types`, or `*.tsbuildinfo`.
- Private documents or user data.
- Patentability or novelty claims beyond the cautious notes in `docs/ip/patentability-notes.md`.
