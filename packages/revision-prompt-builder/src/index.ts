import {
  REVISION_PACK_CHAR_BUDGET,
  type Annotation,
  type AnnotationPriority,
  type AnnotationStatus,
  type RevisionPack,
  type RevisionPackItem,
  type ReviewSession,
  makeRuntimeId,
  priorityRank,
  revisionPackSchema,
  trimToLimit
} from "@ai-annotated-review/annotation-model";

export type BuildRevisionPackOptions = {
  statuses?: AnnotationStatus[];
  promptBudget?: number;
  now?: string;
  selfContained?: boolean;
};

const DEFAULT_STATUSES: AnnotationStatus[] = ["confirmed"];
const MIN_PROMPT_BUDGET = 240;
const STATUS_ORDER: AnnotationStatus[] = [
  "open",
  "confirmed",
  "resolved",
  "rejected"
];

export function buildRevisionPack(
  session: ReviewSession,
  options: BuildRevisionPackOptions = {}
): RevisionPack {
  const includedStatuses = normalizeStatuses(options.statuses ?? DEFAULT_STATUSES);
  const promptBudget = normalizePromptBudget(options.promptBudget ?? REVISION_PACK_CHAR_BUDGET);
  const selected = selectAnnotations(session, includedStatuses);
  const omittedCounts = countOmitted(session.annotations, includedStatuses);
  const allItems = selected.map(toRevisionPackItem);

  let prompt = buildDetailedPrompt(session, allItems, options.selfContained ?? false);
  let items = allItems;

  if (prompt.length > promptBudget) {
    const compact = buildCompactPromptWithinBudget(
      session,
      allItems,
      promptBudget,
      options.selfContained ?? false
    );
    prompt = compact.prompt;
    items = compact.items;
  }

  return revisionPackSchema.parse({
    id: makeRuntimeId("revpack"),
    sessionId: session.id,
    createdAt: options.now ?? new Date().toISOString(),
    mode:
      includedStatuses.length === 1 && includedStatuses[0] === "confirmed"
        ? "confirmed-only"
        : "selected-statuses",
    includedStatuses,
    omittedCounts,
    itemCount: items.length,
    prompt,
    promptCharCount: prompt.length,
    items
  });
}

export function selectAnnotations(
  session: ReviewSession,
  statuses: AnnotationStatus[] = DEFAULT_STATUSES
): Annotation[] {
  const selectedStatuses = new Set(normalizeStatuses(statuses));
  return [...session.annotations]
    .filter((annotation) => selectedStatuses.has(annotation.status))
    .sort((left, right) => {
      const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
      if (priorityDelta !== 0) return priorityDelta;
      const leftBlock = session.document.blocks.find((block) => block.id === left.blockId);
      const rightBlock = session.document.blocks.find((block) => block.id === right.blockId);
      return (leftBlock?.ordinal ?? 0) - (rightBlock?.ordinal ?? 0);
    });
}

function normalizeStatuses(statuses: AnnotationStatus[]): AnnotationStatus[] {
  const unique = [...new Set(statuses)];
  if (unique.length === 0) {
    throw new Error("At least one annotation status must be selected.");
  }
  return unique;
}

function normalizePromptBudget(promptBudget: number): number {
  if (!Number.isFinite(promptBudget) || promptBudget < MIN_PROMPT_BUDGET) {
    throw new Error(`Prompt budget must be at least ${MIN_PROMPT_BUDGET} characters.`);
  }
  return Math.floor(promptBudget);
}

function toRevisionPackItem(annotation: Annotation): RevisionPackItem {
  return {
    annotationId: annotation.id,
    blockId: annotation.blockId,
    priority: annotation.priority,
    headingPath: annotation.headingPath,
    quote: annotation.quote,
    title: annotation.title,
    instruction: annotation.body
  };
}

function countOmitted(
  annotations: Annotation[],
  includedStatuses: AnnotationStatus[]
): Record<AnnotationStatus, number> {
  const included = new Set(includedStatuses);
  const counts = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, 0])
  ) as Record<AnnotationStatus, number>;

  for (const annotation of annotations) {
    if (!included.has(annotation.status)) {
      counts[annotation.status] += 1;
    }
  }

  return counts;
}

