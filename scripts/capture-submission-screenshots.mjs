import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const PORT = parsePort(process.env.SCREENSHOT_PORT, 5175);
const URL = `http://127.0.0.1:${PORT}/`;
const OUTPUT_DIR = "docs/submission/screenshots";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "review-widget-desktop.png");
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

const executablePath = process.env.CHROME_PATH ?? CHROME_CANDIDATES.find(existsSync);
if (!executablePath) {
  throw new Error("No local Chromium-compatible browser found. Set CHROME_PATH to capture screenshots.");
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
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByText("AI Annotated Review Demo Report").first().waitFor();

  await addAnnotation(page, 2, {
    title: "Clarify target user",
    body: "Name who owns this workflow and what review pain they feel.",
    priority: "P1",
    status: "confirmed"
  });
  await addAnnotation(page, 4, {
    title: "Keep platform boundary honest",
    body: "Say this is an embedded app widget, not native ChatGPT bubble editing.",
    priority: "P0",
    status: "confirmed"
  });
  await page.getByRole("button", { name: /Build pack/ }).click();

  await mkdir(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: OUTPUT_FILE, fullPage: true });
  console.log(JSON.stringify({ ok: true, output: OUTPUT_FILE }, null, 2));
} finally {
  if (browser) await browser.close();
  vite.kill("SIGTERM");
}

async function addAnnotation(page, blockIndex, annotation) {
  await page.locator(".review-block").nth(blockIndex).click();
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

function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid port: ${value ?? fallback}`);
  }
  return parsed;
}
