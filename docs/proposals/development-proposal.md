# AI Annotated Review Development Proposal

Date: 2026-05-18
Status: Implemented as private developer-mode demo after owner approval on 2026-05-18. Original external review was `PASS WITH CONDITIONS`; those conditions remain active release gates.

Status note, 2026-05-18: this Phase 0 proposal is historical. The owner later paused official ChatGPT App Directory submission and redirected the active release path to public web app, Chrome side panel extension, and CLI adapter. See `docs/strategy/non-directory-release-plan.md` for the current direction.

## 1. Product Definition

AI Annotated Review is an open-source workflow for reviewing and revising long AI-generated outputs. It lets a user open a long report inside a ChatGPT Apps SDK widget, read it as a document, attach comments to specific blocks, mark which comments are confirmed, and send a precise revision instruction pack back to ChatGPT.

Primary users:

- Builders reviewing AI-generated product plans, research reports, code review reports, technical proposals, translations, and handoff documents.
- AI-heavy creators who need a public, demonstrable workflow for better human-in-the-loop review.
- Open-source contributors who want adapters for ChatGPT, Codex, Claude Code, Cursor, VS Code, and browser workflows.

Problem solved:

- Long AI output is hard to revise from a single bottom chat box.
- Local feedback gets forgotten.
- Paragraph-level discussion gets mixed into global chat context.
- Revision prompts become vague.

Why open source:

- The pain point is broad and easy to demonstrate.
- The core model is reusable across platforms.
- The project can attract community adapters.
- It builds credibility before later products such as NextKey.

## 2. User Workflow

1. User asks ChatGPT to generate a long report.
2. User asks to review the report with AI Annotated Review.
3. ChatGPT calls the app's MCP tool with the report text/Markdown.
4. The widget renders the report as review blocks.
5. User adds comments on exact paragraphs or sections.
6. User discusses locally inside each annotation thread.
7. User marks comments as open, confirmed, resolved, or rejected.
8. User clicks "Build revision pack".
9. The app summarizes confirmed comments and produces revision instructions.
10. User explicitly previews and confirms the follow-up message to ChatGPT.
11. ChatGPT revises the original report using the confirmed comments.

## 3. First Release Scope

Required:

- Import long text/Markdown through ChatGPT tool input.
- Parse Markdown into stable review blocks.
- Generate stable block IDs.
- Render document blocks in an iframe widget.
- Add annotations to blocks.
- Annotation fields: status, priority, title/body, optional local discussion.
- Statuses: open, confirmed, resolved, rejected.
- Sidebar or annotation panel.
- Filter annotations by status and priority.
- Build annotation summary.
- Generate revision instruction pack from confirmed comments.
- Preview and explicitly confirm any follow-up message through Apps SDK bridge if verified.
- Export session JSON.
- No account or cloud sync.

Nice-to-have after first demo:

- Import from uploaded Markdown/text files.
- Fullscreen display mode.
- Search within document.
- Re-anchor annotations after small text edits.
- Comment templates for common review styles.

## 4. Document Length And Data Transfer Strategy

First release must make long-document behavior explicit before implementation.

Provisional v1 desktop limits:

- Target demo range: 20,000 to 60,000 Unicode characters of Markdown/text.
- Initial hard cap: 100,000 Unicode characters or 300 parsed review blocks, whichever comes first.
- Documents above the hard cap should not fail silently. The app should show a clear "document too large for one review session" message and offer a future chunked-review path, not attempt an unreliable full import.

Chunking strategy:

- Prefer heading-based chunks: split at `h1`/`h2`/`h3` boundaries.
- If headings are absent, split by block count while preserving paragraph/list/code/table boundaries.
- Each chunk should carry document ID, chunk ID, heading path, block range, and original-order index.
- v1 may review one imported session in the widget, but revision sending must be able to batch or compress by section.

Model-visible vs widget-only data:

- `structuredContent` should contain only compact model-visible data: session ID, document title if available, block count, outline, annotation counts, and revision-pack preview metadata.
- Full raw document text and full block payloads should be widget-only data in `_meta` where Apps SDK behavior supports it.
- UI state and local annotation drafting should stay inside the widget unless the user asks to build or send a revision pack.
- `ui/update-model-context` should expose only compact state summaries, not the entire document.

Revision-pack strategy:

