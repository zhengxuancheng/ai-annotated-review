# Patentability Notes

Date: 2026-05-18
Status: non-legal planning note. This is not legal advice.

Owner decision on 2026-05-18: proceed with a public Apache-2.0 open-source release path. These notes remain as cautionary context, not as a blocker to adding the license file.

## Possible Technical Invention Points

Discuss with a patent professional before public disclosure if any of these become central and technically specific:

- Stable block identity for AI-generated Markdown that survives local formatting changes while preserving paragraph-level review anchors.
- A review-session model that converts block-anchored human annotations into model-consumable revision instructions with traceable status, priority, and original-context references.
- A platform-neutral annotation core that maps the same review session into ChatGPT Apps SDK, Codex, Claude Code, VS Code/Cursor, and browser-extension adapters.
- A controlled follow-up message mechanism that lets an embedded AI app summarize confirmed annotations and request revision without exposing unrelated conversation history.
- Re-anchoring annotations across AI-revised document versions using text quote selectors, block hashes, heading paths, and model-generated revision metadata.

Do not publish detailed novelty claims around these points until the owner decides whether to consult counsel.

## Likely Prior Art Categories

Expect substantial prior art in:

- Google Docs, Microsoft Word, Notion, GitHub review comments, and PDF annotation workflows.
- W3C Web Annotation Data Model, including text quote and text position selector concepts.
- Hypothesis, Taguette, dokieli, Annotorious, Recogito, and other web/document annotation systems.
- AI coding-agent plan review tools such as Plannotator.
- ChatGPT Canvas and other AI-assisted document editing/revision products.
- Prompt builders and structured feedback summarizers for LLM revision.

## Attorney Discussion Checklist

Before public release, ask counsel:

- Whether any technical mechanism is novel beyond common document comments plus prompt generation.
- Whether to file a provisional application before publishing source, demos, or architecture diagrams.
- Whether public GitHub release, demo videos, conference posts, or README details would count as enabling disclosure.
- Whether US grace-period rules are enough for the owner's goals, given that many jurisdictions are stricter about pre-filing disclosure.
- Whether using Apache-2.0 conflicts with any desired patent enforcement or licensing strategy.
- Whether contributor license agreement, DCO, or inbound=outbound policy should be used.

## Apache-2.0 Consideration

Apache-2.0 is usually appropriate for a commercially usable open-source developer tool because it is permissive and includes an explicit patent license from contributors.

If patent protection is a serious goal, decide the patent strategy before releasing under Apache-2.0. Apache-2.0 can make adoption easier, but it also grants patent rights to users for contributed code. That may be desirable for open-source trust, but it can limit later patent leverage over the released implementation.

Current release decision: the owner chose Apache-2.0. The repository now includes a `LICENSE` file. Do not publish detailed novelty or patentability claims in public launch copy unless the owner separately chooses attorney review.

## Open-Source Release Impact

Public source release, public demos, and detailed README explanations can become prior-art or disclosure events. They may affect filing strategy, especially outside the United States.

Practical recommendation:

- Keep public docs focused on user value and implementation boundaries.
- Avoid detailed public novelty claims.
- Consider counsel review before releasing detailed algorithms for stable anchoring, re-anchoring, or revision-pack generation if those become strategically important.

## Reference Starting Points

- USPTO provisional application page, including the US one-year grace period note and foreign-rights warning: https://www.uspto.gov/patents-getting-started/patent-basics/types-patent-applications/provisional-application-patent
- W3C Web Annotation Data Model: https://www.w3.org/TR/annotation-model/
- Apache License 2.0 text: https://www.apache.org/licenses/LICENSE-2.0
