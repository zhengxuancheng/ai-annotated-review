---
name: annotation-review-workflow
description: Use when designing or reviewing annotation schemas, Markdown block parsing, stable block IDs, comment states, revision packs, or import/export behavior.
---

# Annotation Review Workflow

Use this skill for the product's core review model.

## Core Rules

1. Keep core packages platform-agnostic.
2. Do not import Apps SDK, Codex, Claude, browser extension, VS Code, or Cursor APIs into core packages.
3. Model annotations as anchored to review blocks, not raw line numbers only.
4. Store enough anchor data for future re-anchoring: block ID, heading path, text quote, and position when available.
5. Status values should include `open`, `confirmed`, `resolved`, and `rejected`.
6. Revision packs include confirmed annotations by default.
7. Open or rejected annotations must not be sent as revision requirements unless the user explicitly chooses that mode.
8. Long-document behavior must be explicit: chunking, model-visible context, widget-only payloads, and revision-pack compression.

## Output

For designs or reviews, return:

- schema implications,
- anchoring implications,
- model-visible data implications,
- verification fixtures needed.

