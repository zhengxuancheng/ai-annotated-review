# Contributing

AI Annotated Review is a ChatGPT Apps SDK project for block-level review of long AI-generated Markdown or plain text outputs.

The first public target is desktop ChatGPT. Please keep platform claims narrow: the app renders its own embedded review widget and does not modify ChatGPT native message bubbles.

## Development Setup

Use Node.js 22 or newer. Wrangler currently requires Node 22+, and the full verification gate will fail on older Node versions.

```bash
npm install
npm run verify
```

Useful focused checks:

```bash
npm test
npm run typecheck
npm run build
npm run smoke:mcp
npm run smoke:ui
npm run verify:license
npm run verify:reality
npm run verify:submission:local
```

Strict submission readiness should be run only with real production URLs:

```bash
APP_PUBLIC_BASE_URL=https://your-production-origin.example \
APP_WIDGET_DOMAIN=https://your-production-origin.example \
APP_PRIVACY_POLICY_URL=https://your-production-origin.example/privacy \
REMOTE_MCP_URL=https://your-production-origin.example/mcp \
npm run verify:submission:strict
```

## Contribution Scope

Good first contributions:

- parser fixtures for real Markdown structures,
- accessibility and keyboard-navigation improvements,
- tests for revision-pack behavior,
- documentation fixes,
- future adapter design notes that do not overclaim platform support.

Before adding dependencies:

- prefer official SDKs and mature focused libraries,
- check license and maintenance status,
- avoid GPL, LGPL, AGPL, source-available, or unclear-license packages unless the owner explicitly approves,
- update `docs/research/resource-decision-record.md`.

## Product Boundaries

Do not submit changes that:

- scrape or mutate ChatGPT, Claude, Codex, Cursor, VS Code, or browser native UI,
- silently send revision packs or document context without explicit user confirmation,
- send open, rejected, or resolved comments in the default revision request,
- add telemetry, accounts, billing, cloud sync, or external LLM calls without a reviewed proposal,
- claim OpenAI approval before approval actually exists,
- claim mobile support for v1.

## Pull Requests

Every pull request should include:

- what changed,
- why it changed,
- verification commands and results,
- screenshots for visible UI changes,
- privacy or platform-boundary impact if relevant.

Run `npm run verify` before opening a pull request when possible. If it cannot run because of local tooling, state the exact blocker and run the closest focused checks.
