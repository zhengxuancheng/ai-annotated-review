# Resource Decision Record

Date: 2026-05-18
Status: accepted for private implementation

This record exists so implementation does not drift into random dependency adoption. Public-facing metrics must be rechecked before publication.

## Official Platform Sources Checked

- OpenAI Apps SDK quickstart: `https://developers.openai.com/apps-sdk/quickstart`
- OpenAI MCP server guide: `https://developers.openai.com/apps-sdk/build/mcp-server`
- OpenAI ChatGPT UI guide: `https://developers.openai.com/apps-sdk/build/chatgpt-ui`
- OpenAI Apps SDK reference: `https://developers.openai.com/apps-sdk/reference`
- OpenAI MCP Apps compatibility guide: `https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt`
- OpenAI state management guide: `https://developers.openai.com/apps-sdk/build/state-management`
- OpenAI submission guide: `https://developers.openai.com/apps-sdk/deploy/submission`
- OpenAI app submission guidelines: `https://developers.openai.com/apps-sdk/app-submission-guidelines`
- Cloudflare Remote MCP server guide: `https://developers.cloudflare.com/agents/guides/remote-mcp-server/`
- Cloudflare `createMcpHandler` API reference: `https://developers.cloudflare.com/agents/api-reference/mcp-handler-api/`
- Cloudflare ChatGPT App guide: `https://developers.cloudflare.com/agents/guides/chatgpt-app/`

Key implementation consequences:

- Build an MCP server first; widget UI is delivered as an iframe resource.
- Prefer MCP Apps `ui/*` JSON-RPC bridge. Use `window.openai` only for ChatGPT-specific enhancements such as `sendFollowUpMessage`, display mode, and widget state.
- Keep `structuredContent` compact because the model reads it.
- Put the full document and block payload in `_meta` because it is widget-only.
- Every follow-up revision request must require explicit user action.
- Public submission requires HTTPS hosting, CSP, test cases, privacy policy, and verified publisher setup. The repo now has a stable HTTPS MCP endpoint, CSP metadata, test cases, production desktop screenshot evidence, a privacy policy URL, support via GitHub issues, and strict submission checks; OpenAI account-side gates remain.
- Cloudflare Workers is suitable as a stable HTTPS MCP host for this stateless app because Cloudflare documents `createMcpHandler` for stateless MCP servers without Durable Objects and shows ChatGPT Apps deployed to `workers.dev`.

## Accepted Dependencies

| Resource | Version observed | License observed | Role | Decision |
| --- | ---: | --- | --- | --- |
| `@modelcontextprotocol/sdk` | 1.29.0 | MIT on npm | MCP server transport and tool registration | Use |
| `@modelcontextprotocol/ext-apps` | 1.7.2 | MIT | Apps resource/tool helpers and MIME constant | Use |
| `zod` | 4.4.3 | MIT | Runtime schemas and tool input/output validation | Use |
| `unified` | 11.0.5 | MIT | Markdown processing pipeline | Use |
| `remark-parse` | 11.0.0 | MIT | Markdown AST parser | Use |
| `remark-gfm` | 4.0.1 | MIT | Tables, task lists, and GFM support | Use |
| `mdast-util-to-string` | 4.0.0 | MIT | Plain text extraction from Markdown AST nodes | Use |
| `react` / `react-dom` | 19.2.6 | MIT | Desktop widget UI | Use |
| `vite` | 8.0.13 | MIT | Widget build and local preview | Use |
| `@vitejs/plugin-react` | 6.0.2 | MIT | React build integration | Use |
| `vitest` | 4.1.6 | MIT | Unit and fixture tests | Use |
| `typescript` | 6.0.3 | Apache-2.0 | Type checking | Use |
| `tsx` | 4.22.1 | MIT | Local TypeScript server runner | Use |
| `lucide-react` | 1.16.0 | ISC | Familiar toolbar/status icons | Use |
| `@floating-ui/react` | 0.27.19 | MIT | Anchored annotation composer/popovers if needed | Use narrowly |
| `jsdom` | 29.1.1 | MIT | Browser-like tests if needed | Use only if required |
| `playwright-core` | 1.60.0 | Apache-2.0 | Dev-only UI smoke tests against local Chrome without browser downloads | Use for QA only |
| `agents` | 0.12.4 | MIT | Cloudflare Worker MCP handler via `agents/mcp` | Use in Worker adapter |
| `@cloudflare/workers-types` | 4.20260518.1 | MIT OR Apache-2.0 | Worker TypeScript types only | Use as dev-only types |

## External Tools Not Vendored

| Tool | Version observed | License observed | Role | Decision |
| --- | ---: | --- | --- | --- |
| `wrangler` via `npx --yes wrangler@4.92.0` | 4.92.0 | MIT OR Apache-2.0 on npm | Cloudflare local dev, dry-run bundle, and deploy CLI | Use as a pinned external CLI; do not add as repo dependency |

## Referenced But Not Imported

| Resource | Observed status | License observed | Decision |
| --- | --- | --- | --- |
| `openai/openai-apps-sdk-examples` | Public activity metrics intentionally omitted; recheck before publication | MIT | Use as design/code pattern reference; do not wholesale copy |
| `modelcontextprotocol/typescript-sdk` | Public activity metrics intentionally omitted; recheck before publication | Repo license shown as `Other`; npm package is MIT | Use npm package, cite npm license for dependency decision |
| `msitarzewski/agency-agents` | Public activity metrics intentionally omitted; recheck before publication | MIT | Reference only; do not install or import |
| `backnotprop/plannotator` | Prior-art note from earlier research | Apache-2.0 | Prior-art reference; do not depend on it |
| Hypothesis, Taguette, dokieli, Recogito | Prior-art annotation systems | Mixed, including AGPL for Recogito Studio | Prior art only; no direct reuse in v1 |

## Rejected Or Deferred

- GPL, LGPL, AGPL, source-available, unclear-license packages: reject unless explicitly approved.
- ProseMirror/TipTap/MDXEditor: defer because v1 reviews generated Markdown blocks and does not need rich text editing.
- Browser extension frameworks: defer because first target is ChatGPT Apps SDK.
- External LLM SDKs/API integrations: reject for v1; ChatGPT is the conversation partner.
- Cloud sync/database packages: defer; v1 uses message-scoped widget state and export JSON.
- `wrangler` as a committed `devDependency`: rejected after `verify:license` showed LGPL `sharp/libvips` packages in the repo dependency tree. The repo now invokes pinned `npx wrangler@4.92.0` instead, and the package-lock scan is clean.

## Dependency Install Boundary

Install only the accepted dependencies above. The owner chose Apache-2.0 on 2026-05-18, so the repo includes a `LICENSE` file and package metadata. Do not add telemetry, analytics, auth providers, hosted databases, or unrelated public package metadata during implementation.
