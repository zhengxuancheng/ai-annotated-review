import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const failures = [];

await mustExist("LICENSE", "Apache-2.0 release decision requires a LICENSE file.");
await mustContain("LICENSE", "Apache License", "LICENSE must contain the Apache License text.");
await mustContain("LICENSE", "Version 2.0", "LICENSE must be Apache License 2.0.");
const packageJsonFiles = ["package.json", ...(await collectFiles(["apps", "packages"], /package\.json$/))];
for (const packageJson of packageJsonFiles) {
  const pkg = JSON.parse(await readFile(packageJson, "utf8"));
  if (pkg.license !== "Apache-2.0") {
    failures.push(`${packageJson}: package license must be Apache-2.0.`);
  }
}
await mustContain(
  "README.md",
  "No native ChatGPT message bubble modification",
  "README must preserve the native-bubble boundary."
);
await mustContain(
  "docs/privacy-model.md",
  "confirmed annotations only",
  "Privacy model must preserve confirmed-only send behavior."
);
await mustContain(
  "docs/development/verification-report.md",
  "Not Yet Verified",
  "Verification report must preserve unverified-live-ChatGPT caveats."
);

const productFiles = await collectFiles(
  ["apps/chatgpt-app/web/src", "apps/chatgpt-app/server/src", "apps/chatgpt-app/cloudflare-worker/src"],
  /\.(ts|tsx|css|html)$/
);
for (const file of productFiles) {
  const text = await readFile(file, "utf8");
  mustNotMatchText(file, text, /\blocalStorage\b/, "Do not use localStorage for core state.");
  mustNotMatchText(file, text, /\bsessionStorage\b/, "Do not use sessionStorage for core state.");
}

const publicClaimFiles = [
  "README.md",
  "chatgpt-app-submission.json",
  ...(await collectFiles(["docs"], /\.(md|json)$/))
];
for (const file of publicClaimFiles) {
  const text = await readFile(file, "utf8");
  mustNotMatchText(
    file,
    text,
    /\b\d[\d,]*\s+stars\b/i,
    "Do not publish exact GitHub star metrics without a fresh release-time check."
  );
}

const main = await readFile("apps/chatgpt-app/web/src/main.tsx", "utf8");
const sendCallCount = countOccurrences(main, "sendRevisionFollowUp(");
if (sendCallCount !== 1) {
  failures.push(`Expected exactly one sendRevisionFollowUp call site, found ${sendCallCount}.`);
}
if (!main.includes("Confirm send") || !main.includes("Confirm and send")) {
  failures.push("Widget must keep explicit confirmation UI before sending.");
}

const bridge = await readFile("apps/chatgpt-app/web/src/openaiBridge.ts", "utf8");
if (!bridge.includes("sendFollowUpMessage") || !bridge.includes("ui/message")) {
  failures.push("Bridge must keep both ChatGPT and MCP Apps follow-up send paths.");
}

const server = await readFile("apps/chatgpt-app/server/src/app.ts", "utf8");
if (!server.includes("_meta") || !server.includes("reviewSession")) {
  failures.push("Server must keep full review session in _meta for widget-only hydration.");
}
if (!server.includes("structuredContent")) {
  failures.push("Server must return structuredContent summary.");
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checkedFiles: productFiles.length }, null, 2));

async function mustExist(file, message) {
  if (!existsSync(file)) failures.push(message);
}

async function mustContain(file, needle, message) {
  const text = await readFile(file, "utf8");
  if (!text.includes(needle)) failures.push(message);
}

function mustNotMatchText(file, text, pattern, message) {
  if (pattern.test(text)) failures.push(`${file}: ${message}`);
}

async function collectFiles(dirs, pattern) {
  const results = [];
  for (const dir of dirs) {
    await walk(dir, results);
  }
  return results.filter((file) => pattern.test(file));
}

async function walk(dir, results) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ["node_modules", "dist", "dist-types", "coverage", ".vite"].includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}