- Default revision request includes confirmed annotations only.
- Each confirmed item includes block ID, heading path, short quote, priority, and requested change.
- Open, resolved, or rejected comments are excluded unless the user deliberately changes export settings.
- The standard send mode should reference the original report already present in the conversation instead of resending the full document.
- A self-contained send mode may include larger source excerpts only after explicit user confirmation.
- If the revision pack is too long, compress by grouping comments by section, preserving P0/P1 items first, summarizing lower-priority repeated comments, or asking the user to revise in batches.

Hard send boundary:

- Any operation that sends annotation summaries, revision packs, selected source excerpts, or document context back to ChatGPT must require an explicit user click.
- Silent `ui/message` or `sendFollowUpMessage` behavior is not allowed.

## 5. Desktop-Only V1 Experience

V1 targets desktop ChatGPT only.

- Optimize layout, interaction density, keyboard/focus behavior, and demo recording for desktop ChatGPT.
- Mobile support is out of scope for v1.
- Later mobile smoke checks may verify only that the widget does not crash or incoherently cover content.
- Do not add mobile-specific complexity before the desktop demo loop works.

## 6. True Demo Minimum Loop

The first public demo is not accepted until this exact loop works:

1. ChatGPT generates a long report.
2. User opens the report in the review component.
3. The component displays the long document as stable review blocks.
4. User adds comments to at least three paragraphs or sections.
5. User marks exactly two or more comments as `confirmed`.
6. The app generates a revision pack from confirmed comments.
7. User previews and explicitly clicks "Send revision request".
8. ChatGPT rewrites the report according to the confirmed comments.
9. README/demo-script claims match the actual recorded flow.

This loop is a gate for the Apps SDK skeleton, widget UX, and follow-up-message phases, not a final afterthought.

## 7. Non-Goals

- No standalone disconnected local web MVP as the main target.
- No external LLM API integration in first version.
- No billing, subscriptions, credits, or accounts.
- No cloud sync.
- No real-time collaboration.
- No scraping ChatGPT, Claude, Codex, Cursor, or VS Code UIs.
- No modifying native ChatGPT/Claude/Codex message bubbles.
- No unsupported browser extension hacks.
- No GPL/AGPL dependencies unless explicitly approved.
- No mobile-first or mobile-polished v1.
- No silent sending of comments, summaries, prompts, or document excerpts back to ChatGPT.

## 8. Architecture

Recommended monorepo:

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

ChatGPT app:

- MCP server exposes tools and widget resources.
- React widget renders review UI.
- MCP Apps bridge handles tool result input, UI tool calls, model context updates, and follow-up messages.
- ChatGPT-specific `window.openai` APIs are optional enhancements only.

Core packages:

- `annotation-model`: schemas and state machine.
- `markdown-block-parser`: Markdown AST to stable review blocks.
- `review-core`: session reducer, filters, status transitions, import/export.
- `revision-prompt-builder`: confirmed comments to revision instruction pack.

Adapter boundary:

- Core packages never import Apps SDK, Codex, Claude, browser extension, or VS Code APIs.
- Adapters translate platform input/output into core package structures.

## 9. Open-Source Plan

License:

- Current release decision: Apache-2.0 open source.
- The repository includes a `LICENSE` file.
- Do not publish detailed novelty or patentability claims in public launch copy unless the owner separately chooses attorney review.

Repository docs:

- `README.md`: problem, demo, quickstart, boundaries.
- `CONTRIBUTING.md`: setup, coding style, testing, license policy.
- `SECURITY.md`: vulnerability reporting, data handling.
- `docs/architecture.md`: package boundaries and adapter model.
- `docs/demo-script.md`: public video script.
- `docs/privacy-model.md`: first-release data boundaries.
- `docs/adapters.md`: future ChatGPT, Codex, Claude Code, VS Code/Cursor, browser extension adapter guidelines.

Issue templates:

- Bug report.
- Apps SDK compatibility issue.
- Parser fixture request.
- Adapter proposal.
- Good first issue.

## 10. Implementation Phases

### Phase 0A: Repository Initialization And Guardrails

Goal:

- Initialize the repository and lock the open-source-first development workflow without starting product implementation.

Expected files:

- `AGENTS.md`
- `.gitignore`
- `docs/research/*`
- `docs/proposals/*`
- `docs/ip/*`
- `.agents/skills/*` instruction-only drafts

Acceptance criteria:

