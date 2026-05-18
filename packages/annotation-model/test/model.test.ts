import { describe, expect, it } from "vitest";
import {
  REVIEW_SCHEMA_VERSION,
  makeStableId,
  reviewSessionSchema
} from "../src/index.js";

describe("annotation model", () => {
  it("generates deterministic stable ids", () => {
    expect(makeStableId("b", "same input")).toBe(makeStableId("b", "same input"));
    expect(makeStableId("b", "same input")).not.toBe(
      makeStableId("b", "different input")
    );
  });

  it("validates a minimal review session", () => {
    const session = {
      schemaVersion: REVIEW_SCHEMA_VERSION,
      id: "s_test",
      createdAt: "2026-05-18T00:00:00.000Z",
      updatedAt: "2026-05-18T00:00:00.000Z",
      document: {
        id: "d_test",
        createdAt: "2026-05-18T00:00:00.000Z",
        originalCharCount: 5,
        normalizedCharCount: 5,
        limits: { charHardCap: 100000, blockHardCap: 300 },
        outline: [],
        blocks: [
          {
            id: "b_test",
            ordinal: 0,
            type: "paragraph",
            headingPath: [],
            markdown: "Hello",
            text: "Hello",
            quote: "Hello"
          }
        ]
      },
      annotations: []
    };

    expect(reviewSessionSchema.parse(session).schemaVersion).toBe(
      REVIEW_SCHEMA_VERSION
    );
  });
});
