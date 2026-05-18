import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const strict = process.argv.includes("--strict");
const failures = [];
const blockers = [];
const warnings = [];

await requireFile("chatgpt-app-submission.json");
await requireFile("docs/submission/submission-checklist.md");
await requireFile("docs/submission/publication-roadmap.md");
await requireFile("docs/submission/test-cases.md");
await requireFile("docs/submission/reviewer-notes.md");
await requireFile("docs/legal/privacy-policy.md");
await requireFile(".env.example");

const submission = JSON.parse(await readFile("chatgpt-app-submission.json", "utf8"));
assert(submission.schema_version === 1, "submission schema_version must be 1");
assert(submission.app_info?.display_name === "AI Annotated Review", "submission app display_name mismatch");
assert(submission.app_info?.category === "PRODUCTIVITY", "submission category must be PRODUCTIVITY");
assert(
  submission.app_info?.subtitle?.length > 0 && submission.app_info.subtitle.length <= 30,
  "submission subtitle must be present and 30 chars or less"
);
const tool = submission.tools?.review_markdown_document;
assert(tool, "submission JSON must describe review_markdown_document");
assert(tool.annotations?.readOnlyHint === true, "submission tool readOnlyHint mismatch");
assert(tool.annotations?.destructiveHint === false, "submission tool destructiveHint mismatch");
assert(tool.annotations?.openWorldHint === false, "submission tool openWorldHint mismatch");
assert((submission.test_cases ?? []).length >= 5, "submission JSON needs at least 5 positive cases");
assert((submission.negative_test_cases ?? []).length >= 3, "submission JSON needs at least 3 negative cases");

await mustContain("README.md", "No native ChatGPT message bubble modification");
await mustContain("README.md", "does not claim public ChatGPT App Directory availability");
await mustContain("docs/privacy-model.md", "confirmed annotations only");
await mustContain("docs/privacy-model.md", "publication-track");
await mustContain("docs/development/verification-report.md", "Not Yet Verified");
await mustContain("docs/legal/privacy-policy.md", "https://github.com/zhengxuancheng/ai-annotated-review/issues");
await mustContain(".env.example", "APP_WIDGET_DOMAIN=");
await mustContain(".env.example", "APP_PRIVACY_POLICY_URL=");

const server = await readFile("apps/chatgpt-app/server/src/index.ts", "utf8");
const appServer = await readFile("apps/chatgpt-app/server/src/app.ts", "utf8");
mustMatch(server, /APP_WIDGET_DOMAIN/, "server must support APP_WIDGET_DOMAIN");
mustMatch(server, /APP_CSP_CONNECT_DOMAINS/, "server must support APP_CSP_CONNECT_DOMAINS");
mustMatch(server, /url\.pathname === "\/app"/, "server must expose /app");
mustMatch(server, /url\.pathname === "\/health"/, "server must expose /health");
mustMatch(server, /url\.pathname === "\/privacy"/, "server must expose /privacy");
mustMatch(appServer, /outputSchema:\s*reviewToolOutputSchema/, "tool must declare outputSchema");
mustMatch(appServer, /readOnlyHint:\s*true/, "tool must declare readOnlyHint true");
mustMatch(appServer, /destructiveHint:\s*false/, "tool must declare destructiveHint false");
mustMatch(appServer, /openWorldHint:\s*false/, "tool must declare openWorldHint false");

const guardrails = await readFile("AGENTS.md", "utf8");
mustMatch(guardrails, /Do not submit the app in the OpenAI dashboard/, "AGENTS must preserve no-auto-submit guardrail");
mustMatch(guardrails, /Dashboard prerequisites are paused owner-side gates/, "AGENTS must preserve paused dashboard gate");

if (!existsSync("LICENSE")) {
  blockers.push("License file is intentionally absent; public repository release needs a license/patent decision.");
}

const screenshotDir = "docs/submission/screenshots";
const screenshotFiles = existsSync(screenshotDir)
  ? (await readdir(screenshotDir)).filter((file) => /\.(png|jpg|jpeg)$/i.test(file))
  : [];
if (screenshotFiles.length === 0) {
  blockers.push("No draft submission screenshots captured yet.");
}
if (!existsSync(path.join(screenshotDir, "production-review-widget-desktop.png"))) {
  blockers.push("No production ChatGPT connector screenshot captured yet.");
}

const liveValidation = "docs/submission/live-validation-report.md";
if (!existsSync(liveValidation)) {
  blockers.push("No live ChatGPT developer-mode validation report exists yet.");
} else {
  const liveValidationText = await readFile(liveValidation, "utf8");
  if (!/\bStatus:\s*passed\b/i.test(liveValidationText)) {
    blockers.push("Live ChatGPT developer-mode validation report exists but is not marked Status: passed.");
  }
  for (const label of [
    "Public MCP endpoint",
    "ChatGPT client",
    "Positive prompt 1",
    "Negative prompt 1",
    "Widget render",
    "Confirmation modal",
    "Follow-up send",
    "Verdict"
  ]) {
    mustMatch(liveValidationText, new RegExp(`${escapeRegExp(label)}:\\s*\\S`, "i"), `live validation report must fill: ${label}`);
  }
  mustNotMatch(liveValidationText, /\bTODO\b|\bpending\b/i, "live validation report must not contain TODO or pending markers.");
}

