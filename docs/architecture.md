# Architecture

## Package Boundaries

```text
apps/chatgpt-app/server
  Node MCP server, Apps SDK tool/resource registration, /app web route, health/privacy routes

apps/chatgpt-app/web
  React review UI used by the public web app, browser extension side panel, and Apps SDK widget

apps/chatgpt-app/cloudflare-worker
  Production Worker adapter for /app, /mcp, /health, and /privacy

apps/browser-extension
  Chrome Manifest V3 side panel extension for ChatGPT web and Claude web

apps/cli
  Terminal adapter for file/stdin review sessions and revision-pack generation

packages/annotation-model
  Zod schemas, constants, IDs, shared types

packages/markdown-block-parser
  Markdown/GFM AST parsing into stable review blocks

packages/review-core
  Review session reducer, annotation operations, export/import

packages/revision-prompt-builder
  Confirmed annotations to revision prompt/revision pack
```

Core packages do not import ChatGPT, Codex, Claude, browser extension, VS Code, Cursor, or Cloudflare APIs.

## Current Release Flow

```mermaid
flowchart LR
  Report["Long AI output"] --> Import["Explicit import"]
  Import --> Blocks["Review blocks"]
  Blocks --> Annotations["Anchored annotations"]
  Annotations --> Confirmed["Confirmed comments"]
  Confirmed --> Pack["Revision pack"]
  Pack --> UserAction["User copies, exports, or confirms send"]
  UserAction --> Assistant["ChatGPT, Claude, Codex, or Claude Code"]
```

## Public Web Flow

```mermaid
sequenceDiagram
  participant User
  participant Web as Public Web App
  participant Core as Shared Core Packages
  participant Assistant as AI Assistant

  User->>Web: Paste Markdown/text
  Web->>Core: Parse into review blocks
  Core-->>Web: Review session
  User->>Web: Add annotations and confirm comments
  Web->>Core: Build confirmed-only revision pack
  User->>Assistant: Paste copied/exported revision request
```

## Browser Side Panel Flow

```mermaid
sequenceDiagram
  participant User
  participant Page as ChatGPT/Claude Web Page
  participant Ext as Chrome Side Panel
  participant Core as Shared Core Packages

  User->>Page: Select AI output text
  User->>Ext: Click Use selected text
  Ext->>Page: Read window.getSelection() via activeTab+scripting
  Ext->>Core: Parse selected text
  Core-->>Ext: Review session
  User->>Ext: Annotate and build revision pack
  User->>Page: Paste copied/exported request manually
```

The extension does not request `<all_urls>` and does not read `document.body.innerText`.

## CLI Flow

```mermaid
sequenceDiagram
  participant User
  participant CLI
  participant Core as Shared Core Packages
  participant Agent as Codex CLI / Claude Code

  User->>CLI: create report.md --out review.json
  CLI->>Core: Parse document
  User->>CLI: blocks review.json
  User->>CLI: annotate review.json --block ... --status confirmed
  User->>CLI: pack review.json --out revision-pack.md
  User->>Agent: Paste or attach revision-pack.md
```

## ChatGPT Apps SDK Technical Preview

```mermaid
sequenceDiagram
  participant User
  participant ChatGPT
  participant MCP as MCP Server
  participant Widget as Review Widget

  User->>ChatGPT: Ask to review a long report
  ChatGPT->>MCP: review_markdown_document(markdown, title)
  MCP->>MCP: Parse Markdown into review blocks
  MCP-->>ChatGPT: structuredContent summary
  MCP-->>Widget: _meta.reviewSession with full blocks
  Widget->>User: Render document and annotation controls
  User->>Widget: Add comments and mark confirmed
  Widget->>Widget: Build revision pack
  User->>Widget: Confirm send
  Widget-->>ChatGPT: ui/message or sendFollowUpMessage(prompt)
  ChatGPT->>User: Revised document
```

This path is not claimed as an approved public ChatGPT App Directory app.

## Data Boundary

- `structuredContent`: model-visible Apps SDK summary only.
- `_meta.reviewSession`: Apps SDK widget-only hydrated session with blocks and full document-derived text.
- Public web app state: in-memory browser state until export/copy.
- Browser extension import: user-selected active-tab text only.
- CLI state: local JSON and Markdown files chosen by the user.
- Follow-up message: generated only after explicit user confirmation.
- Default revision message: confirmed annotations only, no full document resend.
- Revision pack export: local Markdown file fallback for web, extension, CLI, and bridge-unavailable environments.

## MCP Tool

`review_markdown_document`

- Purpose: render an explicitly supplied Markdown/text document for review.
- Input: `markdown`, optional `title`, optional `sourceLabel`.
- Limits: 100,000 Unicode chars or 300 review blocks.
- Annotation: `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`.

## Publication Wiring

- `/app`: public web app route on the Worker/server.
- `/mcp`: MCP endpoint for Apps SDK Developer Mode and future official submission.
- `APP_PUBLIC_BASE_URL`: public deployment origin used for health/reporting.
- `APP_WIDGET_DOMAIN`: production widget domain surfaced as `_meta.ui.domain`.
- `APP_PRIVACY_POLICY_URL`: reviewed privacy policy URL surfaced in `/health`.
- `APP_CSP_CONNECT_DOMAINS`: comma-separated exact domains for widget network calls.
- `APP_CSP_RESOURCE_DOMAINS`: comma-separated exact domains for widget resources.
- `APP_CSP_FRAME_DOMAINS`: optional exact frame domains; avoid unless the UI truly embeds subframes.

## Platform Boundaries

- ChatGPT web and Claude web: supported through public web/manual paste and Chrome side panel selected-text import.
- Codex CLI and Claude Code: supported through CLI files and generated revision packs.
- Claude Desktop: future MCPB/desktop-extension packaging only; no native Claude Desktop message UI modification is claimed.
- ChatGPT Apps SDK: technical preview until publisher verification and OpenAI approval are complete.
