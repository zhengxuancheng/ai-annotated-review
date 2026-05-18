import {
  DOCUMENT_CHAR_HARD_CAP,
  REVIEW_BLOCK_HARD_CAP,
  makeStableId
} from "@ai-annotated-review/annotation-model";
import { parseMarkdownToReviewDocument } from "@ai-annotated-review/markdown-block-parser";
import { createReviewSession } from "@ai-annotated-review/review-core";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const SERVER_VERSION = "0.1.0";
export const MCP_PATH = "/mcp";
export const REVIEW_WIDGET_URI = "ui://ai-annotated-review/review-widget-v2.html";
const DEFAULT_WIDGET_CONNECT_DOMAINS = ["https://api.openai.com"];

export type AiAnnotatedReviewServerOptions = {
  loadWidgetHtml: () => string;
  widgetDomain?: string | null;
  cspConnectDomains?: string[];
  cspResourceDomains?: string[];
  cspFrameDomains?: string[];
};

const reviewToolInputSchema = {
  markdown: z
    .string()
    .min(1)
    .max(DOCUMENT_CHAR_HARD_CAP)
    .describe("The Markdown or plain text document the user explicitly wants to review."),
  title: z
    .string()
    .min(1)
    .max(160)
    .optional()
    .describe("Optional document title."),
  sourceLabel: z
    .string()
    .min(1)
    .max(160)
    .optional()
    .describe("Optional source label such as 'ChatGPT report'.")
};

const reviewToolOutputSchema = {
  ok: z.boolean(),
  sessionId: z.string().optional(),
  title: z.string().optional(),
  charCount: z.number().int().nonnegative(),
  blockCount: z.number().int().nonnegative(),
  outline: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      depth: z.number().int(),
      ordinal: z.number().int()
    })
  ),
  limits: z.object({
    charHardCap: z.number().int(),
    blockHardCap: z.number().int()
  }),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  nextAction: z.string()
};

export function createAiAnnotatedReviewServer(options: AiAnnotatedReviewServerOptions): McpServer {
  const server = new McpServer({
    name: "ai-annotated-review",
    version: SERVER_VERSION
  });

  registerAppResource(
    server,
    "AI Annotated Review Widget",
    REVIEW_WIDGET_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: "Desktop document review widget for anchored AI-output annotations."
    },
    async () => ({
      contents: [
        {
          uri: REVIEW_WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: options.loadWidgetHtml(),
          _meta: {
            ui: buildWidgetUiMeta(options),
            "openai/widgetDescription":
              "Interactive document review surface with block-level annotations and confirmed-comment revision packs."
          }
        }
      ]
    })
  );

  registerAppTool(
    server,
    "review_markdown_document",
    {
      title: "Review Markdown Document",
      description:
        "Use this when the user wants to review a long AI-generated Markdown or plain text document with anchored comments before asking ChatGPT to revise it.",
      inputSchema: reviewToolInputSchema,
      outputSchema: reviewToolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      },
      _meta: {
        ui: { resourceUri: REVIEW_WIDGET_URI },
        "openai/outputTemplate": REVIEW_WIDGET_URI,
        "openai/toolInvocation/invoking": "Opening review...",
        "openai/toolInvocation/invoked": "Review ready."
      }
    },
    async ({ markdown, title, sourceLabel }) => {
      const parsed = parseMarkdownToReviewDocument(markdown, {
        ...(title ? { title } : {}),
        ...(sourceLabel ? { sourceLabel } : {}),
        charHardCap: DOCUMENT_CHAR_HARD_CAP,
        blockHardCap: REVIEW_BLOCK_HARD_CAP
      });

      if (!parsed.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: parsed.errors.join(" ")
            }
          ],
          structuredContent: {
            ok: false,
            charCount: markdown.length,
            blockCount: 0,
            outline: [],
            limits: {
              charHardCap: DOCUMENT_CHAR_HARD_CAP,
              blockHardCap: REVIEW_BLOCK_HARD_CAP
            },
            warnings: parsed.warnings,
            errors: parsed.errors,
            nextAction:
              "Ask the user to shorten the document or split it into review chunks."
          }
        };
      }

      const session = createReviewSession(parsed.document, {
        sessionId: makeStableId("session", parsed.document.id),
        now: parsed.document.createdAt
      });

      const outline = parsed.document.outline.slice(0, 30).map((item) => ({
        id: item.id,
        title: item.title,
        depth: item.depth,
        ordinal: item.ordinal
      }));

      return {
        content: [
          {
            type: "text" as const,
            text:
              "The document is open in the AI Annotated Review widget. Add block-level comments there, confirm the comments that should drive revision, then explicitly send the revision request."
          }
        ],
        structuredContent: {
          ok: true,
          sessionId: session.id,
          title: parsed.document.title,
          charCount: parsed.document.normalizedCharCount,
          blockCount: parsed.document.blocks.length,
          outline,
          limits: parsed.document.limits,
          warnings: parsed.warnings,
          errors: [],
          nextAction:
            "Review blocks in the widget; only confirmed annotations are used in revision packs."
        },
        _meta: {
          reviewSession: session,
          dataBoundary: {
            fullDocumentInMetaOnly: true,
            modelVisibleFields:
              "structuredContent contains session summary, counts, outline, limits, warnings, and next action only."
          }
        }
      };
    }
  );

  return server;
}

function buildWidgetUiMeta(options: AiAnnotatedReviewServerOptions) {
  const csp: {
    connectDomains: string[];
    resourceDomains: string[];
    frameDomains?: string[];
  } = {
    connectDomains: uniqueDomains([
      ...DEFAULT_WIDGET_CONNECT_DOMAINS,
      ...(options.cspConnectDomains ?? [])
    ]),
    resourceDomains: options.cspResourceDomains ?? []
  };

  const frameDomains = options.cspFrameDomains ?? [];
  if (frameDomains.length > 0) {
    csp.frameDomains = frameDomains;
  }

  return {
    prefersBorder: true,
    csp,
    ...(options.widgetDomain ? { domain: options.widgetDomain } : {})
  };
}

function uniqueDomains(domains: string[]): string[] {
  return [...new Set(domains)];
}
