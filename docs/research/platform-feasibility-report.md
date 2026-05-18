# Product And Platform Feasibility Report

Date: 2026-05-18
Project: AI Annotated Review
Status: feasibility report only. No product implementation has started.

## Executive Verdict

ChatGPT Apps SDK is the right first target.

The intended workflow depends on reviewing a long AI response inside the AI conversation context. A standalone paste-in web MVP would be technically easier, but it would not solve the core product positioning. Apps SDK supports the realistic shape: ChatGPT calls an MCP tool, the app renders an iframe widget, the user annotates a structured document inside that widget, and the widget can ask the host to post a follow-up revision message.

Important boundary: the app cannot and should not claim it modifies native ChatGPT message bubbles. It renders its own reviewable document in an embedded component.

Post-review scope decision: v1 targets desktop ChatGPT only. Mobile is deferred and should not shape the first implementation beyond later non-crash smoke testing.

## ChatGPT Apps SDK Feasibility

### What Can Be Built

Official Apps SDK docs support:

- An MCP server that defines tools and exposes them to ChatGPT.
- An optional web component rendered inside ChatGPT in an iframe.
- MCP Apps UI bridge communication using JSON-RPC over `postMessage`.
- Tool result delivery to the iframe through `ui/notifications/tool-result`.
- UI-initiated tool calls through `tools/call`.
- Model-visible context updates through `ui/update-model-context`.
- Follow-up messages through the MCP Apps standard `ui/message`, with ChatGPT compatibility through `window.openai.sendFollowUpMessage`.
- Widget state persistence for the lifetime of the message-scoped widget through `window.openai.widgetState` and `window.openai.setWidgetState`.
- Optional ChatGPT extensions for file upload, file selection, modals, display mode, and external links.

Sources:

- https://developers.openai.com/apps-sdk/quickstart
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/build/chatgpt-ui
- https://developers.openai.com/apps-sdk/build/state-management
- https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
- https://developers.openai.com/apps-sdk/reference

### Component State

The Apps SDK state model is compatible with this product:

- Business data should live on the MCP server or backend.
- Ephemeral UI state should live inside the widget.
- Widget state is message-scoped and can persist while the message exists.
- Cross-session state requires backend storage.

First release should avoid accounts and cloud sync. Store the review session in widget state and server/tool result state for the current conversation. Add export JSON so the user can preserve a session without a backend account.

### Sending Data Back To ChatGPT

Feasible:

- The widget can call app tools with `tools/call`.
- The widget can update model-visible context with `ui/update-model-context`.
- The widget can ask the host to post a user follow-up message with `ui/message`.
- ChatGPT-specific compatibility exposes `window.openai.sendFollowUpMessage`.

Product interpretation:

- The first version should generate a "revision instruction pack" and offer a button such as "Send revision request".
- The follow-up message must be explicit and reviewable by the user before sending.
- Silent sending of annotation summaries, source excerpts, or revision packs is not allowed.
- The app should not silently revise or submit external content.

### Developer Mode And Public Submission

Development requires:

- A local MCP server.
- A public HTTPS tunnel or hosted endpoint for ChatGPT developer mode.
- Developer mode enabled in ChatGPT settings.
- MCP Inspector for local testing.

Public submission requires:

- Hosted public MCP server.
- Organization or individual verification.
- CSP metadata.
- Privacy policy.
- App name, logo, description, screenshots, test prompts, and test responses.
- Accurate tool annotations.
- Web and mobile testing before directory submission. This does not change the v1 build target: desktop ChatGPT is first, and public submission should wait until any required mobile smoke checks are real.

OpenAI docs state the app directory and Apps SDK are currently in beta, review timelines vary, and enhanced directory distribution is not guaranteed.

Sources:

- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines

### Security And Privacy Requirements

Key requirements from official guidelines:

- Tools must request minimum necessary inputs.
- Do not request full raw chat transcripts "just in case".
- Tool responses must avoid unnecessary personal data, telemetry, internal IDs, trace IDs, logs, or secrets.
- Apps must provide a clear privacy policy for submission.
- Tool annotations must accurately mark read-only, destructive, and open-world behavior.
- Apps must not scrape third-party services or function as unofficial connectors.
- Iframe embedding via `frameDomains` is discouraged and likely to receive extra review.

