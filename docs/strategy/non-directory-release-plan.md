# Non-Directory Release Plan

Status: active direction after OpenAI publisher verification blocked official ChatGPT App Directory submission.

## Product Shape

AI Annotated Review is now positioned as an open-source companion workflow for reviewing long AI-generated outputs from ChatGPT, Claude, Codex, Claude Code, and similar assistants.

It is not currently positioned as an officially published ChatGPT App Directory app.

## First Release Targets

1. Public web app
   - Status: implemented as the shared React review UI and served from `/app` by the Node server and Cloudflare Worker.
   - User pastes or imports Markdown/plain text.
   - The app splits it into review blocks.
   - User adds anchored annotations.
   - User confirms the comments that should drive revision.
   - The app generates a revision request.
   - User copies the revision request back into ChatGPT, Claude, Codex, or Claude Code.

2. Browser side panel extension
   - Status: implemented as `apps/browser-extension`.
   - Chrome side panel opens next to ChatGPT or Claude web.
   - User selects text in the page and imports it explicitly.
   - The same review UI runs inside the side panel.
   - No silent full-conversation scraping.

3. CLI adapter
   - Status: implemented as `apps/cli`.
   - Terminal users can create a review session from stdin or a file.
   - They can list block IDs, add annotations, and generate revision packs.
   - This supports Codex CLI, Claude Code, and any tool that can exchange Markdown files.

4. Existing ChatGPT Apps SDK adapter
   - Kept as a technical preview.
   - Still useful for Developer Mode and future verified-publisher submission.

## Future Targets

- Claude Code skill wrapping the CLI workflow.
- Codex skill wrapping the CLI workflow.
- Claude Desktop MCPB package that launches or links to the review surface.
- VS Code/Cursor extension.

Claude Desktop note: Claude Desktop can use MCP/desktop extension packaging later, but that path should expose tools or open/link to the review surface. It should not claim native Claude Desktop chat-bubble annotation.

## Non-Goals

- No native modification of ChatGPT or Claude message bubbles.
- No hidden scraping of chat history.
- No automatic sending of revision prompts.
- No workaround around OpenAI publisher verification.
- No unsupported desktop-app UI injection.

## Public Messaging

Allowed:

- "Works alongside ChatGPT and Claude."
- "Browser side panel for reviewing long AI outputs."
- "Open-source companion workflow for AI-generated reports."
- "ChatGPT Apps SDK technical preview included."

Avoid:

- "Official ChatGPT App."
- "Published in ChatGPT."
- "Modifies ChatGPT/Claude message bubbles."
- "Automatically reads your chats."
