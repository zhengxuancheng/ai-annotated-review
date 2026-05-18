import {
  DOCUMENT_CHAR_HARD_CAP,
  REVIEW_BLOCK_HARD_CAP,
  type DocumentOutlineItem,
  type ReviewBlock,
  type ReviewBlockType,
  type ReviewDocument,
  makeBlockQuote,
  makeStableId,
  normalizeWhitespace,
  stableHash
} from "@ai-annotated-review/annotation-model";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

type MarkdownPosition = {
  start?: { line?: number; offset?: number };
  end?: { line?: number; offset?: number };
};

type MarkdownNode = {
  type: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  position?: MarkdownPosition;
};

type MarkdownRoot = {
  type: "root";
  children: MarkdownNode[];
};

export type ParseMarkdownOptions = {
  title?: string;
  sourceLabel?: string;
  documentId?: string;
  now?: string;
  charHardCap?: number;
  blockHardCap?: number;
};

export type ParseMarkdownResult =
  | {
      ok: true;
      document: ReviewDocument;
      warnings: string[];
      errors: [];
    }
  | {
      ok: false;
      document?: undefined;
      warnings: string[];
      errors: string[];
    };

const BLOCK_TYPES: Record<string, ReviewBlockType> = {
  blockquote: "blockquote",
  code: "code",
  definition: "definition",
  heading: "heading",
  html: "html",
  list: "list",
  paragraph: "paragraph",
  table: "table",
  thematicBreak: "thematicBreak"
};

export function parseMarkdownToReviewDocument(
  markdown: string,
  options: ParseMarkdownOptions = {}
): ParseMarkdownResult {
  const charHardCap = options.charHardCap ?? DOCUMENT_CHAR_HARD_CAP;
  const blockHardCap = options.blockHardCap ?? REVIEW_BLOCK_HARD_CAP;
  const createdAt = options.now ?? new Date().toISOString();
  const warnings: string[] = [];
  const normalizedMarkdown = normalizeLineEndings(markdown);

  if (normalizedMarkdown.trim().length === 0) {
    return {
      ok: false,
      warnings,
      errors: ["Document is empty."]
    };
  }

  if (normalizedMarkdown.length > charHardCap) {
    return {
      ok: false,
      warnings,
      errors: [
        `Document has ${normalizedMarkdown.length} characters, above the v1 hard cap of ${charHardCap}.`
      ]
    };
  }

  const root = unified().use(remarkParse).use(remarkGfm).parse(
    normalizedMarkdown
  ) as MarkdownRoot;

  const lines = normalizedMarkdown.split("\n");
  const blocks: ReviewBlock[] = [];
  const outline: DocumentOutlineItem[] = [];
  let headingPath: string[] = [];

  for (const child of root.children) {
    const type = mapNodeType(child.type);
    if (type === "unknown") {
      warnings.push(`Unsupported Markdown node type "${child.type}" was kept as a text block.`);
    }

    const text = extractNodeText(child);
    const markdownSlice = extractNodeMarkdown(child, lines) || text;
    if (!text && type !== "thematicBreak") {
      continue;
    }

    let blockHeadingPath = [...headingPath];
    if (type === "heading") {
      const depth = child.depth ?? 1;
      const headingText = normalizeWhitespace(text);
      headingPath = [
        ...headingPath.slice(0, Math.max(0, depth - 1)),
        headingText
      ];
      blockHeadingPath = [...headingPath];
    }

    const ordinal = blocks.length;
    const stableSeed = [
      ordinal,
      type,
      blockHeadingPath.join(" > "),
      normalizeWhitespace(text).slice(0, 500)
    ].join("|");
    const block: ReviewBlock = {
      id: makeStableId(`b${String(ordinal + 1).padStart(4, "0")}`, stableSeed),
      ordinal,
      type,
      ...(type === "heading" && child.depth ? { depth: child.depth } : {}),
      headingPath: blockHeadingPath,
      markdown: markdownSlice,
      text,
      quote: makeBlockQuote(text || markdownSlice),
      ...(child.position
        ? {
            position: {
              ...(child.position.start?.line
                ? { startLine: child.position.start.line }
                : {}),
              ...(child.position.end?.line ? { endLine: child.position.end.line } : {}),
              ...(child.position.start?.offset !== undefined
                ? { startOffset: child.position.start.offset }
                : {}),
              ...(child.position.end?.offset !== undefined
                ? { endOffset: child.position.end.offset }
                : {})
            }
          }
        : {})
    };

    blocks.push(block);

    if (type === "heading") {
      outline.push({
        id: block.id,
        title: normalizeWhitespace(text),
        depth: child.depth ?? 1,
        ordinal,
        headingPath: block.headingPath
      });
    }
  }

  if (blocks.length > blockHardCap) {
    return {
      ok: false,
      warnings,
      errors: [
        `Document produced ${blocks.length} review blocks, above the v1 hard cap of ${blockHardCap}.`
      ]
    };
  }

  if (blocks.length === 0) {
    return {
      ok: false,
      warnings,
      errors: ["Document did not produce any reviewable blocks."]
    };
  }

  const title = options.title ?? inferTitle(outline, normalizedMarkdown);
  const documentId =
    options.documentId ??
    makeStableId(
      "doc",
      `${title ?? ""}|${options.sourceLabel ?? ""}|${normalizedMarkdown.length}|${stableHash(normalizedMarkdown.slice(0, 5000))}`
    );

  return {
    ok: true,
    warnings,
    errors: [],
    document: {
      id: documentId,
      ...(title ? { title } : {}),
      ...(options.sourceLabel ? { sourceLabel: options.sourceLabel } : {}),
      createdAt,
      originalCharCount: markdown.length,
      normalizedCharCount: normalizedMarkdown.length,
      limits: { charHardCap, blockHardCap },
      outline,
      blocks
    }
  };
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function mapNodeType(type: string): ReviewBlockType {
  return BLOCK_TYPES[type] ?? "unknown";
}

function extractNodeText(node: MarkdownNode): string {
  if (node.type === "code") return node.value ?? "";
  if (node.type === "html") return node.value ?? "";
  if (node.type === "thematicBreak") return "---";
  if (node.type === "list" && node.children) {
    return node.children
      .map((child) => normalizeWhitespace(toString(child)))
      .filter(Boolean)
      .join(" ");
  }
  if (node.type === "table" && node.children) {
    return node.children
      .map((child) => normalizeWhitespace(toString(child)))
      .filter(Boolean)
      .join(" | ");
  }
  return normalizeWhitespace(toString(node));
}

function extractNodeMarkdown(node: MarkdownNode, lines: string[]): string {
  const startLine = node.position?.start?.line;
  const endLine = node.position?.end?.line;
  if (!startLine || !endLine) return "";
  return lines.slice(startLine - 1, endLine).join("\n");
}

function inferTitle(
  outline: DocumentOutlineItem[],
  markdown: string
): string | undefined {
  const firstHeading = outline.find((item) => item.depth === 1) ?? outline[0];
  if (firstHeading?.title) return firstHeading.title;
  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ? firstLine.slice(0, 80) : undefined;
}
