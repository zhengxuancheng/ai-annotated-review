# Verification Report

Date: 2026-05-18
Latest audit refresh: 2026-05-18 13:10 CST

## Commands Run

```bash
npm install
npm test
npm run typecheck
npm run build
npm run verify
npm run capture:screenshots
npm run verify:submission:local
npm run verify:submission:strict
npm run smoke:container
npm run smoke:remote
npm run verify:functionality
npm run verify:deployment-config
npm run verify:worker
npm run build -w @ai-annotated-review/chatgpt-app-cloudflare-worker
npm audit --audit-level=moderate
ChatGPT web Developer Mode manual validation
macOS screencapture attempt for production screenshot
Visual check of production ChatGPT connector screenshot
PATH="/Users/liujinxing/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm_config_prefix="/Users/liujinxing/.npm-codex-node24" npm run verify
APP_PUBLIC_BASE_URL=https://ai-annotated-review.liujinxingde2008.workers.dev APP_WIDGET_DOMAIN=https://ai-annotated-review.liujinxingde2008.workers.dev APP_PRIVACY_POLICY_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/privacy REMOTE_MCP_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/mcp npm run verify:submission:strict
Public GitHub release-prep checks
```

Results:

- `npm install`: completed, 0 vulnerabilities.
- `npm test`: 4 test files passed, 10 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed, including Cloudflare Worker dry-run bundling.
- `npm run verify`: passed. It now runs unit tests, typecheck, build, MCP smoke, UI smoke, license scan, reality checks, and local submission-readiness checks.
- `npm run verify:functionality`: passed. It proves parse -> stable blocks -> annotate -> export/import -> confirmed-only revision pack -> MCP/tool/UI smoke.
- `npm run verify:deployment-config`: passed.
- `npm run verify:worker`: passed.
- `npm run build -w @ai-annotated-review/chatgpt-app-cloudflare-worker`: passed; Wrangler dry-run reported total upload size and exited normally.
- Local Cloudflare Worker smoke passed with `REMOTE_MCP_URL=http://127.0.0.1:8790/mcp REMOTE_MCP_ALLOW_HTTP=1 npm run smoke:remote`.
- `npm audit --audit-level=moderate`: completed, 0 vulnerabilities.
- `npm run capture:screenshots`: passed and created `docs/submission/screenshots/review-widget-desktop.png`.
- `npm run verify:submission:local`: passed with release-blocker warnings.
- `npm run verify:submission:strict` with production environment variables: passed after the Apache-2.0 license update and production screenshot capture; warnings and blockers were both empty.
- `npm run smoke:container`: not completed because Docker CLI was installed but the local Docker daemon was not reachable.
- `npm run smoke:remote`: passed against stable Cloudflare Worker endpoint `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp` and saved `docs/submission/remote-smoke-report.json`.
- ChatGPT web Developer Mode manual validation: passed for the golden loop on the same stable Cloudflare Worker endpoint; recorded in `docs/submission/live-validation-report.md`.
- Production screenshot: `docs/submission/screenshots/production-review-widget-desktop.png` now exists and was visually checked. It shows ChatGPT web with connector `AI Annotated Review Production`, the embedded review widget, three annotations, two confirmed annotations, and a generated revision pack.
- Apache-2.0 `LICENSE` is present by owner decision.
- `npm run verify`: passed when run under Codex's bundled Node v24.14.0. The shell default Node v20.20.2 is below the repo's declared Node >=22 requirement and fails Wrangler dry-run; this is an environment-version issue, not a source failure.
- `npm run verify:reality`: passed after updating the old license-pending guard to require Apache-2.0 consistency and to skip generated caches.
- Public GitHub release-prep checks: `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, issue templates, PR template, repository metadata, and `docs/release/public-github-checklist.md` were added; `npm run verify`, `npm run verify:reality`, `npm run verify:license`, and strict submission readiness passed after these changes.
- Package-lock scan found no GPL, LGPL, or AGPL license strings after removing `wrangler` as a committed devDependency.

## Skill-Driven Audit Refresh

Skills applied:

- `apps-sdk-builder`
- `annotation-review-workflow`
- `reality-checker`
- `test-and-verify`

Scope checked:

- 72 repo files excluding `node_modules`, `dist`, `dist-types`, and coverage output.
- 39 source/config/script files under `apps`, `packages`, and `scripts`, excluding generated build output.
- Core annotation model, Markdown parser, review-core, revision prompt builder, Apps SDK server, widget bridge, React UI, smoke scripts, Docker/deployment config, and public docs.

Issues fixed during this refresh:

- Revision prompt builder now rejects empty status selections and too-small prompt budgets.
- Widget asset HTML generation now fails on missing exact build assets and escapes embedded script/style closing tags.
- Widget bridge RPC requests now time out instead of leaving unresolved promises.
- Widget state restoration now validates restored annotations/status filters and filters stale block IDs.
- Confirmed send is guarded against duplicate sends while a send is in flight.
- Export filenames are sanitized and object URLs are revoked after click dispatch.
- Review blocks are keyboard-selectable.
- Server environment parsing now validates ports and HTTPS production URLs.
- Smoke scripts now validate ports, avoid tight retry loops, and use stable incremental RPC IDs.
- Public docs no longer publish exact GitHub star metrics, and `verify:reality` now blocks new exact star-count claims.
- Remote release smoke now checks public/tunnel MCP endpoints for `/health`, `/privacy`, `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, tool annotations, `outputSchema`, widget CSP metadata, and widget domain metadata.
- Cloudflare Worker adapter now reuses the shared MCP app server, serves `/mcp`, `/health`, and `/privacy`, and derives widget domain from the deployed request origin by default.
- A license regression from `wrangler` as a devDependency was caught and fixed by switching to pinned `npx wrangler@4.92.0`.
- Strict submission readiness now requires a real remote smoke report and a filled `Status: passed` live ChatGPT developer-mode validation report.
- Functional claim verification now emits evidence for eight product claims, including confirmed-only pack behavior and user-confirmed send behavior.

