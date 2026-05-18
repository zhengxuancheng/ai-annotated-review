import { describe, expect, it } from "vitest";
import type { ReviewDocument } from "@ai-annotated-review/annotation-model";
import {
  addAnnotation,
  createReviewSession,
  exportReviewSessionJson,
  getAnnotationsByStatus,
  importReviewSessionJson,
  summarizeSession,
  updateAnnotationStatus
} from "../src/index.js";

const document: ReviewDocument = {
  id: "doc_1",
  title: "Fixture",
  createdAt: "2026-05-18T00:00:00.000Z",
  originalCharCount: 12,
  normalizedCharCount: 12,
  limits: { charHardCap: 100000, blockHardCap: 300 },
  outline: [],
  blocks: [
    {
      id: "b_1",
      ordinal: 0,
      type: "paragraph",
      headingPath: [],
      markdown: "Hello world.",
      text: "Hello world.",
      quote: "Hello world."
    }
  ]
};

describe("review core", () => {
  it("adds and confirms an annotation without mutating the original session", () => {
    const session = createReviewSession(document, {
      now: "2026-05-18T00:00:00.000Z",
      sessionId: "session_1"
    });
    const withAnnotation = addAnnotation(session, {
      blockId: "b_1",
      title: "Tighten",
      body: "Make this less generic.",
      priority: "P1",
      now: "2026-05-18T00:01:00.000Z"
    });

    expect(session.annotations).toHaveLength(0);
    expect(withAnnotation.annotations).toHaveLength(1);

    const annotationId = withAnnotation.annotations[0]?.id;
    if (!annotationId) throw new Error("missing annotation id");
    const confirmed = updateAnnotationStatus(
      withAnnotation,
      annotationId,
      "confirmed",
      "2026-05-18T00:02:00.000Z"
    );

    expect(getAnnotationsByStatus(confirmed, ["confirmed"])).toHaveLength(1);
    expect(summarizeSession(confirmed).confirmedCount).toBe(1);
  });

  it("round-trips exported JSON", () => {
    const session = createReviewSession(document, { sessionId: "session_1" });
    const restored = importReviewSessionJson(exportReviewSessionJson(session));
    expect(restored.id).toBe(session.id);
    expect(restored.document.blocks[0]?.quote).toBe("Hello world.");
  });
});
