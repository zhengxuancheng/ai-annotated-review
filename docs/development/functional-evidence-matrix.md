# Functional Evidence Matrix

Status: source-level, local-runtime, local Worker-runtime, production remote-smoke, and production-candidate ChatGPT Developer Mode evidence. This is not a public ChatGPT approval record.

Run:

```bash
npm run verify:functionality
```

This command builds the repo, runs a functional claim verifier, starts the MCP smoke test, and runs the desktop widget smoke test.

## Evidence Scope

| Product claim | Evidence source | Verification |
| --- | --- | --- |
| Markdown/plain text can be opened as review blocks | `packages/markdown-block-parser/src/index.ts` | `verify-functional-claims` parses `examples/fixtures/product-plan.md` and asserts multiple blocks. |
| Block IDs are stable for non-structural whitespace edits | `packages/markdown-block-parser/src/index.ts` | `verify-functional-claims` parses a whitespace variant and compares a block ID. |
| Annotations attach to exact blocks | `packages/review-core/src/index.ts` | `verify-functional-claims` creates a session and attaches three annotations to three block IDs. |
| Review sessions can round-trip through JSON | `packages/review-core/src/index.ts` | `verify-functional-claims` exports and imports a session through the Zod schema. |
| Revision packs include confirmed annotations only by default | `packages/revision-prompt-builder/src/index.ts` | `verify-functional-claims` confirms two annotations, rejects one, and asserts the rejected title is absent from the pack. |
| The MCP tool is real and read-only | `apps/chatgpt-app/server/src/app.ts` | `smoke:mcp` calls `initialize`, `tools/list`, and `tools/call`; `verify-functional-claims` checks annotations and `outputSchema`. |
| Full document payload is widget-only, not model-visible | `apps/chatgpt-app/server/src/app.ts` | `smoke:mcp` asserts `structuredContent` does not contain fixture paragraph text and `_meta.reviewSession` contains blocks. |
| Widget renders and supports the golden review flow | `apps/chatgpt-app/web/src/main.tsx` | `smoke:ui` adds three annotations through the inline composer, confirms two, builds a pack, verifies confirmed-only content, checks build-pack scrolling in a narrow viewport, verifies direct copy mode, and opens the confirmation modal only for send mode. |
| Sending back to ChatGPT requires explicit user confirmation | `apps/chatgpt-app/web/src/main.tsx`, `apps/chatgpt-app/web/src/openaiBridge.ts` | `smoke:ui` requires the `Confirm send` modal; `verify-functional-claims` checks the send path and preview. |
| ChatGPT can receive the confirmed revision request through the host bridge | ChatGPT web Developer Mode | `docs/submission/live-validation-report.md` records a successful stable Cloudflare Worker pass where the widget showed `Revision request sent.` and ChatGPT revised the document. |
| Public claims do not overstate platform capability | `scripts/verify-reality.mjs` | `verify:reality` blocks native-bubble claims, storage drift, exact GitHub star claims, and missing confirmation UI. |
| Cloudflare Worker adapter can serve the same MCP app | `apps/chatgpt-app/cloudflare-worker/src/index.ts` | Worker dry-run build passed, and local Worker smoke hit `/health`, `/privacy`, `initialize`, `tools/list`, `tools/call`, and `resources/read`. |

## Remaining Non-Local Evidence

The following cannot be proven by local scripts alone:

- Mobile ChatGPT behavior, even as a smoke-only v1 check.
- OpenAI submission review and approval.

These must be recorded separately after real ChatGPT or OpenAI review testing.
