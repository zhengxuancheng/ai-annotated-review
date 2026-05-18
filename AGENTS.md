# AI Annotated Review Codex Guardrails

## Project Status

- The owner approved autonomous implementation on 2026-05-18 after external `PASS WITH CONDITIONS` review.
- On 2026-05-18 the owner redirected the project toward a public ChatGPT Apps SDK release.
- Continue implementation toward a reviewable public-submission package, but keep each phase gated by repo docs and verification evidence.
- Do not skip the open-source-first resource check before adding dependencies.
- Public-readiness docs, submission metadata, deployment notes, and release checks are now in scope.
- Do not submit the app in the OpenAI dashboard, create public hosting, publish packages, push to a public GitHub repo, or announce public availability without an explicit final release approval.
- Do not create a `LICENSE` file until the owner decides between Apache-2.0, license-pending, or another strategy after patent/open-source review.

## Product Boundary

- First target is desktop ChatGPT Apps SDK only.
- Mobile is out of scope for v1, except later smoke checks that the app does not crash or visually block core content.
- The app must not claim it can modify ChatGPT, Claude, Codex, Cursor, or VS Code native message bubbles.
- The realistic UI is an embedded ChatGPT Apps SDK component that renders its own reviewable document.
- No scraping or unsupported native UI mutation is allowed.

## Privacy And Trust Rules

- Any action that sends annotation summaries, revision packs, or document context back to ChatGPT must require explicit user confirmation.
- Do not silently send follow-up messages.
- Send only confirmed annotations and necessary context by default.
- Keep full document text out of model-visible context unless the user explicitly approves or the implementation has a bounded, documented reason.
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
  - desktop-only ChatGPT v1 scope,
  - true demo minimum loop,
  - license/public-release decision,
  - external-resource fact checks before public docs.

## Publication Gates

- Public HTTPS MCP endpoint: not complete until deployed and tested outside local networks.
- Widget domain: must be configured with a unique production `_meta.ui.domain`.
- Dashboard prerequisites: identity verification, global data residency project, screenshots, test cases, and privacy policy URL are owner-side gates.
- Mobile: v1 product remains desktop-first, but OpenAI review can test mobile; run mobile smoke before submission and document any limitation honestly.
- Submission JSON and docs are review aids. They must match source behavior at the commit being submitted.
