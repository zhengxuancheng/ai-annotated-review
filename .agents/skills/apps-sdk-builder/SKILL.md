---
name: apps-sdk-builder
description: Use before implementing or reviewing ChatGPT Apps SDK code for this repo. Enforces docs-first Apps SDK work, MCP tool planning, CSP, bridge boundaries, and desktop-first scope.
---

# Apps SDK Builder

Use this skill before any ChatGPT Apps SDK implementation or review.

## Required Checks

1. Fetch current official OpenAI Apps SDK docs before coding.
2. Use MCP Apps standard bridge first: `ui/*` JSON-RPC over `postMessage`.
3. Use `window.openai` only for ChatGPT-specific optional enhancements.
4. Do not claim native ChatGPT message-bubble modification.
5. Define MCP tools before UI work.
6. Set accurate tool annotations.
7. Keep `structuredContent` concise and model-visible.
8. Put large widget-only payloads in `_meta` when appropriate.
9. Define CSP domains explicitly.
10. Require explicit user confirmation before `ui/message` or `sendFollowUpMessage`.
11. Treat desktop ChatGPT as the first target.

## Verification

For implementation tasks, require:

- unit tests where available,
- `npm run build` when package scripts exist,
- MCP Inspector smoke test,
- ChatGPT developer mode smoke test before public claims.

