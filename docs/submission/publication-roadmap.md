# Publication Roadmap

## Stage 1: Local Submission Package

Goal: make the repository internally consistent with Apps SDK submission requirements.

Acceptance criteria:

- `npm run verify` passes.
- `npm run verify:submission:local` passes.
- `chatgpt-app-submission.json` matches the actual MCP tool.
- Public-facing docs avoid unsupported claims.
- No secrets, API keys, or public credentials are committed.

## Stage 2: Public HTTPS Deployment

Goal: run the MCP server from a stable public HTTPS origin.

Acceptance criteria:

- Docker image builds and passes `npm run smoke:container`.
- `GET /health` returns `ok: true`.
- `GET /privacy` serves the reviewed privacy policy or redirects to the reviewed policy URL.
- `POST /mcp` connects from outside local networks.
- `npm run smoke:remote` passes against the public `/mcp` endpoint and saves `docs/submission/remote-smoke-report.json`.
- Production `APP_WIDGET_DOMAIN` is set to a unique origin.
- CSP domains are exact and minimal.

## Stage 3: ChatGPT Developer-Mode Validation

Goal: prove the full user loop in ChatGPT before submission.

Acceptance criteria:

- Connector can be created from the production `/mcp` endpoint.
- Tool discovery triggers on direct review requests.
- Tool discovery does not trigger on negative prompts.
- Widget renders on ChatGPT web without console errors.
- User can add three annotations, confirm two, build a revision pack, confirm send, and get a revised document.
- Mobile smoke is recorded honestly, even if v1 remains desktop-first.

## Stage 4: OpenAI Submission

Goal: submit a truthful app package for review.

Acceptance criteria:

- Final app name, subtitle, description, category, logo, screenshots, privacy policy URL, and test cases are ready.
- Apache-2.0 license is present and public repo copy does not claim patent protection.
- Identity verification is complete.
- A global data residency project is used.
- `npm run verify:submission:strict` passes.
- Owner gives explicit approval to submit.

## Stage 5: Post-Approval Publication

Goal: publish only after approval and keep a maintenance loop.

Acceptance criteria:

- Approval email received.
- Public README matches actual approved behavior.
- Release notes do not imply native ChatGPT UI modification.
- Support/contact process is available.
- Regression checklist is rerun before future updates.
