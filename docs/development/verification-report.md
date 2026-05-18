# Verification Report

Date: 2026-05-18
Latest audit refresh: 2026-05-18 18:05 CST

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
npm run verify:adapters
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
Pivot implementation for public web app, Chrome side panel extension, and CLI adapter
Inline per-block comment composer and voice-dictation UI update
```

Results:

- `npm install`: completed, 0 vulnerabilities.
- `npm test`: 4 test files passed, 10 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed, including Cloudflare Worker dry-run bundling.
- `npm run verify`: passed after the non-directory pivot. It now runs unit tests, typecheck, build, functional claim verification, adapter verification, MCP smoke, UI smoke, worker verification, license scan, reality checks, deployment config checks, and local submission-readiness checks.
- `npm run verify:functionality`: passed. It proves parse -> stable blocks -> annotate -> export/import -> confirmed-only revision pack -> MCP/tool/UI smoke.
- `npm run verify:adapters`: passed. It proves the Chrome extension builds to Manifest V3 with exact ChatGPT/Claude host permissions and that the CLI can create, list blocks, annotate, and build a revision pack.
- `npm run verify:deployment-config`: passed.
- `npm run verify:worker`: passed.
- `npm run build -w @ai-annotated-review/chatgpt-app-cloudflare-worker`: passed; Wrangler dry-run reported total upload size and exited normally.
- Local Cloudflare Worker smoke passed with `REMOTE_MCP_URL=http://127.0.0.1:8790/mcp REMOTE_MCP_ALLOW_HTTP=1 npm run smoke:remote`.
- `npm audit --audit-level=moderate`: completed after the pivot, 0 vulnerabilities.
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
- Public web app route `/app` is implemented in the Node server and Cloudflare Worker source. Local `smoke:mcp` now fetches `/app` and verifies the React root and app title. The UI falls back to copy/export outside a ChatGPT Apps SDK host.
- Production Worker redeploy succeeded on 2026-05-18 with version ID `786b67cf-0556-4984-92f3-edba3d2e5e46`.
- Production `/app` browser smoke passed: the page rendered, imported a test document, added one confirmed annotation, built a revision pack, and completed the copy/export path with no relevant app console errors.
- Inline composer update verification passed on 2026-05-18: `npm run verify` passed under Codex's bundled Node v24.14.0; `smoke:ui` added three annotations through the inline per-block comment flow and confirmed the revision pack still includes confirmed annotations only.
- Browser visual QA confirmed that clicking a block comment button opens a composer directly inside that block. The composer exposes `Comment`, `Dictate`, `Cancel`, and `Add comment`; it does not ask the reviewer to fill title, priority, or status.
- Production Worker redeploy succeeded after the inline composer update with version ID `5424b958-8c92-40f4-a4fd-b073780dc436`. Remote smoke passed and `/app` contains the updated `inline-composer`, `Dictate`, and `Add comment` UI.
- Copy-flow update verification passed on 2026-05-18: `smoke:ui` now checks a narrow standalone viewport where `Build pack` scrolls the `Copy` action into view, copy mode copies directly without opening the `Confirm send` modal, and the copied notice appears then auto-dismisses. Send mode inside the Apps SDK bridge still requires `Confirm send`.
- Production Worker redeploy succeeded after the copy-flow update with version ID `e818f90e-249d-44f2-a4e9-ef3746a5774a`. Remote smoke passed; `/app` contains the scroll-to-pack behavior and no longer contains `Confirm and copy`.
- Copy toast update deployed on 2026-05-18 with Worker version ID `f6eb819c-9fa0-4d97-a1f9-52cc8bdad0be`. Remote smoke passed; `/app` contains `copy-toast`, `Copied`, and `已复制`, and no longer contains the long `Copy revision request` button label.
- Extension voice-input permission update verification passed on 2026-05-18: `smoke:ui` now simulates a Chrome extension side panel with microphone permission still at `prompt`, clicks `Dictate`, verifies that `voice-permission.html` opens, and verifies speech recognition does not start before extension microphone permission is granted. `verify:adapters` verifies the built extension contains `dist/voice-permission.html`. Production Worker redeploy succeeded with version ID `9e0e07cc-d94e-4b0c-a3b2-2e7381f1c654`; remote smoke passed and `/app` contains the updated microphone permission message.
- Continuous dictation update verification passed on 2026-05-18: the first `npm run smoke:ui` red test failed on `Dictation must request continuous recognition`, then the implementation was updated and `smoke:ui` passed with `voiceDictationIsContinuous`, `voiceDictationKeepsMultipleSegments`, `voiceDictationRestartsAfterPause`, and `voiceDictationStopsOnlyByUser`. Full `npm run verify` passed under Codex's bundled Node v24.14.0. Production Worker redeploy succeeded with version ID `039be1a2-7875-4bfe-ac9f-006163d8ad67`; remote smoke passed, and `/app` contains the updated listening/stop strings.
- Speech cleanup update verification passed on 2026-05-18: `apps/chatgpt-app/web/test/speechPostProcessing.test.ts` first failed because the module did not exist, then passed with tests for `Phase 0A` phrase hints, `face0a` / `face01` normalization, Chinese punctuation restoration, and the no-`Phase` false-positive guard. Full `npm run verify` passed with 5 test files and 13 tests. `smoke:ui` now verifies `voicePhraseHintsUseBlockContext`. Production Worker redeploy succeeded with version ID `09402df3-4c65-412c-a053-631f193cdaee`; remote smoke passed, and `/app` contains `SpeechRecognitionPhrase` and `Phase 0A`.
- Speech phrase-hint fallback verification passed on 2026-05-18: `smoke:ui` now simulates a browser that exposes `SpeechRecognitionPhrase` but raises `phrases-not-supported` on start. The first red run timed out waiting for fallback. After the fix, `smoke:ui` passed with `voicePhraseHintFailureFallsBack`, proving dictation restarts without phrase hints and does not leave the user at `Voice input stopped.` Full `npm run verify` passed with 5 test files and 13 tests.
- Dictated Chinese punctuation update verification passed on 2026-05-18: a screenshot-derived long Chinese comment first failed because it only received a final sentence mark. After the fix, `speechPostProcessing.test.ts` verifies comma/question/sentence punctuation around `所以说呀`, `Phase 0A`, `对吧`, `说一说`, and `笼统`. Full `npm run verify` passed with 5 test files and 14 tests.

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
- Adapter verification now emits evidence for browser-extension permission boundaries and CLI behavior.

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
- `/privacy` served the public privacy policy route.
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
- The automated `smoke:ui` script injects a mock Apps SDK bridge and verifies the explicit send path.
- No browser console errors in the final smoke pass.

