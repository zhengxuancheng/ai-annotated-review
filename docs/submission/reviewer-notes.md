# Reviewer Notes

## App Summary

AI Annotated Review is a ChatGPT Apps SDK workflow for reviewing long AI-generated Markdown or plain text outputs. It renders an embedded document review widget where users attach comments to specific blocks, confirm the comments that should guide revision, and then explicitly send a revision request back to ChatGPT.

## Boundaries

- The app does not modify ChatGPT native message bubbles.
- The app does not scrape ChatGPT, Claude, Codex, Cursor, VS Code, or browser UI.
- The app does not provide accounts, billing, cloud sync, telemetry, or external LLM API calls in v1.
- The MCP tool is read-only from the external-world perspective. It parses an explicitly supplied document and returns a widget session.
- Sending a revision request is a user-confirmed widget action, not a hidden MCP tool side effect.

## Data Handling

- `structuredContent` contains summary fields only.
- `_meta.reviewSession` contains the full review session for widget hydration.
- The default revision request includes confirmed annotations only.
- Open, resolved, and rejected annotations are excluded from the default revision request.
- The full source document is not resent in the default revision request.

## Authentication

The current v1 design uses no app account authentication.

## Known Pre-Submission Work

- Replace the draft privacy policy with owner-reviewed public policy text.
- Keep the stable Cloudflare Worker production candidate healthy through review.
- Desktop ChatGPT web production connector testing has passed and a production screenshot is available at `docs/submission/screenshots/production-review-widget-desktop.png`.
- Run mobile smoke only if required for final review; v1 remains desktop-first and does not claim mobile support.
