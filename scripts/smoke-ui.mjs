import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = parsePort(process.env.SMOKE_UI_PORT, 5174);
const URL = `http://127.0.0.1:${PORT}/`;
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

const executablePath = process.env.CHROME_PATH ?? CHROME_CANDIDATES.find(existsSync);
if (!executablePath) {
  throw new Error("No local Chromium-compatible browser found. Set CHROME_PATH to run smoke:ui.");
}

const vite = spawn(
  "npm",
  [
    "run",
    "dev",
    "-w",
    "@ai-annotated-review/chatgpt-app-web",
    "--",
    "--port",
    String(PORT),
    "--strictPort"
  ],
  { stdio: ["ignore", "pipe", "pipe"] }
);

const logs = [];
vite.stdout.on("data", (chunk) => logs.push(String(chunk)));
vite.stderr.on("data", (chunk) => logs.push(String(chunk)));

let browser;

try {
  await waitForHttp(URL);
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.addInitScript((session) => {
    const bridge = {
      toolResponseMetadata: { reviewSession: session },
      widgetState: null,
      setWidgetState(state) {
        this.widgetState = state;
        window.dispatchEvent(
          new CustomEvent("openai:set_globals", {
            detail: { globals: this }
          })
        );
      },
      sendFollowUpMessage(message) {
        window.__lastFollowUpMessage = message;
      },
      requestDisplayMode(input) {
        window.__lastDisplayMode = input;
      }
    };
    window.openai = bridge;
  }, createBridgeEchoSession());
  const consoleMessages = [];
  page.on("console", (message) => {
    const text = `${message.type()}: ${message.text()}`;
    if (!text.includes("[vite]") && !text.includes("React DevTools")) {
      consoleMessages.push(text);
    }
  });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByText("AI Annotated Review Demo Report").first().waitFor();

  await addAnnotation(page, 2, {
    title: "Make pain concrete",
    body: "Name the actual review failure mode instead of staying abstract.",
    priority: "P1",
    status: "confirmed"
  });
  await addAnnotation(page, 4, {
    title: "Keep boundary visible",
    body: "State that the app renders its own iframe review UI and does not modify native ChatGPT bubbles.",
    priority: "P0",
    status: "confirmed"
  });
  await addAnnotation(page, 6, {
    title: "Reject extra scope",
    body: "Do not add accounts or sync to this demo.",
    priority: "P2",
    status: "rejected"
  });

  const rowCount = await page.locator(".annotation-row").count();
  await page.getByRole("button", { name: /Build pack/ }).click();
  const packText = await page.locator(".pack-preview").inputValue();
  await page.getByRole("button", { name: /Export pack/ }).waitFor();
  await page.getByRole("button", { name: /Send revision request/ }).click();
  await page.getByRole("dialog", { name: /Confirm send/ }).waitFor();
  const modalText = await page.locator(".modal-preview").inputValue();
  await page.getByRole("button", { name: /Confirm and send/ }).click();
  await page.getByText("Revision request sent.").waitFor();
  const sentFollowUp = await page.evaluate(() => window.__lastFollowUpMessage ?? null);

  const errorMessages = consoleMessages.filter((line) => line.startsWith("error:"));
  assert(rowCount === 3, `expected 3 annotation rows, got ${rowCount}`);
  assert(packText.includes("Make pain concrete"), "pack missing first confirmed annotation");
  assert(packText.includes("Keep boundary visible"), "pack missing second confirmed annotation");
  assert(!packText.includes("Reject extra scope"), "pack included rejected annotation");
  assert(modalText === packText, "confirmation modal did not match pack preview");
  assert(sentFollowUp?.prompt === packText, "sendFollowUpMessage did not receive the pack prompt");
  assert(sentFollowUp?.scrollToBottom === true, "sendFollowUpMessage did not request scrollToBottom");
  assert(errorMessages.length === 0, `browser console errors:\n${errorMessages.join("\n")}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        rowCount,
        packIncludesConfirmedOnly: true,
        exportPackAvailable: true,
        confirmationRequired: true,
        bridgeEchoPreservesSelection: true,
        sendFollowUpMessageCalled: true,
        consoleErrors: errorMessages.length
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close();
  vite.kill("SIGTERM");
}

async function addAnnotation(page, blockIndex, annotation) {
  const targetBlock = page.locator(".review-block").nth(blockIndex);
  const targetBlockId = await targetBlock.locator("code").first().innerText();
  await targetBlock.click();
  await page.locator(".selected-block code", { hasText: targetBlockId }).waitFor();
  await page.locator("label").filter({ hasText: "Title" }).locator("input").fill(annotation.title);
  await page.locator("label").filter({ hasText: "Comment" }).locator("textarea").fill(annotation.body);
  await page.locator("label").filter({ hasText: "Priority" }).locator("select").selectOption(annotation.priority);
  await page.locator("label").filter({ hasText: "Status" }).locator("select").selectOption(annotation.status);
  await page.getByRole("button", { name: /Add annotation/ }).click();
}

async function waitForHttp(url) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
    }
    await sleep(100);
  }
  throw new Error(`Vite did not become ready. Logs:\n${logs.join("")}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid port: ${value ?? fallback}`);
  }
  return parsed;
}

function createBridgeEchoSession() {
  const now = "2026-05-18T00:00:00.000Z";
  const blocks = [
    heading("b0001_title", 0, "AI Annotated Review Demo Report", 1, [
      "AI Annotated Review Demo Report"
    ]),
    heading("b0002_context", 1, "Context", 2, ["AI Annotated Review Demo Report", "Context"]),
    paragraph(
      "b0003_context_body",
      2,
      "AI tools can generate long reports quickly, but paragraph-level revision feedback is still hard to capture in a normal chat box.",
      ["AI Annotated Review Demo Report", "Context"]
    ),
    heading("b0004_proposal", 3, "Proposal", 2, ["AI Annotated Review Demo Report", "Proposal"]),
    paragraph(
      "b0005_proposal_body",
      4,
      "Build a ChatGPT Apps SDK widget that renders a long response as review blocks. Each block can receive comments, statuses, and priorities.",
      ["AI Annotated Review Demo Report", "Proposal"]
    ),
    heading("b0006_boundary", 5, "Boundary", 2, ["AI Annotated Review Demo Report", "Boundary"]),
    paragraph(
      "b0007_boundary_body",
      6,
      "The app should not claim it modifies ChatGPT native message bubbles. It renders its own embedded review surface and sends a revision request only after confirmation.",
      ["AI Annotated Review Demo Report", "Boundary"]
    )
  ];

  return {
    schemaVersion: "1.0",
    id: "session_bridge_echo",
    createdAt: now,
    updatedAt: now,
    document: {
      id: "doc_bridge_echo",
      title: "AI Annotated Review Demo Report",
      sourceLabel: "ChatGPT bridge echo smoke",
      createdAt: now,
      originalCharCount: blocks.reduce((count, block) => count + block.markdown.length, 0),
      normalizedCharCount: blocks.reduce((count, block) => count + block.text.length, 0),
      limits: { charHardCap: 100000, blockHardCap: 300 },
      outline: blocks
        .filter((block) => block.type === "heading")
        .map((block) => ({
          id: block.id,
          title: block.text,
          depth: block.depth,
          ordinal: block.ordinal,
          headingPath: block.headingPath
        })),
      blocks
    },
    annotations: []
  };
}

function heading(id, ordinal, text, depth, headingPath) {
  return {
    id,
    ordinal,
    type: "heading",
    depth,
    headingPath,
    markdown: `${"#".repeat(depth)} ${text}`,
    text,
    quote: text,
    position: { startLine: ordinal + 1, endLine: ordinal + 1 }
  };
}

function paragraph(id, ordinal, text, headingPath) {
  return {
    id,
    ordinal,
    type: "paragraph",
    headingPath,
    markdown: text,
    text,
    quote: text,
    position: { startLine: ordinal + 1, endLine: ordinal + 1 }
  };
}
