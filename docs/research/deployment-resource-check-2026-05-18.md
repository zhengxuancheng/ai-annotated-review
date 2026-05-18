# Deployment Resource Check

Date: 2026-05-18

Purpose: choose the first production deployment shape for the ChatGPT Apps SDK MCP server.

## Requirements From Official Docs

- ChatGPT developer mode needs an HTTPS-reachable MCP endpoint.
- The connector URL should be the public `/mcp` endpoint.
- Before launch, validate positive and negative prompts, tool output schemas, widget rendering, and mobile behavior.
- Widget resources need narrow `_meta.ui.csp` before broad distribution.
- Widget resources need a unique `_meta.ui.domain` for app submission.

Official sources checked:

- https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- https://developers.openai.com/apps-sdk/deploy/testing
- https://developers.openai.com/apps-sdk/build/mcp-server

## Options Considered

| Option | Fit | Maintenance | License/commercial concern | Decision |
|---|---|---|---|---|
| Generic Docker container on a managed HTTPS host | Strong fit for current Node HTTP MCP server. No server rewrite. | Standard ops pattern. | Uses official Node Docker image; no app code license issue added. | Accept for first production candidate. |
| Render web service | Good fit for Node/container apps; supports health checks and env vars. | Simple for a small public app. | Platform service, no imported code. | Suitable host option. |
| Fly.io Machines | Good fit for Docker app and global deployment. | More operational surface than needed, but solid. | Platform service, no imported code. | Suitable host option. |
| Railway service | Good fit if the app binds `0.0.0.0:$PORT`. | Simple for prototypes and small services. | Platform service, no imported code. | Suitable host option. |
| Cloudflare Workers | Good fit after adding a dedicated Worker adapter. Official Cloudflare docs support stateless MCP via `agents/mcp` `createMcpHandler`, and ChatGPT Apps can be deployed to `workers.dev`. | Adds an edge-runtime adapter, but now reuses the shared MCP tool/resource registration code. | `agents` is MIT; `@cloudflare/workers-types` is MIT OR Apache-2.0. `wrangler` is used through pinned `npx`, not committed as a dependency. | Accept as first stable production candidate. |
| Netlify Functions / Vercel Functions | Possible with adapter work, but current MCP server is a long-lived Node HTTP server. | Serverless request model may introduce Apps SDK edge cases. | Platform service, no imported code. | Defer until after first stable Node deployment. |
| Local tunnel as final review URL | Works for temporary developer-mode testing. | Fragile for review and public use. | No code issue, but reliability risk. | Development only, not final submission default. |

## Recommendation

Use the Cloudflare Worker adapter as the first stable production candidate, while keeping the generic Docker image as a fallback artifact for managed Node/container hosts.

This keeps the app on a stable HTTPS origin without requiring a separate container host. The Worker adapter reuses the same MCP server registration logic as the Node server and has been verified with local Worker smoke tests.

## Implementation Decision

Added:

- `Dockerfile`
- `.dockerignore`
- `npm run smoke:container`
- `npm run verify:deployment-config`
- `apps/chatgpt-app/cloudflare-worker/`
- `npm run verify:worker`
- `scripts/generate-worker-widget.mjs`

No secrets were added. `wrangler` is not stored as a repo dependency because its transitive optional packages introduced LGPL license findings in the local dependency tree.
