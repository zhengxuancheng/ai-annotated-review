# Implementation Plan

Date: 2026-05-18
Status: active private implementation plan

Status note, 2026-05-18: this plan began as an Apps SDK-first plan. The active release path now adds public web app, Chrome side panel extension, and CLI adapter, while retaining the Apps SDK adapter as a technical preview. See `docs/strategy/non-directory-release-plan.md`.

## App Archetype

Primary archetype: `react-widget` ChatGPT Apps SDK app with a Node MCP server.

Rationale:

- The core value is an interactive document review surface, so a widget is required.
- The MCP server should expose one render/import tool for ChatGPT and keep raw document payload widget-only.
- Core packages remain platform-agnostic for later Codex, Claude Code, VS Code/Cursor, and browser-extension adapters.

## Product Gate

The first private demo is accepted only when this loop works on desktop:

1. ChatGPT or the MCP Inspector calls the review tool with a long Markdown report.
2. The widget renders stable review blocks.
3. A reviewer adds comments to at least three blocks.
4. At least two comments are marked `confirmed`.
5. The widget builds a revision pack from confirmed comments only.
6. The reviewer previews the exact message.
7. The reviewer explicitly clicks the send button.
8. The app sends or prepares a follow-up revision request without resending the full document by default.

## Tool Plan

### `review_markdown_document`

Use this when the user wants to review a long AI-generated Markdown/text document with anchored comments.

Input:

- `markdown`: required string, maximum 100,000 Unicode characters.
- `title`: optional string.
- `sourceLabel`: optional string, such as `ChatGPT report`.

Output:

- `structuredContent`: compact model-visible summary:
  - `sessionId`
  - `title`
  - `charCount`
  - `blockCount`
  - `outline`
  - `limits`
  - `nextAction`
- `_meta`: widget-only hydrated review session:
  - full normalized document metadata
  - review blocks
  - empty annotations array
  - import warnings

Annotations:

- `readOnlyHint: true`
- `destructiveHint: false`
- `openWorldHint: false`
- `idempotentHint: true`

Reasoning:

- Importing and rendering a review session does not change external state.
- The tool must not collect raw chat history; it only receives the document explicitly passed by ChatGPT.

### Widget-Only Revision Sending

The first version builds the revision pack in the widget and sends it through the MCP Apps bridge `ui/message`, with `window.openai.sendFollowUpMessage` as a feature-detected ChatGPT fallback. It does not expose a server write tool for sending.

Hard rule:

- The send action is unavailable until the user opens the preview and confirms sending.

## Data Transfer Strategy

- `structuredContent` contains only summary fields and no full document text.
- `_meta.reviewSession.document.blocks` contains the full block payload for widget rendering.
- The revision pack defaults to confirmed annotations only.
- The default follow-up references the original report already in the conversation and includes block IDs, heading paths, quotes, priorities, and requested changes.
- If generated prompt length exceeds the pack budget, compress by section and priority.

## Package Plan

- `packages/annotation-model`: shared Zod schemas, constants, IDs, data types.
- `packages/markdown-block-parser`: Markdown AST to stable block list.
- `packages/review-core`: session reducer, annotation operations, filtering, import/export.
- `packages/revision-prompt-builder`: confirmed annotations to revision prompt.
- `apps/chatgpt-app/server`: Node MCP server using official MCP SDK and Apps helpers.
- `apps/chatgpt-app/web`: React widget, desktop-first.

## Verification Gates

- Unit tests for schemas, session reducer, parser fixtures, and revision prompt builder.
- Build all packages.
- MCP server smoke test with JSON-RPC initialize/tools/list/tools/call where possible.
- Browser visual and interaction test against local widget fallback.
- Reality check:
  - no native ChatGPT bubble modification claims,
  - no silent send path,
  - no mobile support claim,
  - no public submission claim,
  - no GPL/AGPL dependency.

## Known Risks

- Exact ChatGPT bridge behavior can differ from local browser fallback. Treat local browser tests as necessary but not sufficient for public demo claims.
- Long documents can stress iframe rendering. The first hard cap is 100,000 chars or 300 blocks.
- Apps SDK public submission requires hosting, privacy policy, verification, and mobile testing; this implementation targets private developer-mode/demo readiness first.
- Apache-2.0 `LICENSE` exists by owner decision.
