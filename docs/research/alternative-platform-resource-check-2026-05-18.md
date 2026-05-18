# Alternative Platform Resource Check - 2026-05-18

Status: accepted with boundaries.

## Decision

The project will no longer depend on public ChatGPT App Directory submission for the first public release.

The release path becomes:

1. Public web entry for paste-based review.
2. Browser side panel extension for ChatGPT and Claude web.
3. CLI adapter for Codex CLI, Claude Code, and other terminal workflows.
4. ChatGPT Apps SDK/MCP remains as a technical preview and future official-submission path.
5. Claude Desktop support remains a later MCPB/desktop-extension adapter, not a native chat-bubble UI integration.

## Resources Considered

| Resource | License / terms | Maintenance signal | Fit | Decision |
| --- | --- | --- | --- | --- |
| Chrome Side Panel API | Chrome official docs/code samples Apache-2.0 | Official Chrome API, MV3, Chrome 114+ | Best fit for a companion panel beside ChatGPT and Claude web | Accept |
| Chrome Scripting API | Chrome official docs/code samples Apache-2.0 | Official Chrome API | Needed to read selected text after explicit user action | Accept with exact host permissions |
| Chrome Web Store distribution | Google platform terms | Official distribution path | Required for normal Chrome install on Windows/macOS | Later release gate |
| WXT | MIT | Active extension framework | Good for larger extension lifecycle | Defer; current MVP can use existing Vite + official MV3 APIs |
| Plasmo | MIT | Useful, but mixed maintenance signals in community reports | Heavier than needed for first side panel | Defer |
| Claude Code skills | Anthropic official docs | Official Claude Code feature | Good adapter for terminal users; can wrap CLI workflows | Accept later |
| Claude Desktop MCPB desktop extensions | Anthropic official docs | Official Claude Desktop local MCP packaging | Good for Claude Desktop tool access, but not a native annotation UI | Accept later |
| Hypothesis / Recogito / W3C Web Annotation | Mixed permissive/open standards | Mature references | Useful prior art for annotation model | Reference only |

## Platform Boundaries

- The browser extension must not automatically scrape full ChatGPT or Claude conversations.
- The extension should read only user-selected text or text the user pastes/imports.
- Host permissions should stay narrow: `chatgpt.com`, `chat.openai.com`, and `claude.ai`.
- Sending revision requests back to ChatGPT or Claude remains user-controlled copy/paste or explicit action.
- The CLI adapter cannot modify Codex CLI or Claude Code native terminal UI. It creates review artifacts and revision packs that the user or agent can feed back into the CLI conversation.
- Claude Desktop support should use MCP/desktop extension packaging and/or open the public web review surface; it should not claim embedded native Claude Desktop annotations.

## Implementation Recommendation

Implement the first alternative release as a shared-core product:

- `apps/chatgpt-app/web`: keep as the reusable React review surface and add standalone import.
- `apps/browser-extension`: package the same review surface as a Chrome side panel.
- `apps/cli`: provide a small dependency-light CLI around the existing parser, session model, and revision prompt builder.
- `docs/strategy/non-directory-release-plan.md`: keep public messaging honest.

No new large dependency is required for the first pass.
