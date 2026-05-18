import { describe, expect, it } from "vitest";
import { parseMarkdownToReviewDocument } from "../src/index.js";

const SAMPLE = `# Review Plan

Intro paragraph with **formatting**.

## Scope

- First item
- Second item

| Field | Value |
| --- | --- |
| Status | Draft |

\`\`\`ts
const answer = 42;
\`\`\`
`;

describe("markdown block parser", () => {
  it("parses top-level Markdown blocks in document order", () => {
    const result = parseMarkdownToReviewDocument(SAMPLE, {
      title: "Sample",
      now: "2026-05-18T00:00:00.000Z"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errors.join(", "));

    expect(result.document.blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "heading",
      "list",
      "table",
      "code"
    ]);
    expect(result.document.outline.map((item) => item.title)).toEqual([
      "Review Plan",
      "Scope"
    ]);
    expect(result.document.blocks[3]?.headingPath).toEqual([
      "Review Plan",
      "Scope"
    ]);
  });

  it("keeps block ids stable across non-structural whitespace changes", () => {
    const compact = parseMarkdownToReviewDocument(SAMPLE);
    const spaced = parseMarkdownToReviewDocument(SAMPLE.replace("Intro paragraph", "Intro   paragraph"));
    expect(compact.ok && spaced.ok).toBe(true);
    if (!compact.ok || !spaced.ok) throw new Error("parse failed");

    expect(compact.document.blocks[1]?.id).toBe(spaced.document.blocks[1]?.id);
  });

  it("rejects documents above configured hard caps", () => {
    const result = parseMarkdownToReviewDocument("# Big\n\nText", {
      charHardCap: 4
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.errors[0]).toContain("hard cap");
  });
});