- Git repository initialized.
- Apache-2.0 `LICENSE` file exists by owner decision.
- No product code yet.
- No package manager dependencies installed.
- No public release or deployment setup.
- "No native ChatGPT bubble modification" boundary documented.
- Desktop-only v1 scope documented.

Verification:

- Manual docs review.
- `git status --short`.
- Confirm no `package.json`, dependency lockfile, or product source directories were created unless separately approved.

Risks:

- Over-planning. Keep this phase short after external review.

### Phase 0B: Proposal Revision Before Implementation

Goal:

- Update the proposal to satisfy the external review conditions before Phase 1 begins.

Expected files:

- Revised `docs/proposals/development-proposal.md`
- Updated feasibility/resource notes if public-facing facts or platform scope changed.

Acceptance criteria:

- Document length and data-transfer strategy is explicit.
- User-confirmed sending is a hard requirement.
- True demo minimum loop is a gate.
- Desktop-only ChatGPT v1 scope is explicit.
- License/public-release decision is explicit.
- External resource metrics are marked as planning-only and must be rechecked before public docs.

Verification:

- Grep for silent-send/native-bubble/mobile/license overclaims.
- Manual review against the external PASS WITH CONDITIONS list.

Risks:

- Drifting back into implementation planning. Stop after documentation is updated.

### Phase 1: Core Data Model And Fixtures

Goal:

- Define platform-agnostic review data structures.

Expected files:

- `packages/annotation-model/src/*`
- `packages/review-core/src/*`
- `examples/fixtures/*.md`
- `packages/*/test/*`

Acceptance criteria:

- Review session schema validates with Zod.
- Status transitions are deterministic.
- Export/import JSON round-trips.
- Confirmed comments can be selected independently from open/rejected comments.

Verification:

- Unit tests.
- Fixture round-trip tests.

Risks:

- Overfitting to ChatGPT. Keep all platform APIs out of core packages.

### Phase 2: Markdown Block Parser

Goal:

- Convert Markdown into stable review blocks.

Expected files:

- `packages/markdown-block-parser/src/*`
- Parser fixtures for headings, lists, tables, blockquotes, code blocks.

Acceptance criteria:

- Blocks preserve document order.
- Stable IDs remain stable across non-structural whitespace changes where practical.
- Blocks carry enough text quote/position data for later re-anchoring.
- Unsafe HTML is sanitized or disabled.

Verification:

- Fixture tests.
- Snapshot tests for block trees.

Risks:

- Stable anchoring is hard. First release should guarantee stable IDs for the original imported document, not perfect reflow after arbitrary edits.

### Phase 3: Revision Prompt Builder

Goal:

- Turn confirmed annotations into precise revision instructions.

Expected files:

- `packages/revision-prompt-builder/src/*`
- `examples/revision-packs/*.md`

Acceptance criteria:

- Only confirmed comments are included by default.
- Each instruction references block ID, heading path, quote snippet, priority, and requested change.
- The generated prompt tells the model to preserve unaffected sections.
- The generated prompt includes enough original context to revise accurately without dumping unnecessary data.

Verification:

- Unit tests.
- Golden fixture tests.
- Reality-check tests for rejected/open comment exclusion.

Risks:

- Prompt packs may become too long. Add compression rules early.

### Phase 4: ChatGPT Apps SDK Skeleton

Goal:

- Build minimal MCP server and widget shell.

Expected files:

- `apps/chatgpt-app/server/src/*`
- `apps/chatgpt-app/web/src/*`
- Apps SDK local run docs.

Acceptance criteria:

- MCP server exposes a render/review tool.
- Widget resource uses `text/html;profile=mcp-app`.
- Tool annotations are accurate.
- CSP is explicit.
- MCP Inspector can call the tool.
- The true demo minimum loop is technically possible with stub data before expanding scope.
- The design preserves model-visible/widget-only data separation.

Verification:

- `npm test`
- `npm run build`
- MCP Inspector smoke test.

Risks:

- Apps SDK docs and runtime behavior can change. Fetch official docs before implementation.

### Phase 5: Review Widget UX

Goal:

- Build the actual annotation review experience.

Expected files:

- React components for document pane, block row, annotation composer, sidebar, filters, revision pack preview.

Acceptance criteria:

- User can annotate exact blocks.
- User can change status and priority.
- UI works on desktop ChatGPT in inline mode and fullscreen where supported.
- Text does not overlap on desktop.
- Annotation panel stays usable for long documents.
- Mobile polish is explicitly deferred.

