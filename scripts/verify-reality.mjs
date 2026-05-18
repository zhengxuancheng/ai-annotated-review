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
  "docs/privacy-model.md",
  "browser's built-in Web Speech recognition",
  "Privacy model must disclose browser-provided voice recognition."
);
await mustContain(
  "docs/development/verification-report.md",
  "Not Yet Verified",
  "Verification report must preserve unverified-live-ChatGPT caveats."
);

const productFiles = await collectFiles(
  [
    "apps/chatgpt-app/web/src",
    "apps/chatgpt-app/server/src",
    "apps/chatgpt-app/cloudflare-worker/src",
    "apps/browser-extension/src"
  ],
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
if (!main.includes("SpeechRecognition") || !main.includes("InlineAnnotationComposer")) {
  failures.push("Widget must keep inline comment composition with feature-detected speech input.");
}
if (!main.includes("requestBrowserExtensionMicrophonePermission")) {
  failures.push("Browser extension voice input must keep a separate microphone permission flow.");
}

const bridge = await readFile("apps/chatgpt-app/web/src/openaiBridge.ts", "utf8");
if (!bridge.includes("sendFollowUpMessage") || !bridge.includes("ui/message")) {
  failures.push("Bridge must keep both ChatGPT and MCP Apps follow-up send paths.");
}

const extensionManifest = JSON.parse(await readFile("apps/browser-extension/public/manifest.json", "utf8"));
const expectedHostPermissions = [
  "https://chatgpt.com/*",
  "https://chat.openai.com/*",
  "https://claude.ai/*"
];
const expectedPermissions = ["activeTab", "scripting", "sidePanel"];
if (!sameSet(extensionManifest.host_permissions ?? [], expectedHostPermissions)) {
  failures.push("Browser extension host permissions must stay limited to ChatGPT and Claude web.");
}
if (!sameSet(extensionManifest.permissions ?? [], expectedPermissions)) {
  failures.push("Browser extension permissions must stay limited to activeTab, scripting, and sidePanel.");
}
if (
  (extensionManifest.host_permissions ?? []).some(
    (permission) => permission === "<all_urls>" || permission.startsWith("*://")
  )
) {
  failures.push("Browser extension must not request broad host permissions.");
}
const hostIntegration = await readFile("apps/chatgpt-app/web/src/hostIntegrations.ts", "utf8");
if (!hostIntegration.includes("window.getSelection()?.toString()")) {
  failures.push("Browser extension must import active user selection, not scrape chat pages.");
}
if (
  hostIntegration.includes("document.body.innerText") ||
  hostIntegration.includes("document.documentElement.innerText")
) {
  failures.push("Browser extension must not scrape whole page text.");
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

function sameSet(actual, expected) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  return (
    actualSorted.length === expectedSorted.length &&
    actualSorted.every((value, index) => value === expectedSorted[index])
  );
}