Product impact:

- First release should be no-auth, no-cloud-sync, no external LLM API, no scraping.
- Inputs should be only the document text/Markdown and user-created annotations.
- Revision prompt generation should happen locally/server-side with no third-party API.
- Full raw documents should not be pushed back into model-visible context by default. Confirmed annotations plus necessary quote/context snippets should be the default send payload.

### Long Document Feasibility Boundary

The first implementation should define explicit limits rather than pretending every "long" document is safe.

Recommended v1 planning limits:

- Target desktop demo: 20,000 to 60,000 Unicode characters.
- Initial hard cap: 100,000 Unicode characters or 300 review blocks.
- Above the cap: show a clear oversized-document state and defer full chunked-review support.

Data-transfer policy:

- Keep full block payloads and raw document text widget-only where possible.
- Keep model-visible `structuredContent` compact: session ID, outline, block count, annotation counts, and revision-pack metadata.
- Send confirmed comments and necessary local context back to ChatGPT only after explicit user confirmation.
- Compress large revision packs by section and priority or split them into batches.

### Monetization Limitations

Official submission guidelines currently allow commerce only for physical goods. Selling digital services, subscriptions, tokens, credits, or digital content inside Apps is not allowed.

Product impact:

- Do not design first release around billing.
- Treat this as an open-source credibility and demo project.
- If monetization becomes important later, keep it outside the ChatGPT app until policy changes.

Source: https://developers.openai.com/apps-sdk/app-submission-guidelines

## Codex Platform Feasibility

Codex is better as the builder and later adapter target, not the first product platform.

What Codex supports today:

- Repo instructions via `AGENTS.md`.
- Agent Skills in CLI, IDE extension, and app.
- Plugins that can bundle skills, MCP config, app mappings, hooks, and assets.
- Apps/connectors configuration and tool approval controls.
- Multi-agent workflows.

What is not clearly suitable:

- A first-class inline document annotation UI inside Codex chat.
- Direct modification of Codex native response UI.

Best use:

- Build the project with Codex.
- Later add a Codex adapter that works through files, CLI, and maybe a plugin/skill:
  - ingest Markdown report from a file,
  - open local review UI or produce annotation JSON,
  - generate revision instructions for Codex.

Sources:

- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/plugins/build
- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/apps-sdk/deploy/submission

## Claude Code Feasibility

Claude Code should be secondary.

Likely adapter shape:

- A Claude Code skill/plugin or command that operates on files.
- It can read a long report file, run the shared parser, accept annotation JSON or launch a local review UI, and produce revision instructions.
- It should not claim to modify Claude's native chat UI.

Limits:

- Native Claude message bubble annotation is not a realistic first target.
- Claude-specific skill/plugin files should be adapters around the shared core, not the source of truth.

Recommendation:

- Design core packages in a platform-neutral way.
- Add Claude Code support after the ChatGPT app and CLI/file workflow are stable.

## Existing Products And Open-Source Resources

### Closest Existing Product: Plannotator

Observed:

- Repository: https://github.com/backnotprop/plannotator
- License: Apache-2.0.
- Public activity metrics are intentionally omitted from this repo document. Recheck directly on GitHub before citing stars, update dates, or maintenance status in public-facing material.
- Description: visually annotate and review coding agent plans and code diffs, then send feedback to agents.

Implication:

- A standalone local markdown annotation tool is not differentiated enough.
- This project should learn from Plannotator but focus on ChatGPT Apps SDK integration and a platform-agnostic annotation/revision core.

### General Web Annotation

Relevant references:

- W3C Web Annotation Data Model: https://www.w3.org/TR/annotation-model/
- Hypothesis server `hypothesis/h`: BSD-2-Clause, mature, web annotation focus.
- Hypothesis client: active, but GitHub API reported "Other" license in this run, so license needs manual review before reuse.
- Taguette: BSD-3-Clause qualitative research annotation tool.
- Annotorious: BSD-3-Clause, image annotation focus.
- Recogito Studio: AGPL-3.0, avoid for this project unless explicitly approved.
- dokieli: Apache-2.0 decentralized article publishing and annotations, useful as conceptual prior art.