## MCP Smoke Tests

Server command:

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

Verified:

- `initialize` returned server info for `ai-annotated-review`.
- `tools/list` returned `review_markdown_document`.
- Tool annotations were present: `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`.
- `tools/call` with a Markdown fixture returned `structuredContent.ok: true`.
- Full review session appeared in `_meta.reviewSession`.
- `resources/list` returned widget resource with `text/html;profile=mcp-app`.
- `resources/read` returned inline HTML with CSP metadata.
- `/health` returned `ok: true`.
- `/privacy` served the draft privacy policy route.
- Widget resource metadata honored `APP_WIDGET_DOMAIN` during smoke.

## UI Smoke Test

Tooling:

- `playwright-core` against local Google Chrome.
- Local Vite preview at `http://127.0.0.1:5173/`.

Verified desktop flow:

- Loaded widget.
- Added 3 annotations.
- Marked 2 annotations as `confirmed`.
- Marked 1 annotation as `rejected`.
- Built revision pack.
- Revision pack included the 2 confirmed annotations.
- Revision pack excluded the rejected annotation.
- Send action required confirmation modal.
- Revision pack can be exported as Markdown.
- Modal content matched revision pack preview.
- The automated `smoke:ui` script now checks the same flow and confirms `Export pack` is available.
- Confirmed send degraded to local-preview fallback because no ChatGPT host bridge was present.
- No browser console errors in the final smoke pass.

## ChatGPT Developer Mode Evidence

Verified on 2026-05-18 in ChatGPT web Developer Mode using `AI Annotated Review Production` connected to `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp`:

- ChatGPT discovered `review_markdown_document` from the public `/mcp` endpoint.
- ChatGPT rendered `ui://ai-annotated-review/review-widget-v2.html` inside the Apps iframe.
- The widget opened a 7-block document.
- Selecting paragraph blocks updated the right-side selected-block panel correctly.
- Three annotations were added to three blocks.
- Two annotations were set to `confirmed`; one was set to `rejected`.
- The revision pack showed 2 confirmed instructions and excluded the rejected annotation.
- `Send revision request` required an explicit `Confirm send` modal.
- After the user confirmed, the widget showed `Revision request sent.`
- ChatGPT revised the source document according to the two confirmed annotations and preserved the rejected boundary item.
- A negative prompt that explicitly requested direct rewrite and no annotation UI did not create a new tool call or widget.
- The widget iframe origin observed in ChatGPT was `ai-annotated-review-liujinxingde2008-workers-dev.web-sandbox.oaiusercontent.com`.

## Not Yet Verified

- Public app submission review and approval.
- Mobile ChatGPT behavior; v1 is desktop-first.
- Owner-reviewed final public privacy policy text.
- Container runtime smoke with Docker daemon running.

These are not claimed as complete.

## Strict Submission Blockers

`npm run verify:submission:strict` currently reports no blockers when run with the production Cloudflare Worker URL, widget domain, and privacy URL environment variables.

Remaining non-source release gates:

- OpenAI Platform identity verification and global data residency project setup.
- Owner-reviewed final public privacy policy and support contact.
- Mobile smoke if required for final OpenAI review, while v1 remains desktop-first.
- Official OpenAI dashboard submission and approval.
