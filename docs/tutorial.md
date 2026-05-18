# Usage Tutorial

## 1. Install And Verify

From the repository root:

```bash
npm install
npm test
npm run typecheck
npm run build
```

Expected result:

- unit tests pass,
- TypeScript project references pass,
- web widget builds,
- MCP server builds.

## 2. Run Local Widget Preview

```bash
npm run preview:web
```

Open:

```text
http://127.0.0.1:5173/
```

The preview uses a built-in sample session. It is useful for UI checks but does not prove ChatGPT connector behavior.

Preview workflow:

1. Click a document block.
2. Enter annotation title and comment.
3. Choose priority and status.
4. Click `Add annotation`.
5. Create at least three annotations.
6. Mark two as `confirmed`.
7. Click `Build pack`.
8. Optionally click `Export pack` to save the generated revision request as Markdown.
9. Click `Send revision request`.
10. Confirm in the modal.

In local preview, the send action reports that the host bridge is unavailable. Inside ChatGPT, the same action uses the Apps SDK bridge.

## 3. Run MCP Server

After `npm run build`:

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

Endpoint:

```text
http://localhost:8787/mcp
```

Health check:

```bash
curl http://localhost:8787/
curl http://localhost:8787/health
curl http://localhost:8787/privacy
```

## 4. Smoke Test MCP Tool

Initialize:

```bash
curl -sS -X POST http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-smoke","version":"0.1.0"}}}'
```

List tools:

```bash
curl -sS -X POST http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

Call the review tool:

```bash
curl -sS -X POST http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data @- <<'JSON'
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"review_markdown_document","arguments":{"title":"Smoke Report","sourceLabel":"Manual smoke","markdown":"# Smoke Report\n\n## Context\n\nThis paragraph needs review.\n\n## Scope\n\n- Add comments.\n- Build a revision pack.\n"}}}
JSON
```

Check that:

- `structuredContent.ok` is `true`,
- `structuredContent.blockCount` is greater than zero,
- `_meta.reviewSession.document.blocks` exists.

## 5. Connect To ChatGPT Developer Mode

ChatGPT requires an HTTPS MCP URL. For local development, expose port `8787` with a tunnel such as ngrok or a similar HTTPS tunnel.

Example:

```bash
ngrok http 8787
```

Use the HTTPS URL with `/mcp` appended:

```text
https://your-tunnel.example/mcp
```

In ChatGPT:

1. Enable developer mode in ChatGPT settings.
2. Create a connector.
3. Paste the HTTPS `/mcp` URL.
4. Save or refresh the connector after server metadata changes.
5. Open a new desktop ChatGPT chat and enable the connector.

## 6. ChatGPT Demo Prompt

First generate a report:

```text
Write a detailed product proposal for an AI-assisted workflow tool. Use Markdown headings and make it long enough to require review.
```

Then ask:

```text
Open the report above in AI Annotated Review. Use the review_markdown_document tool and pass the full report Markdown.
```

Inside the widget:

1. Add comments while reading.
2. Mark only revision-driving comments as `confirmed`.
3. Click `Build pack`.
4. Review the prompt.
5. Click `Send revision request`.
6. Confirm in the modal.

ChatGPT should then receive the revision request and revise the original report.

## 7. Limits

Current hard caps:

- 100,000 Unicode characters,
- 300 review blocks.

If the document exceeds a cap, the tool returns a clear error instead of attempting an unreliable import.

## 8. Troubleshooting

If the widget does not render:

- run `npm run build`,
- restart the MCP server,
- refresh the ChatGPT connector,
- verify the resource MIME type is `text/html;profile=mcp-app`.

If ChatGPT cannot connect:

- confirm the MCP URL ends with `/mcp`,
- confirm the URL is HTTPS,
- confirm the tunnel points to local port `8787`,
- check server logs.

If the revision request does not send:

- confirm you are running inside ChatGPT, not local Vite preview,
- confirm the preview modal was accepted,
- rebuild and refresh the connector.
- use `Export pack` as a local fallback while debugging host bridge behavior.

## 9. Publication Readiness

Run the local submission-readiness gate:

```bash
npm run verify:submission:local
```

This checks source-level release artifacts and reports external blockers without failing local development.

Run the strict submission gate only when production hosting and owner-side release decisions are ready:

```bash
npm run verify:submission:strict
```

Strict mode requires production hosting, remote smoke evidence, live production ChatGPT validation evidence, and production screenshot evidence.

Generate draft local screenshots with:

```bash
npm run capture:screenshots
```

Use production ChatGPT connector screenshots before OpenAI submission. The current production desktop screenshot is `docs/submission/screenshots/production-review-widget-desktop.png`.

## 10. Release Boundary

This is not yet a public approved app. Do not announce ChatGPT directory availability until required mobile smoke, OpenAI dashboard prerequisites, final submission, and OpenAI approval are complete.
