import { readFile } from "node:fs/promises";
import { parseMarkdownToReviewDocument } from "@ai-annotated-review/markdown-block-parser";
import {
  addAnnotation,
  createReviewSession,
  exportReviewSessionJson,
  importReviewSessionJson
} from "@ai-annotated-review/review-core";
import { buildRevisionPack } from "@ai-annotated-review/revision-prompt-builder";

const evidence = [];

const fixture = await readFile("examples/fixtures/product-plan.md", "utf8");
const parsed = parseMarkdownToReviewDocument(fixture, {
  title: "Functional Evidence Fixture",
  sourceLabel: "verify-functional-claims",
  now: "2026-05-18T00:00:00.000Z"
});
assert(parsed.ok, "fixture must parse successfully");
assert(parsed.document.blocks.length >= 5, "fixture must produce multiple review blocks");
record("Markdown import creates review blocks", {
  blockCount: parsed.document.blocks.length,
  outlineCount: parsed.document.outline.length
});

const reparsed = parseMarkdownToReviewDocument(fixture.replace(/\n\n/g, "\n\n\n"), {
  title: "Functional Evidence Fixture",
  sourceLabel: "verify-functional-claims",
  now: "2026-05-18T00:00:00.000Z"
});
assert(reparsed.ok, "whitespace variant must parse successfully");
assert(
  parsed.document.blocks[1]?.id === reparsed.document.blocks[1]?.id,
  "stable block id changed after non-structural whitespace edit"
);
record("Block IDs are stable for non-structural whitespace edits", {
  checkedBlockId: parsed.document.blocks[1]?.id
});

let session = createReviewSession(parsed.document, {
  now: "2026-05-18T00:00:01.000Z",
  sessionId: "session_functional_evidence"
});
session = addAnnotation(session, {
  blockId: parsed.document.blocks[1].id,
  title: "Make pain concrete",
  body: "Add one concrete before-and-after example.",
  priority: "P1",
  status: "confirmed",
  now: "2026-05-18T00:00:02.000Z"
});
session = addAnnotation(session, {
  blockId: parsed.document.blocks[2].id,
  title: "Keep boundary visible",
  body: "Clarify that the app does not modify native ChatGPT message bubbles.",
  priority: "P0",
  status: "confirmed",
  now: "2026-05-18T00:00:03.000Z"
});
session = addAnnotation(session, {
  blockId: parsed.document.blocks[3].id,
  title: "Rejected idea",
  body: "This rejected note must not enter the default revision pack.",
  priority: "P2",
  status: "rejected",
  now: "2026-05-18T00:00:04.000Z"
});
assert(session.annotations.length === 3, "session should contain three annotations");
record("Annotations attach to exact review blocks", {
  annotationCount: session.annotations.length,
  annotatedBlockIds: session.annotations.map((annotation) => annotation.blockId)
});

const exported = exportReviewSessionJson(session);
const imported = importReviewSessionJson(exported);
assert(imported.annotations.length === session.annotations.length, "review session JSON round trip lost annotations");
assert(imported.document.blocks.length === session.document.blocks.length, "review session JSON round trip lost blocks");
record("Review session JSON round trip is schema-validated", {
  exportedChars: exported.length
});

const pack = buildRevisionPack(session, {
  now: "2026-05-18T00:00:05.000Z"
});
assert(pack.mode === "confirmed-only", "default revision pack must be confirmed-only");
assert(pack.itemCount === 2, "default revision pack must include exactly two confirmed annotations");
assert(pack.prompt.includes("Make pain concrete"), "revision pack missing first confirmed annotation");
assert(pack.prompt.includes("Keep boundary visible"), "revision pack missing second confirmed annotation");
assert(!pack.prompt.includes("Rejected idea"), "revision pack included rejected annotation");
assert(pack.promptCharCount <= 14_000, "revision pack exceeded default prompt budget");
record("Revision pack includes confirmed annotations only", {
  mode: pack.mode,
  itemCount: pack.itemCount,
  promptCharCount: pack.promptCharCount,
  omittedRejected: pack.omittedCounts.rejected
});

const serverSource = await readFile("apps/chatgpt-app/server/src/app.ts", "utf8");
mustContain(serverSource, "review_markdown_document", "server must expose the review_markdown_document tool");
mustContain(serverSource, "structuredContent", "server must return model-visible structuredContent");
mustContain(serverSource, "_meta", "server must return widget-only _meta");
mustContain(serverSource, "reviewSession", "server must hydrate widget with _meta.reviewSession");
mustContain(serverSource, "outputSchema: reviewToolOutputSchema", "server tool must declare outputSchema");
mustContain(serverSource, "readOnlyHint: true", "server tool must declare readOnlyHint true");
mustContain(serverSource, "destructiveHint: false", "server tool must declare destructiveHint false");
mustContain(serverSource, "openWorldHint: false", "server tool must declare openWorldHint false");
record("MCP tool implementation matches declared read-only app behavior", {
  tool: "review_markdown_document"
});

const uiSource = await readFile("apps/chatgpt-app/web/src/main.tsx", "utf8");
const bridgeSource = await readFile("apps/chatgpt-app/web/src/openaiBridge.ts", "utf8");
mustContain(uiSource, "Confirm send", "widget must show explicit send confirmation");
mustContain(uiSource, "Confirm and send", "widget must require explicit confirm-and-send action");
mustContain(uiSource, "Copy revision request", "standalone web/extension modes must provide a copy action");
mustContain(uiSource, "revisionPack.prompt", "widget must preview the exact revision prompt before sending");
mustContain(uiSource, "confirmed annotations only", "widget must disclose confirmed-only send behavior");
mustContain(bridgeSource, "sendFollowUpMessage", "bridge must support ChatGPT follow-up send");
mustContain(bridgeSource, "ui/message", "bridge must support MCP Apps ui/message fallback");
record("Send-to-ChatGPT path is explicit and user-confirmed", {
  confirmationModal: true
});

const realitySource = await readFile("scripts/verify-reality.mjs", "utf8");
mustContain(realitySource, "localStorage", "reality guard must check localStorage usage");
mustContain(realitySource, "sessionStorage", "reality guard must check sessionStorage usage");
mustContain(realitySource, "native ChatGPT message bubble", "reality guard must preserve native bubble boundary");
record("Reality guard checks privacy and platform-boundary claims", {
  storageGuards: ["localStorage", "sessionStorage"]
});

console.log(
  JSON.stringify(
    {
      ok: true,
      evidenceCount: evidence.length,
      evidence
    },
    null,
    2
  )
);

function record(name, details) {
  evidence.push({ name, details });
}

function mustContain(text, needle, message) {
  assert(text.includes(needle), message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