function buildDetailedPrompt(
  session: ReviewSession,
  items: RevisionPackItem[],
  selfContained: boolean
): string {
  const title = session.document.title ?? "Untitled document";
  const header = [
    "Please revise the original document using the confirmed review annotations below.",
    "",
    `Document: ${title}`,
    `Review session: ${session.id}`,
    "",
    "Rules:",
    "- Apply only the listed confirmed annotations as revision requirements.",
    "- Do not apply open, resolved, or rejected comments unless they are listed here.",
    "- Preserve unaffected sections and the original document structure where possible.",
    "- If an instruction conflicts with the source text, prioritize the reviewer instruction and keep the change local to the referenced block or section.",
    "- Some reviewer comments may be dictated; correct obvious speech-recognition mistakes using the anchor quote and section context, but do not invent requirements.",
    selfContained
      ? "- Source excerpts are included only as local anchors, not as a complete copy of the document."
      : "- Refer to the original report already present in this conversation; do not require the user to paste it again.",
    ""
  ];

  if (items.length === 0) {
    return [
      ...header,
      "No confirmed annotations are selected. Ask the user to confirm at least one annotation before revising."
    ].join("\n");
  }

  return [
    ...header,
    "Confirmed revision instructions:",
    ...items.flatMap((item, index) => formatDetailedItem(item, index + 1))
  ].join("\n");
}

function formatDetailedItem(item: RevisionPackItem, index: number): string[] {
  const section = item.headingPath.length > 0 ? item.headingPath.join(" > ") : "Document root";
  return [
    "",
    `${index}. [${item.priority}] ${item.title}`,
    `   Block: ${item.blockId}`,
    `   Section: ${section}`,
    `   Anchor quote: "${trimToLimit(item.quote, 260)}"`,
    `   Requested change: ${item.instruction}`
  ];
}

function buildCompactPromptWithinBudget(
  session: ReviewSession,
  items: RevisionPackItem[],
  budget: number,
  selfContained: boolean
): { prompt: string; items: RevisionPackItem[] } {
  const included: RevisionPackItem[] = [];
  const title = session.document.title ?? "Untitled document";
  const prefix = [
    "Revise the original document using confirmed annotations only.",
    `Document: ${title}`,
    `Review session: ${session.id}`,
    "Rules: preserve unaffected sections; keep edits local to referenced blocks; correct obvious speech-recognition mistakes in dictated comments using context.",
    selfContained
      ? "Quotes are anchors, not a full document copy."
      : "Use the original report already in this conversation.",
    "",
    "Instructions:"
  ].join("\n");
  const lines: string[] = [prefix];

  for (const item of items) {
    const section = item.headingPath.length > 0 ? item.headingPath.join(" > ") : "Root";
    let line = `- [${item.priority}] ${item.blockId} (${section}): ${trimToLimit(item.title, 80)} — ${trimToLimit(item.instruction, 180)} Quote: "${trimToLimit(item.quote, 120)}"`;
    const currentLength = lines.join("\n").length;
    const remainingForFirstItem = budget - currentLength - 1;
    if (included.length === 0 && line.length > remainingForFirstItem) {
      line = trimToLimit(
        `- [${item.priority}] ${item.blockId}: ${item.title} — ${item.instruction}`,
        Math.max(40, remainingForFirstItem)
      );
    }
    const next = [...lines, line].join("\n");
    const reserve = included.length === 0 ? 0 : 180;
    if (next.length + reserve > budget) break;
    lines.push(line);
    included.push(item);
  }

  const omitted = items.length - included.length;
  if (omitted > 0) {
    const note = `Omitted due to prompt budget: ${omitted}. Ask to revise remaining confirmed comments in a later batch.`;
    const next = [...lines, "", note].join("\n");
    if (next.length <= budget) {
      lines.push("", note);
    }
  }

  const prompt = lines.join("\n");
  if (prompt.length <= budget) return { prompt, items: included };

  return {
    prompt: trimToLimit(prompt, budget),
    items: included
  };
}

export function summarizeRevisionPack(pack: RevisionPack): string {
  const priorities = pack.items.reduce(
    (counts, item) => {
      counts[item.priority] += 1;
      return counts;
    },
    { P0: 0, P1: 0, P2: 0, P3: 0 } as Record<AnnotationPriority, number>
  );

  return [
    `${pack.itemCount} confirmed instruction(s).`,
    `Priority mix: P0=${priorities.P0}, P1=${priorities.P1}, P2=${priorities.P2}, P3=${priorities.P3}.`,
    `Prompt length: ${pack.promptCharCount} characters.`
  ].join(" ");
}