## Adapter Smoke Tests

Verified by `npm run verify:adapters`:

- Browser extension build produced `apps/browser-extension/dist/manifest.json`.
- Manifest version is 3.
- Side panel default path is `index.html`.
- Permissions are limited to `activeTab`, `scripting`, and `sidePanel`.
- Host permissions are limited to `https://chatgpt.com/*`, `https://chat.openai.com/*`, and `https://claude.ai/*`.
- No `<all_urls>` or `*://` broad host access is requested.
- Source guard verifies selected-text import via `window.getSelection()?.toString()`.
- Source guard rejects whole-page text scraping patterns such as `document.body.innerText`.
- CLI smoke created a review JSON from `examples/fixtures/product-plan.md`.
- CLI smoke listed real block IDs.
- CLI smoke added a confirmed annotation to a target block.
- CLI smoke generated a revision pack containing the confirmed annotation.

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
- Chrome extension manually loaded in a human Chrome profile on both ChatGPT web and Claude web after the latest pivot.
- Mobile behavior; v1 is desktop/web-first.
- Owner-reviewed final public privacy policy text.
- Container runtime smoke with Docker daemon running.

These are not claimed as complete.

## Strict Submission Blockers

`npm run verify:submission:strict` previously reported no blockers when run with the production Cloudflare Worker URL, widget domain, and privacy URL environment variables. Official ChatGPT App submission is now paused, so this is Apps SDK technical-preview evidence rather than the active release gate.

Remaining non-source release gates:

- Manual Chrome extension load and selected-text side panel test on ChatGPT web.
- Manual Chrome extension load and selected-text side panel test on Claude web.
- Official OpenAI dashboard submission and approval remain paused.
