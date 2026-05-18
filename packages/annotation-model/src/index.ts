import { z } from "zod";

export const REVIEW_SCHEMA_VERSION = "1.0";
export const DOCUMENT_CHAR_HARD_CAP = 100_000;
export const REVIEW_BLOCK_HARD_CAP = 300;
export const BLOCK_QUOTE_CHAR_LIMIT = 320;
export const REVISION_PACK_CHAR_BUDGET = 14_000;

export const annotationStatusSchema = z.enum([
  "open",
  "confirmed",
  "resolved",
  "rejected"
]);

export const annotationPrioritySchema = z.enum(["P0", "P1", "P2", "P3"]);

export const reviewBlockTypeSchema = z.enum([
  "heading",
  "paragraph",
  "list",
  "blockquote",
  "code",
  "table",
  "thematicBreak",
  "html",
  "definition",
  "unknown"
]);

export const textPositionSchema = z.object({
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  startOffset: z.number().int().nonnegative().optional(),
  endOffset: z.number().int().nonnegative().optional()
});

export const reviewBlockSchema = z.object({
  id: z.string().min(1),
  ordinal: z.number().int().nonnegative(),
  type: reviewBlockTypeSchema,
  depth: z.number().int().positive().max(6).optional(),
  headingPath: z.array(z.string()),
  markdown: z.string(),
  text: z.string(),
  quote: z.string(),
  position: textPositionSchema.optional()
});

export const documentOutlineItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  depth: z.number().int().positive().max(6),
  ordinal: z.number().int().nonnegative(),
  headingPath: z.array(z.string())
});

export const documentLimitsSchema = z.object({
  charHardCap: z.number().int().positive(),
  blockHardCap: z.number().int().positive()
});

export const reviewDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  sourceLabel: z.string().optional(),
  createdAt: z.string().min(1),
  originalCharCount: z.number().int().nonnegative(),
  normalizedCharCount: z.number().int().nonnegative(),
  limits: documentLimitsSchema,
  outline: z.array(documentOutlineItemSchema),
  blocks: z.array(reviewBlockSchema)
});

export const annotationThreadMessageSchema = z.object({
  id: z.string().min(1),
  author: z.enum(["reviewer", "assistant", "system"]),
  body: z.string().min(1),
  createdAt: z.string().min(1)
});

export const annotationSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().min(1),
  status: annotationStatusSchema,
  priority: annotationPrioritySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  quote: z.string(),
  headingPath: z.array(z.string()),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  messages: z.array(annotationThreadMessageSchema)
});

export const reviewSessionSchema = z.object({
  schemaVersion: z.literal(REVIEW_SCHEMA_VERSION),
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  document: reviewDocumentSchema,
  annotations: z.array(annotationSchema)
});

export const revisionPackItemSchema = z.object({
  annotationId: z.string().min(1),
  blockId: z.string().min(1),
  priority: annotationPrioritySchema,
  headingPath: z.array(z.string()),
  quote: z.string(),
  title: z.string(),
  instruction: z.string()
});

export const revisionPackSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  createdAt: z.string().min(1),
  mode: z.enum(["confirmed-only", "selected-statuses"]),
  includedStatuses: z.array(annotationStatusSchema),
  omittedCounts: z.record(annotationStatusSchema, z.number().int().nonnegative()),
  itemCount: z.number().int().nonnegative(),
  prompt: z.string(),
  promptCharCount: z.number().int().nonnegative(),
  items: z.array(revisionPackItemSchema)
});

export type AnnotationStatus = z.infer<typeof annotationStatusSchema>;
export type AnnotationPriority = z.infer<typeof annotationPrioritySchema>;
export type ReviewBlockType = z.infer<typeof reviewBlockTypeSchema>;
export type TextPosition = z.infer<typeof textPositionSchema>;
export type ReviewBlock = z.infer<typeof reviewBlockSchema>;
export type DocumentOutlineItem = z.infer<typeof documentOutlineItemSchema>;
export type ReviewDocument = z.infer<typeof reviewDocumentSchema>;
export type AnnotationThreadMessage = z.infer<
  typeof annotationThreadMessageSchema
>;
export type Annotation = z.infer<typeof annotationSchema>;
export type ReviewSession = z.infer<typeof reviewSessionSchema>;
export type RevisionPackItem = z.infer<typeof revisionPackItemSchema>;
export type RevisionPack = z.infer<typeof revisionPackSchema>;

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function trimToLimit(value: string, limit: number): string {
  if (value.length <= limit) return value;
  if (limit <= 1) return value.slice(0, limit);
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

export function makeBlockQuote(text: string): string {
  return trimToLimit(normalizeWhitespace(text), BLOCK_QUOTE_CHAR_LIMIT);
}

export function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function makeStableId(prefix: string, seed: string): string {
  return `${prefix}_${stableHash(seed)}`;
}

export function makeRuntimeId(prefix: string): string {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export function priorityRank(priority: AnnotationPriority): number {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[priority];
}
