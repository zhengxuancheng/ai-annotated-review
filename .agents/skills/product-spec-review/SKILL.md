---
name: product-spec-review
description: Use when reviewing or revising product scope, demo scope, public claims, roadmap, or acceptance criteria for AI Annotated Review.
---

# Product Spec Review

Use this skill to keep product planning concrete and bounded.

## Review Checks

1. Identify the target user and job-to-be-done.
2. Separate first release, future adapters, and non-goals.
3. Flag any claim that implies native ChatGPT/Claude/Codex message-bubble modification.
4. Confirm v1 is desktop ChatGPT Apps SDK only unless the owner changes scope.
5. Require a true demo loop:
   - ChatGPT generates a long report.
   - User opens the review component.
   - User annotates at least three blocks.
   - User confirms two comments.
   - App builds a revision pack.
   - User explicitly sends the revision request.
   - ChatGPT revises the report.
6. Require explicit user confirmation before sending any annotation summary or revision pack back to ChatGPT.

## Output

Return a verdict:

- `ACCEPTED`
- `ACCEPTED WITH CONDITIONS`
- `NOT ACCEPTED`

List blockers before suggestions.