const remoteSmokeReport = "docs/submission/remote-smoke-report.json";
if (!existsSync(remoteSmokeReport)) {
  blockers.push("No remote MCP smoke report exists yet. Run smoke:remote against the public HTTPS /mcp endpoint and save the report.");
} else {
  const remoteSmoke = JSON.parse(await readFile(remoteSmokeReport, "utf8"));
  const expectedRemoteEndpoint = resolveExpectedMcpEndpoint();
  assert(remoteSmoke.ok === true, "remote smoke report must have ok: true");
  assert(remoteSmoke.server?.name === "ai-annotated-review", "remote smoke report server name mismatch");
  assert(remoteSmoke.blockCount > 0, "remote smoke report must include a positive blockCount");
  assert(remoteSmoke.widgetHtmlChars > 0, "remote smoke report must include widgetHtmlChars");
  assert(
    typeof remoteSmoke.endpoint === "string" &&
      remoteSmoke.endpoint.startsWith("https://") &&
      isMcpEndpoint(remoteSmoke.endpoint),
    "remote smoke report endpoint must be an HTTPS /mcp URL"
  );
  if (expectedRemoteEndpoint) {
    assert(
      remoteSmoke.endpoint === expectedRemoteEndpoint,
      `remote smoke report endpoint must match configured submission endpoint ${expectedRemoteEndpoint}`
    );
  }
  if (strict) {
    assert(isRecentIsoTimestamp(remoteSmoke.checkedAt, 24), "remote smoke report must be generated within the last 24 hours for strict submission readiness");
    if (isTemporaryTunnelUrl(remoteSmoke.endpoint)) {
      blockers.push("Remote smoke report uses a temporary tunnel endpoint; final submission needs a stable production HTTPS origin.");
    }
  }
}

const publicEnvNames = ["APP_PUBLIC_BASE_URL", "APP_WIDGET_DOMAIN", "APP_PRIVACY_POLICY_URL"];
for (const name of publicEnvNames) {
  const value = process.env[name]?.trim();
  if (!value || value.includes("your-domain.example")) {
    blockers.push(`${name} is not set to a real production HTTPS value.`);
    continue;
  }
  if (!value.startsWith("https://")) {
    failures.push(`${name} must start with https:// for submission.`);
  }
  if (strict && isTemporaryTunnelUrl(value)) {
    blockers.push(`${name} uses a temporary tunnel endpoint; final submission needs a stable production HTTPS origin.`);
  }
}

for (const name of ["APP_CSP_CONNECT_DOMAINS", "APP_CSP_RESOURCE_DOMAINS", "APP_CSP_FRAME_DOMAINS"]) {
  const value = process.env[name]?.trim();
  if (value?.includes("*")) {
    failures.push(`${name} contains a wildcard; use exact domains before broad distribution.`);
  }
}

if (!strict && blockers.length > 0) {
  warnings.push(...blockers);
}

if (failures.length > 0 || (strict && blockers.length > 0)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: strict ? "strict" : "local",
        failures,
        blockers,
        warnings
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: strict ? "strict" : "local",
      warnings,
      blockers: strict ? [] : blockers
    },
    null,
    2
  )
);

async function requireFile(file) {
  if (!existsSync(file)) {
    failures.push(`Missing required file: ${file}`);
  }
}

async function mustContain(file, needle) {
  const text = await readFile(file, "utf8");
  if (!text.includes(needle)) {
    failures.push(`${file} must contain: ${needle}`);
  }
}

function mustMatch(text, pattern, message) {
  if (!pattern.test(text)) {
    failures.push(message);
  }
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function mustNotMatch(text, pattern, message) {
  if (pattern.test(text)) {
    failures.push(message);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMcpEndpoint(value) {
  try {
    return new URL(value).pathname === "/mcp";
  } catch {
    return false;
  }
}

function isTemporaryTunnelUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname.endsWith(".trycloudflare.com") ||
      hostname.endsWith(".loca.lt") ||
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".ngrok.io")
    );
  } catch {
    return false;
  }
}

function resolveExpectedMcpEndpoint() {
  const explicit = process.env.REMOTE_MCP_URL?.trim();
  if (explicit) return explicit;
  const base = process.env.APP_PUBLIC_BASE_URL?.trim();
  if (!base || base.includes("your-domain.example")) return null;
  try {
    const url = new URL(base);
    url.pathname = "/mcp";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function isRecentIsoTimestamp(value, maxAgeHours) {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return Date.now() - timestamp >= 0 && Date.now() - timestamp <= maxAgeMs;
}
