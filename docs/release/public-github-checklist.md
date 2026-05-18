# Public GitHub Checklist

Status: release-prep checklist for the public source repository. This is separate from OpenAI app approval.

## Repository

- Target owner: `zhengxuancheng`
- Target repository name: `ai-annotated-review`
- Target visibility: public
- License: Apache-2.0
- Default branch: `main`

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

- The app is an open-source ChatGPT Apps SDK project.
- The first target is desktop ChatGPT.
- The app renders an embedded review widget.
- The app does not modify native ChatGPT message bubbles.
- The app is not OpenAI-approved until dashboard approval happens.
- Future adapters are roadmap items, not current v1 support.

## Do Not Publish

- Secrets, tokens, API keys, Cloudflare local state, or `.wrangler` cache.
- `node_modules`, generated `dist`, generated `dist-types`, or `*.tsbuildinfo`.
- Private documents or user data.
- Patentability or novelty claims beyond the cautious notes in `docs/ip/patentability-notes.md`.
