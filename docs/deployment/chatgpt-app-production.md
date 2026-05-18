# ChatGPT App Production Deployment Notes

Status: deployment plan, not a completed deployment record.

## Required Shape

The public app needs a stable HTTPS MCP endpoint:

```text
https://your-domain.example/mcp
```

The same deployment should expose:

```text
https://your-domain.example/health
https://your-domain.example/privacy
```

The `/privacy` route serves the current public privacy policy for the production candidate.

## Environment

Use `.env.example` as the deployment contract:

```bash
PORT=8787
APP_PUBLIC_BASE_URL=https://your-domain.example
APP_WIDGET_DOMAIN=https://your-domain.example
APP_PRIVACY_POLICY_URL=https://your-domain.example/privacy
APP_CSP_CONNECT_DOMAINS=
APP_CSP_RESOURCE_DOMAINS=
APP_CSP_FRAME_DOMAINS=
REMOTE_MCP_URL=https://your-domain.example/mcp
REMOTE_HEALTH_URL=https://your-domain.example/health
REMOTE_PRIVACY_URL=https://your-domain.example/privacy
SMOKE_REMOTE_REPORT_PATH=docs/submission/remote-smoke-report.json
```

Use exact HTTPS origins. Do not use wildcard CSP entries for broad distribution.

## First Deployment Recommendation

Use the Cloudflare Worker adapter for the first stable public review candidate.

Reason:

- Cloudflare documents Remote MCP servers on Workers using Streamable HTTP.
- Cloudflare documents `createMcpHandler` for stateless MCP servers in plain Workers.
- Cloudflare documents ChatGPT Apps deployed to `workers.dev` and connected to ChatGPT with `/mcp`.
- The repo now has a Worker adapter that reuses the shared MCP tool/resource registration code.
- Local Worker dry-run bundling and local Worker MCP smoke tests have passed.

Keep the standard Node/Docker deployment as a fallback if Cloudflare account setup or Worker deployment blocks progress.

Do not rely on a local tunnel as the final OpenAI submission URL. A real deployment origin is required for review.

## Cloudflare Worker Adapter

Files:

```text
apps/chatgpt-app/cloudflare-worker/package.json
apps/chatgpt-app/cloudflare-worker/src/index.ts
apps/chatgpt-app/cloudflare-worker/wrangler.jsonc
scripts/generate-worker-widget.mjs
```

Build and dry-run bundle:

```bash
npm run build:worker-widget
npm run build -w @ai-annotated-review/chatgpt-app-cloudflare-worker
```

Local Worker smoke:

```bash
npm run dev -w @ai-annotated-review/chatgpt-app-cloudflare-worker -- --port 8790
REMOTE_MCP_URL=http://127.0.0.1:8790/mcp \
REMOTE_MCP_ALLOW_HTTP=1 \
npm run smoke:remote
```

Deploy after Cloudflare login:

```bash
npm run deploy -w @ai-annotated-review/chatgpt-app-cloudflare-worker
```

Expected production endpoint shape:

```text
https://ai-annotated-review.<cloudflare-subdomain>.workers.dev/mcp
```

## Container Artifact

The repo includes a production-oriented Dockerfile. It builds the monorepo, prunes dev dependencies, runs the MCP server, and exposes `/health`.

Build locally:

```bash
docker build -t ai-annotated-review:local .
```

Run locally:

```bash
docker run --rm \
  -p 127.0.0.1:8787:8787 \
  -e APP_PUBLIC_BASE_URL=https://your-domain.example \
  -e APP_WIDGET_DOMAIN=https://your-domain.example \
  -e APP_PRIVACY_POLICY_URL=https://your-domain.example/privacy \
  ai-annotated-review:local
```

Smoke test the container:

```bash
npm run smoke:container
```

This command requires a running Docker daemon. If Docker Desktop is not running locally, the script fails before building the image.

## Host Fit

| Host category | Fit | Notes |
|---|---|---|
| Cloudflare Workers | Preferred first production candidate | Worker adapter exists and local Worker smoke passed. |
| Render/Railway/Koyeb-style web service | Good | Set env vars, expose the provider `PORT`, and use `/health` as health check. |
| Fly.io-style Docker app | Good | Use the Dockerfile and map service port to `8787` or provider `PORT`. |
| Netlify/Vercel serverless functions | Deferred | Possible later, but the current Apps SDK server is a long-running Node HTTP server. |

## Deployment Commands

Build:

```bash
npm ci
npm run build
```

Start:

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

The server reads `PORT` and `HOST`. Container hosts should bind `HOST=0.0.0.0`.

Verify after deployment:

```bash
curl -fsS https://your-domain.example/health
```

Then run the remote MCP smoke test from this repo:

```bash
REMOTE_MCP_URL=https://your-domain.example/mcp \
APP_WIDGET_DOMAIN=https://your-domain.example \
SMOKE_REMOTE_REPORT_PATH=docs/submission/remote-smoke-report.json \
npm run smoke:remote
```

This checks `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `/health`, `/privacy`, tool annotations, `outputSchema`, widget CSP metadata, and widget domain metadata. The saved JSON report is required by strict submission readiness.

Then connect ChatGPT developer mode to:

```text
https://your-domain.example/mcp
```

## Pre-Submission Verification

After production values are configured:

```bash
APP_PUBLIC_BASE_URL=https://your-domain.example \
APP_WIDGET_DOMAIN=https://your-domain.example \
APP_PRIVACY_POLICY_URL=https://your-domain.example/privacy \
REMOTE_MCP_URL=https://your-domain.example/mcp \
npm run verify:submission:strict
```

Strict verification is expected to fail until production screenshots, remote smoke evidence, and live ChatGPT validation evidence exist.

## ChatGPT Developer-Mode Validation

Official flow checked on 2026-05-18:

- `https://developers.openai.com/apps-sdk/deploy/connect-chatgpt`
- `https://developers.openai.com/apps-sdk/deploy/testing`
- `https://developers.openai.com/apps-sdk/deploy/submission`

Required validation sequence:

1. Enable developer mode in ChatGPT settings.
2. Create a connector with the public `/mcp` endpoint.
3. Confirm the tool list includes `review_markdown_document`.
4. Run the positive and negative prompts in `docs/submission/test-cases.md`.
5. Complete the golden workflow: open a long document, add three annotations, confirm two, reject or leave one unconfirmed, build the pack, confirm send, and verify ChatGPT revises from the confirmed pack.
6. Capture a production ChatGPT connector screenshot as `docs/submission/screenshots/production-review-widget-desktop.png`.
7. Copy `docs/submission/live-validation-report-template.md` to `docs/submission/live-validation-report.md` and fill it with actual results. Do not mark it passed until the evidence is real.

## No-Secrets Rule

Do not commit deployment tokens, OpenAI dashboard credentials, tunnel auth tokens, private keys, or provider-specific secret files. Use the deployment provider's environment variable or secret manager.