Implication:

- Use W3C Web Annotation vocabulary concepts, especially `TextQuoteSelector` and `TextPositionSelector`, as conceptual inspiration.
- Do not embed heavyweight annotation platforms in first release.
- Avoid AGPL/GPL annotation systems.

### Markdown And UI Packages

Recommended mature packages:

- `unified`, `remark-parse`, `remark-gfm`, `mdast-util-from-markdown`: MIT. Good for Markdown parsing and block AST work.
- `react-markdown`: MIT. Good for rendering, but custom block rendering may be needed.
- `hast-util-sanitize`: MIT. Useful for safe HTML handling.
- `zod`: MIT. Good for schema validation.
- `@modelcontextprotocol/sdk`: MIT on npm.
- `@modelcontextprotocol/ext-apps`: MIT on npm.
- `@openai/apps-sdk-ui`: MIT.
- `nanoid`: MIT for IDs where random IDs are needed.
- `idb-keyval` or `dexie`: Apache-2.0 for browser persistence if needed.
- `@floating-ui/react`: MIT for annotation popovers.
- `lucide-react`: ISC for icons.

Use cautiously or defer:

- ProseMirror and TipTap: MIT and mature, but overpowered for first release unless inline editing becomes central.
- MDXEditor: MIT, useful later if the product becomes an editor rather than a reviewer.
- `diff-match-patch`: Apache-2.0 but older npm package. Use only if robust text re-anchoring is needed.
- Full-text search libraries: defer unless large-document search becomes a real feature.

Avoid:

- AGPL/GPL document annotation systems unless approved.
- Browser-extension hacks that scrape or mutate ChatGPT/Claude/Codex UIs.
- Unofficial connectors to third-party chat products.

## Best First Public Demo

Demo title:

"Fixing a long AI report without losing paragraph-level feedback."

Flow:

1. Ask ChatGPT to generate a long project proposal or code review report.
2. Ask ChatGPT to open it in AI Annotated Review.
3. The app renders the report as blocks with stable IDs.
4. The user adds comments to exact paragraphs.
5. The user marks selected comments as confirmed.
6. The app generates a revision instruction pack.
7. The user previews and explicitly sends a follow-up message to ChatGPT asking it to revise the original report according to confirmed comments.
8. ChatGPT produces the revised report.

The "wow moment":

The user clicks "Send revision request" and ChatGPT receives a precise paragraph-anchored instruction pack instead of vague bottom-box feedback.

## Architecture Recommendation

Use a monorepo:

```text
apps/chatgpt-app/
  server/
  web/
packages/annotation-model/
packages/markdown-block-parser/
packages/review-core/
packages/revision-prompt-builder/
docs/
examples/
```

Platform-agnostic:

- Annotation schema.
- Markdown block parser.
- Stable block ID generation.
- Comment state machine.
- Revision prompt builder.
- Import/export session JSON.

ChatGPT-specific:

- MCP server.
- Tool descriptors and annotations.
- Widget resource registration.
- CSP and domain metadata.
- Apps SDK bridge wrapper.
- Follow-up message integration.
- Developer mode and submission docs.

## Risks

- Apps SDK behavior and submission policies are still beta and can change.
- Public directory discovery is not guaranteed.
- Follow-up messages are supported by bridge APIs, but UX details must be verified in ChatGPT developer mode.
- Message-scoped widget state is not a substitute for durable storage.
- Long document payloads may exceed practical tool/context limits; first release should use trimmed `structuredContent` and put large widget-only payloads in `_meta`.
- If the app requests raw full chat history or broad context, it may violate privacy expectations and submission guidelines.
- If the README overclaims native message-bubble annotation, the project will lose credibility.

## Final Feasibility Recommendation

Proceed with a ChatGPT Apps SDK first implementation after external proposal review.

The first release should be a production-quality public demo, not a disposable local MVP. The core packages should stay platform-agnostic so Codex, Claude Code, VS Code/Cursor, and browser extension adapters can be added later without rewriting the annotation model.
