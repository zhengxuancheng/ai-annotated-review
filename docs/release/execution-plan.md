# Release Execution Plan

Status: active working plan. Do not treat this as a completed release record.

## Goal

Ship AI Annotated Review as a public ChatGPT App after proving that the product works locally, through a public HTTPS MCP endpoint, inside ChatGPT Developer Mode, and through OpenAI's submission review process.

## Phase 1: Prove The Product Is Real Locally

Owner: Codex.

What Codex does:

- Run source tests, type checks, build checks, MCP smoke tests, widget smoke tests, license checks, reality checks, and functional claim checks.
- Keep a feature-by-feature evidence matrix.
- Fix any source or test failure immediately.

Commands:

```bash
npm run verify:functionality
npm run verify
npm audit --audit-level=moderate
```

Pass criteria:

- Functional verifier proves parse -> annotate -> confirmed-only revision pack -> export/import.
- MCP smoke proves the tool and widget resource exist and return the expected data boundaries.
- UI smoke proves the desktop widget review flow works.

Current status: local source/runtime evidence exists. Local Cloudflare Worker runtime evidence exists. Stable Cloudflare Worker remote-smoke evidence exists. Production-candidate ChatGPT Developer Mode evidence exists.

## Phase 2: Create A Temporary Public HTTPS MCP Endpoint

Owner: Codex where local tools and existing login allow it. Human owner only provides access if a hosting/tunnel login is required.

What Codex does:

- Choose the lowest-risk temporary endpoint path available on this machine.
- Start or deploy the MCP server at a public HTTPS URL.
- Avoid committing tokens, credentials, provider secrets, or dashboard credentials.

Possible paths:

- Temporary HTTPS tunnel for developer-mode testing.
- Managed Node/container preview deployment if a CLI is already configured.
- Final production host only after the temporary path works.

Pass criteria:

- `https://.../health` returns `ok: true`.
- `https://.../privacy` is reachable.
- `https://.../mcp` accepts MCP JSON-RPC requests.

Human owner may need to:

- Log in to a tunnel or hosting provider.
- Approve a domain or deployment target.
- Provide no secrets in files; use provider login or secret manager only.

Current status:

- Localtunnel was tried and rejected because it returned HTTP 503.
- Cloudflare quick tunnel worked for temporary technical validation.
- A temporary quick-tunnel endpoint was verified on 2026-05-18 during earlier technical validation.
- This endpoint is not suitable as the final production submission URL because account-less quick tunnels have no uptime guarantee.
- A Cloudflare Worker adapter exists and passes local Worker smoke.
- Stable Cloudflare Worker production candidate deployed on 2026-05-18: `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp`.

## Phase 3: Run Remote MCP Smoke

Owner: Codex.

Command shape:

```bash
REMOTE_MCP_URL=https://your-domain.example/mcp \
APP_WIDGET_DOMAIN=https://your-domain.example \
SMOKE_REMOTE_REPORT_PATH=docs/submission/remote-smoke-report.json \
npm run smoke:remote
```

Pass criteria:

- The saved report has `ok: true`.
- Tool annotations and `outputSchema` are present.
- Tool call returns compact `structuredContent` and widget-only `_meta.reviewSession`.
- Widget resource returns Apps SDK MIME type, CSP metadata, and the expected widget domain.

Current status: passed for the stable Cloudflare Worker production candidate and saved in `docs/submission/remote-smoke-report.json`.

## Phase 4: Test In ChatGPT Developer Mode

Owner: Codex guides and records. Human owner may need to click through account-only ChatGPT/OpenAI UI.

What must happen:

- Enable Developer Mode in ChatGPT.
- Add the MCP endpoint as a connector.
- Confirm ChatGPT discovers `review_markdown_document`.
- Run the positive and negative prompts in `docs/submission/test-cases.md`.
- Complete the golden workflow:
  1. Open a long report in the widget.
  2. Add three annotations.
  3. Confirm two annotations.
  4. Leave one unconfirmed or rejected.
  5. Build a revision pack.
  6. Confirm send.
  7. Verify ChatGPT revises using the confirmed pack.

Evidence to save:

- `docs/submission/live-validation-report.md`
- Developer-mode evidence in `docs/submission/live-validation-report.md`.
- `docs/submission/screenshots/production-review-widget-desktop.png` only after a stable production connector exists.

Pass criteria:

- Live validation report says `Status: passed`.
- No TODO or pending markers remain.
- Production screenshot exists before final submission.
- `npm run verify:submission:strict` moves past the developer-mode gate, while keeping true legal/screenshot blockers visible.

Current status:

- Passed on 2026-05-18 in ChatGPT web Developer Mode using the temporary Cloudflare quick tunnel.
- Evidence is recorded in `docs/submission/live-validation-report.md`.
- The successful golden workflow covered import, widget render, block selection, 3 annotations, 2 confirmed annotations, 1 rejected annotation, confirmed-only revision pack, explicit confirmation modal, follow-up send, and ChatGPT revision.
- One negative prompt was also tested: direct rewrite without annotation UI did not trigger a new app tool call.
- Passed again on 2026-05-18 in ChatGPT web Developer Mode using the stable Cloudflare Worker production candidate.
- Production-candidate evidence is recorded in `docs/submission/live-validation-report.md`.
- The production-candidate pass used connector `AI Annotated Review Production`, endpoint `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp`, and widget iframe origin `ai-annotated-review-liujinxingde2008-workers-dev.web-sandbox.oaiusercontent.com`.
- Production screenshot capture succeeded after Codex restart: `docs/submission/screenshots/production-review-widget-desktop.png` shows ChatGPT web with connector `AI Annotated Review Production`, the embedded review widget, three annotations, two confirmed annotations, and the revision pack panel.

## Phase 5: Legal, Privacy, And Open-Source Decision

Owner: human owner, with Codex preparing drafts and checks.

Decisions and remaining work:

- Public license: decided on 2026-05-18 as Apache-2.0.
- Patent path: not treated as a release blocker for the current open-source path; do not publish detailed novelty claims.
- Final public privacy policy still needs owner/legal review.
- Support/contact URL or email still needs owner decision.
- Public app name and publisher identity still need final dashboard values.

Codex can:

- Keep Apache-2.0 license metadata consistent across packages.
- Ensure README and submission copy do not overclaim.

## Phase 6: OpenAI Dashboard Submission

Owner: human owner for account/dashboard actions. Codex prepares materials and checks them.

Prerequisites:

- OpenAI identity verification complete.
- Project has global data residency.
- `api.apps.write` and `api.apps.read` permissions available.
- Public MCP endpoint is stable and not a local/test-only endpoint.
- Final privacy policy URL is live.
- `npm run verify:submission:strict` passes.

Codex can:

- Prepare the app metadata, test prompts, screenshots, tool justifications, and reviewer notes.
- Check every field against source behavior.
- Produce a final submission packet.

Codex must not:

- Submit through the OpenAI dashboard without explicit final approval.
- Claim approval before OpenAI approves.
- Publish a public repo or public launch announcement without explicit approval.

## Current Next Action

The current next action is final submission preparation: rerun strict readiness with production environment variables, then prepare the OpenAI submission packet while keeping owner-reviewed privacy-policy, support contact, identity/data-residency, mobile smoke, and dashboard submission gates visible.