Verification:

- Playwright screenshots.
- Keyboard and focus checks.
- Manual ChatGPT developer mode test.

Risks:

- Widget height and iframe constraints. Use Apps SDK display mode APIs if needed.

### Phase 6: Follow-Up Message Integration

Goal:

- Send or prepare revision request back to ChatGPT.

Expected files:

- Bridge helper for `ui/message`.
- Fallback copy/export flow if host behavior is unavailable.

Acceptance criteria:

- User can preview the revision message before sending.
- Sending requires explicit user confirmation.
- Follow-up message includes original document reference and confirmed instructions.
- Full document text is not resent by default.
- Fallback export works.

Verification:

- Developer mode test in ChatGPT.
- UI test for preview and fallback.

Risks:

- Host may vary by user or environment. Feature-detect and degrade gracefully.

### Phase 7: Public Demo Hardening

Goal:

- Make it publishable as an open-source demo.

Expected files:

- `docs/demo-script.md`
- `docs/privacy-model.md`
- Screenshots or short demo assets.
- Example report fixture.

Acceptance criteria:

- Demo works end-to-end.
- README does not overclaim platform capabilities.
- Privacy claims match tool behavior.
- No secrets, tokens, or raw logs in examples.
- External resource metrics such as GitHub stars, license, and update dates are rechecked before public publication.

Verification:

- Fresh clone setup.
- License check.
- Apps SDK developer mode run.
- Desktop ChatGPT smoke test.

Risks:

- Public submission requirements may require hosting, privacy policy, and verified publisher identity.

## 11. Resource Usage

Use:

- Official Apps SDK examples: MIT, direct fit.
- `@modelcontextprotocol/sdk`: MIT on npm, official SDK.
- `@modelcontextprotocol/ext-apps`: MIT, direct Apps UI helper.
- `@openai/apps-sdk-ui`: MIT, optional ChatGPT-consistent UI primitives.
- `unified`, `remark-parse`, `remark-gfm`, `mdast-util-from-markdown`: MIT, mature Markdown AST ecosystem.
- `zod`: MIT, schema validation.
- `hast-util-sanitize` or strict Markdown rendering defaults for safety.
- `@floating-ui/react`: MIT for comments/popovers.
- `lucide-react`: ISC for icons.
- `idb-keyval` or `dexie`: Apache-2.0 only if browser persistence is needed.

Avoid for first release:

- ProseMirror/TipTap unless editing becomes core.
- Full annotation platforms such as Hypothesis, Taguette, dokieli, Recogito. They are useful prior art but too heavy for this target.
- Recogito Studio specifically because it is AGPL-3.0.
- Browser extension frameworks for first release.

Public-resource fact-check rule:

- GitHub stars, update dates, and license observations in research docs are planning notes only.
- Recheck them live before copying them into public README, website, video captions, or launch posts.

## 12. Public Demo And Video Strategy

Short video structure:

1. Show the pain: long AI report, user scrolling, feedback lost.
2. Show the shift: "Open in annotation review mode."
3. Add three paragraph comments while reading.
4. Confirm two comments and reject one.
5. Click "Build revision pack."
6. Click "Send revision request."
7. ChatGPT revises the report according to exact local feedback.
8. End with GitHub call for adapters and parser fixtures.

Recording priority:

- Record desktop ChatGPT only for v1.
- Do not present mobile support in the first video.

Core message:

"AI can write long documents. Humans still need a sane way to review them."

Contributor invitation:

- Add platform adapters.
- Add parser fixtures.
- Improve revision prompt templates.
- Test with real long reports.
- Add accessibility fixes.
- Add later mobile smoke/polish after desktop v1 is stable.

## 13. Final Recommendation

Original recommendation before owner approval: proceed with Phase 0A/0B only.

Current status after owner approval: the ChatGPT Apps SDK private developer-mode implementation exists in this repository. Codex remains the builder and later adapter target, not the first product surface. The first implementation is a desktop ChatGPT Apps SDK workflow with portable core packages, not a disconnected paste-and-export local MVP.

Open owner questions:

- Final project name and public brand.
- Whether to support English only first or bilingual UI.
- Whether first demo should target product plans, code review reports, or research reports.
- Whether public submission to the ChatGPT Apps Directory is required for v1 or only developer-mode demo.
