# AI Annotated Review Codex Guardrails

## Project Status

- The owner approved autonomous implementation on 2026-05-18 after external `PASS WITH CONDITIONS` review.
- On 2026-05-18 the owner redirected the project away from official ChatGPT App Directory submission because publisher verification is blocked.
- Continue implementation toward a public web app, Chrome side panel extension, CLI adapter, and Apps SDK technical preview, but keep each phase gated by repo docs and verification evidence.
- Do not skip the open-source-first resource check before adding dependencies.
- Public-readiness docs, submission metadata, deployment notes, and release checks are now in scope.
- Do not submit the app in the OpenAI dashboard, publish packages, or announce public availability without an explicit final release approval.
- The owner approved Apache-2.0 on 2026-05-18; keep license metadata consistent.

## Product Boundary

- First practical release target is public web app plus Chrome side panel extension plus CLI.
- ChatGPT Apps SDK remains a technical preview and possible future official-submission path.
- Mobile is out of scope for v1, except later smoke checks that the app does not crash or visually block core content.
- The app must not claim it can modify ChatGPT, Claude, Codex, Cursor, or VS Code native message bubbles.
- The realistic UI is a shared review surface rendered as a public web app, browser side panel, CLI artifact workflow, or embedded Apps SDK component.
- No scraping or unsupported native UI mutation is allowed.

## Privacy And Trust Rules

- Any action that sends, copies, exports, or prepares annotation summaries, revision packs, or document context must require explicit user action.
- Do not silently send follow-up messages.
- Send only confirmed annotations and necessary context by default.
- Keep full document text out of model-visible context unless the user explicitly approves or the implementation has a bounded, documented reason.
- Browser extension imports must be user-selected text only; do not scrape full ChatGPT or Claude pages.
- Never store secrets, API keys, tokens, passwords, or private credentials in repo files.
- Public submission requires a real published privacy policy URL. Draft policy text in this repo is not a substitute for owner/legal review.
- Use exact CSP domains for broad distribution. Do not use wildcard CSP entries unless official docs and the implementation clearly require them.

## Dependency Policy

- Prefer official SDKs and mature packages with MIT, Apache-2.0, BSD, ISC, or similarly permissive licenses.
- Do not add GPL, LGPL, AGPL, source-available, or unclear-license code unless the owner explicitly approves.
- Treat external agent collections as references only; do not install them globally or import them wholesale.

## Documentation Discipline

- Keep platform claims evidence-based and cite official docs where possible.
- Preserve these gates during implementation:
  - document length and data-transfer strategy,
  - explicit user confirmation before follow-up sending,
  - public web/browser-extension/CLI scope,
  - true demo minimum loop,
  - license/public-release decision,
  - external-resource fact checks before public docs.

## Publication Gates

- Public web endpoint: not complete until `/app` is deployed and tested outside local networks.
- Browser extension: not complete until built, loaded unpacked, and tested on ChatGPT web and Claude web.
- CLI adapter: not complete until create, blocks, annotate, and pack are verified.
- Public HTTPS MCP endpoint and widget domain remain technical-preview gates for Apps SDK validation.
- Dashboard prerequisites are paused owner-side gates, not current release blockers.
- Submission JSON and docs are review aids for the Apps SDK technical preview. They must match source behavior at the commit being submitted.
