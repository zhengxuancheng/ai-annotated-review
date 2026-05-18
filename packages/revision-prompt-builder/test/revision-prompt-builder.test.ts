import { describe, expect, it } from "vitest";
import type { ReviewDocument } from "@ai-annotated-review/annotation-model";
import {
  addAnnotation,
  createReviewSession,
  updateAnnotationStatus
} from "@ai-annotated-review/review-core";
import { buildRevisionPack } from "../src/index.js";

const document: ReviewDocument = {
  id: "doc_1",
  title: "Long Report",
  createdAt: "2026-05-18T00:00:00.000Z",
  originalCharCount: 100,
  normalizedCharCount: 100,
  limits: { charHardCap: 100000, blockHardCap: 300 },
  outline: [],
  blocks: [
    {
      id: "b_1",
      ordinal: 0,
      type: "paragraph",
      headingPath: ["Intro"],
      markdown: "This is too vague.",
      text: "This is too vague.",
      quote: "This is too vague."
    },
    {
      id: "b_2",
      ordinal: 1,
      type: "paragraph",
      headingPath: ["Scope"],
      markdown: "Keep this.",
      text: "Keep this.",
      quote: "Keep this."
    }
  ]
};

describe("revision prompt builder", () => {
  it("includes confirmed annotations and excludes open annotations by default", () => {
    let session = createReviewSession(document, { sessionId: "session_1" });
    session = addAnnotation(session, {
      blockId: "b_1",
      title: "Make concrete",
      body: "Replace vague wording with measurable criteria.",
      priority: "P1"
    });
    session = addAnnotation(session, {
      blockId: "b_2",
      title: "Open note",
      body: "This should stay out until confirmed.",
      priority: "P2"
    });

    const confirmedId = session.annotations[0]?.id;
    if (!confirmedId) throw new Error("missing annotation id");
    session = updateAnnotationStatus(session, confirmedId, "confirmed");

    const pack = buildRevisionPack(session, {
      now: "2026-05-18T00:00:00.000Z"
    });

    expect(pack.itemCount).toBe(1);
    expect(pack.prompt).toContain("Make concrete");
    expect(pack.prompt).not.toContain("Open note");
    expect(pack.omittedCounts.open).toBe(1);
    expect(pack.prompt).toContain("dictated");
    expect(pack.prompt).toContain("speech-recognition");
  });

  it("compresses when the prompt budget is small", () => {
    let session = createReviewSession(document, { sessionId: "session_1" });
    session = addAnnotation(session, {
      blockId: "b_1",
      title: "Make concrete",
      body: "Replace vague wording with measurable criteria.",
      priority: "P1",
      status: "confirmed"
    });

    const pack = buildRevisionPack(session, { promptBudget: 400 });
    expect(pack.prompt.length).toBeLessThanOrEqual(400);
    expect(pack.itemCount).toBe(1);
  });

  it("rejects unsafe empty status selections and too-small budgets", () => {
    const session = createReviewSession(document, { sessionId: "session_1" });

    expect(() => buildRevisionPack(session, { statuses: [] })).toThrow(
      "At least one annotation status"
    );
    expect(() => buildRevisionPack(session, { promptBudget: 80 })).toThrow(
      "Prompt budget must be at least"
    );
  });
});
