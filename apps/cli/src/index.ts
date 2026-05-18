#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import {
  annotationPrioritySchema,
  annotationStatusSchema,
  makeStableId,
  reviewSessionSchema
} from "@ai-annotated-review/annotation-model";
import type {
  AnnotationPriority,
  AnnotationStatus,
  ReviewSession
} from "@ai-annotated-review/annotation-model";
import { parseMarkdownToReviewDocument } from "@ai-annotated-review/markdown-block-parser";
import {
  addAnnotation,
  createReviewSession,
  exportReviewSessionJson,
  importReviewSessionJson
} from "@ai-annotated-review/review-core";
import { buildRevisionPack } from "@ai-annotated-review/revision-prompt-builder";

type ParsedArgs = {
  command: string;
  positionals: string[];
  flags: Map<string, string | true>;
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ai-annotated-review: ${message}`);
  process.exit(1);
});

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "--help" || args.command === "-h" || args.command === "help") {
    printHelp();
    return;
  }

  switch (args.command) {
    case "create":
      await createCommand(args);
      return;
    case "blocks":
      await blocksCommand(args);
      return;
    case "annotate":
      await annotateCommand(args);
      return;
    case "pack":
      await packCommand(args);
      return;
    default:
      throw new Error(`Unknown command "${args.command}". Run ai-annotated-review --help.`);
  }
}

async function createCommand(args: ParsedArgs): Promise<void> {
  const input = requirePositional(args, 0, "create requires an input file path or '-' for stdin.");
  const markdown = await readInput(input);
  const title = stringFlag(args, "title");
  const sourceLabel = stringFlag(args, "source-label") ?? stringFlag(args, "source");
  const parsed = parseMarkdownToReviewDocument(markdown, {
    ...(title ? { title } : {}),
    ...(sourceLabel ? { sourceLabel } : {})
  });
  if (!parsed.ok) {
    throw new Error(parsed.errors.join(" "));
  }
  const session = createReviewSession(parsed.document, {
    sessionId: makeStableId("session", parsed.document.id),
    now: parsed.document.createdAt
  });
  await writeOutput(stringFlag(args, "out"), exportReviewSessionJson(session));
}

async function blocksCommand(args: ParsedArgs): Promise<void> {
  const session = await readSession(requirePositional(args, 0, "blocks requires a session JSON file."));
  const lines = session.document.blocks.map((block) =>
    [
      block.id.padEnd(16),
      String(block.ordinal + 1).padStart(3),
      block.type.padEnd(12),
      block.quote
    ].join("  ")
  );
  console.log(lines.join("\n"));
}

async function annotateCommand(args: ParsedArgs): Promise<void> {
  const input = requirePositional(args, 0, "annotate requires a session JSON file.");
  const session = await readSession(input);
  const blockId = requiredFlag(args, "block");
  const title = requiredFlag(args, "title");
  const body = requiredFlag(args, "body");
  const priority = parsePriority(stringFlag(args, "priority") ?? "P2");
  const status = parseStatus(stringFlag(args, "status") ?? "open");
  const next = addAnnotation(session, {
    blockId,
    title,
    body,
    priority,
    status
  });
  await writeOutput(stringFlag(args, "out") ?? input, exportReviewSessionJson(next));
}

async function packCommand(args: ParsedArgs): Promise<void> {
  const session = await readSession(requirePositional(args, 0, "pack requires a session JSON file."));
  const statuses = parseStatuses(stringFlag(args, "statuses") ?? "confirmed");
  const selfContained = args.flags.has("self-contained");
  const pack = buildRevisionPack(session, { statuses, selfContained });
  await writeOutput(stringFlag(args, "out"), `${pack.prompt}\n`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "--help", ...rest] = argv;
  const flags = new Map<string, string | true>();
  const positionals: string[] = [];
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === undefined) continue;
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const withoutPrefix = token.slice(2);
    const [key, inlineValue] = withoutPrefix.split("=", 2);
    if (!key) {
      throw new Error("Flag names cannot be empty.");
    }
    if (inlineValue !== undefined) {
      flags.set(key, inlineValue);
      continue;
    }
    const next = rest[index + 1];
    if (next && !next.startsWith("--")) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  }
  return { command, positionals, flags };
}

function requirePositional(args: ParsedArgs, index: number, message: string): string {
  const value = args.positionals[index];
  if (!value) throw new Error(message);
  return value;
}

function requiredFlag(args: ParsedArgs, name: string): string {
  const value = stringFlag(args, name);
  if (!value) throw new Error(`Missing required --${name}.`);
  return value;
}

function stringFlag(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags.get(name);
  if (typeof value !== "string") return undefined;
  return value;
}

function parsePriority(value: string): AnnotationPriority {
  const parsed = annotationPrioritySchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid priority "${value}". Use P0, P1, P2, or P3.`);
  }
  return parsed.data;
}

function parseStatus(value: string): AnnotationStatus {
  const parsed = annotationStatusSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid status "${value}". Use open, confirmed, resolved, or rejected.`);
  }
  return parsed.data;
}

function parseStatuses(value: string): AnnotationStatus[] {
  return value
    .split(",")
    .map((item) => parseStatus(item.trim()))
    .filter(Boolean);
}

async function readSession(path: string): Promise<ReviewSession> {
  return reviewSessionSchema.parse(importReviewSessionJson(await readFile(path, "utf8")));
}

async function readInput(path: string): Promise<string> {
  if (path !== "-") return readFile(path, "utf8");
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function writeOutput(path: string | undefined, value: string): Promise<void> {
  if (!path || path === "-") {
    process.stdout.write(value);
    if (!value.endsWith("\n")) process.stdout.write("\n");
    return;
  }
  await writeFile(path, value, "utf8");
}

function printHelp(): void {
  console.log(`AI Annotated Review CLI

Usage:
  ai-annotated-review create <markdown-file|-> --out review.json [--title "Title"] [--source-label "Codex"]
  ai-annotated-review blocks <review.json>
  ai-annotated-review annotate <review.json> --block <block-id> --title "Issue" --body "Instruction" [--priority P1] [--status confirmed] [--out review.json]
  ai-annotated-review pack <review.json> --out revision.md [--statuses confirmed] [--self-contained]

Notes:
  - The pack command includes confirmed annotations by default.
  - Use '-' as the create input to read Markdown from stdin.
  - No prompt is sent to any AI service automatically.`);
}
