import { parseMarkdownToReviewDocument } from "@ai-annotated-review/markdown-block-parser";
import { createReviewSession } from "@ai-annotated-review/review-core";
import type { ReviewSession } from "@ai-annotated-review/annotation-model";

const SAMPLE_MARKDOWN = `# AI Annotated Review Demo Report

## Context

AI tools can generate long reports quickly, but paragraph-level revision feedback is still hard to capture in a normal chat box.

## Proposal

Build a ChatGPT Apps SDK widget that renders a long response as review blocks. Each block can receive comments, statuses, and priorities.

## Boundary

The app should not claim it modifies ChatGPT native message bubbles. It renders its own embedded review surface and sends a revision request only after confirmation.

## Demo Gate

The demo should include three annotations, at least two confirmed comments, a revision pack preview, and one explicit send action.
`;

export function createSampleSession(): ReviewSession {
  const parsed = parseMarkdownToReviewDocument(SAMPLE_MARKDOWN, {
    title: "AI Annotated Review Demo Report",
    sourceLabel: "Local preview",
    now: "2026-05-18T00:00:00.000Z"
  });
  if (!parsed.ok) {
    throw new Error(parsed.errors.join(" "));
  }
  return createReviewSession(parsed.document, {
    sessionId: "session_local_preview",
    now: "2026-05-18T00:00:00.000Z"
  });
}
