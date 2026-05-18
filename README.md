# AI Annotated Review

Publication-track ChatGPT Apps SDK build for a desktop annotation workflow.

This app renders a long AI-generated Markdown/text document inside a ChatGPT Apps SDK widget, lets the reviewer attach comments to exact review blocks, and builds a revision request from confirmed comments only.

Current boundary:

- First target: desktop ChatGPT Apps SDK.
- No native ChatGPT message bubble modification.
- No cloud sync, accounts, billing, telemetry, or external LLM API integration.
- Not publicly submitted or approved yet.
- Licensed under Apache-2.0.

## Local Commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run verify
npm run verify:submission:local
npm run verify:submission:strict
npm run capture:screenshots
npm run smoke:container
npm run smoke:remote
npm run start -w @ai-annotated-review/chatgpt-app-server
```

MCP endpoint:

```text
http://localhost:8787/mcp
```

Health and draft privacy routes:

```text
http://localhost:8787/health
http://localhost:8787/privacy
```

Local widget preview:

```bash
npm run preview:web
```

Then open:

```text
http://127.0.0.1:5173/
```

## Key Docs

- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Usage tutorial](docs/tutorial.md)
- [Architecture](docs/architecture.md)
- [Privacy model](docs/privacy-model.md)
- [Demo script](docs/demo-script.md)
- [Production deployment notes](docs/deployment/chatgpt-app-production.md)
- [Deployment resource check](docs/research/deployment-resource-check-2026-05-18.md)
- [Verification report](docs/development/verification-report.md)
- [Submission checklist](docs/submission/submission-checklist.md)
- [OpenAI dashboard packet](docs/submission/openai-dashboard-packet.md)
- [Publication roadmap](docs/submission/publication-roadmap.md)
- [Submission test cases](docs/submission/test-cases.md)
- [Privacy policy draft](docs/legal/privacy-policy-draft.md)
- [Resource decisions](docs/research/resource-decision-record.md)
- [Patentability notes](docs/ip/patentability-notes.md)
- [Public GitHub checklist](docs/release/public-github-checklist.md)

## Publication Status

The repo now contains a submission metadata draft at [chatgpt-app-submission.json](chatgpt-app-submission.json), a configurable widget domain/CSP path, and local publication-readiness checks.

Remaining external release gates:

- owner-reviewed public privacy policy and support contact,
- mobile smoke,
- OpenAI dashboard identity/data-residency prerequisites.
