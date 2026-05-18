import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

process.on("uncaughtException", failAndExit);
process.on("unhandledRejection", failAndExit);

const endpoint = resolveMcpEndpoint();
const healthUrl = resolveSiblingUrl("REMOTE_HEALTH_URL", endpoint, "/health");
const privacyUrl = resolveSiblingUrl("REMOTE_PRIVACY_URL", endpoint, "/privacy");
const expectedWidgetDomain = process.env.APP_WIDGET_DOMAIN?.trim();
const reportPath = process.env.SMOKE_REMOTE_REPORT_PATH?.trim();
let rpcId = 0;

const checkedAt = new Date().toISOString();
const endpointProbe = await fetchText(endpoint);
assert(endpointProbe.includes("AI Annotated Review MCP endpoint"), "plain GET /mcp probe did not return endpoint info");
const health = await fetchJson(healthUrl);
assert(health.ok === true, "health endpoint did not return ok");
assert(health.mcpPath === "/mcp", "health endpoint returned wrong MCP path");

const privacy = await fetchText(privacyUrl);
assert(privacy.includes("Privacy Policy"), "privacy route did not include a privacy policy title");

const init = await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "ai-annotated-review-remote-smoke", version: "0.1.0" }
});
assert(init.result?.serverInfo?.name === "ai-annotated-review", "initialize returned wrong server name");

const toolList = await rpc("tools/list", {});
const tool = toolList.result?.tools?.find((candidate) => candidate.name === "review_markdown_document");
assert(tool, "review_markdown_document tool missing");
assert(tool.annotations?.readOnlyHint === true, "tool must be read-only");
assert(tool.annotations?.destructiveHint === false, "tool must be non-destructive");
assert(tool.annotations?.openWorldHint === false, "tool must be closed-world");
assert(tool.outputSchema, "tool must expose outputSchema for submission reliability");

const markdown = await readFile("examples/fixtures/product-plan.md", "utf8");
const call = await rpc("tools/call", {
  name: "review_markdown_document",
  arguments: {
    title: "Remote MCP Smoke Fixture",
    sourceLabel: "smoke-remote-mcp",
    markdown
  }
});

const result = call.result;
assert(result?.structuredContent?.ok === true, "tool call did not return ok");
assert(result.structuredContent.blockCount > 0, "block count missing");
assert(result._meta?.reviewSession?.document?.blocks?.length > 0, "_meta.reviewSession blocks missing");
const structured = JSON.stringify(result.structuredContent);
assert(!structured.includes("The biggest risk is overclaiming"), "structuredContent leaked paragraph body");
assert(JSON.stringify(result._meta?.dataBoundary ?? {}).includes("fullDocumentInMetaOnly"), "data boundary metadata missing");

const resources = await rpc("resources/list", {});
const resource = resources.result?.resources?.find(
  (candidate) =>
    typeof candidate.uri === "string" &&
    candidate.uri.startsWith("ui://ai-annotated-review/review-widget-")
);
assert(resource?.mimeType === "text/html;profile=mcp-app", "widget resource MIME type is wrong");

const read = await rpc("resources/read", {
  uri: resource.uri
});
const content = read.result?.contents?.[0];
assert(content?.mimeType === "text/html;profile=mcp-app", "read resource MIME type is wrong");
assert(content?.text?.includes("<div id=\"root\">"), "widget HTML missing root");
assert(content?._meta?.ui?.csp, "widget CSP metadata missing");
if (expectedWidgetDomain) {
  assert(
    content?._meta?.ui?.domain === expectedWidgetDomain,
    "widget domain metadata did not match APP_WIDGET_DOMAIN"
  );
}

const report = {
  ok: true,
  checkedAt,
  endpoint: endpoint.href,
  health: {
    ok: health.ok,
    mcpPath: health.mcpPath,
    widgetDomainConfigured: health.widgetDomainConfigured
  },
  endpointProbe: true,
  server: init.result.serverInfo,
  toolCount: toolList.result?.tools?.length ?? 0,
  blockCount: result.structuredContent.blockCount,
  widgetUri: resource.uri,
  widgetHtmlChars: content.text.length,
  widgetDomain: content?._meta?.ui?.domain ?? null
};

if (reportPath) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(report, null, 2));

async function rpc(method, params) {
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream"
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextRpcId(), method, params })
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  const payload = await parseMcpResponse(response);
  if (payload.error) {
    throw new Error(`RPC ${method} returned error: ${JSON.stringify(payload.error)}`);
  }
  return payload;
}

async function parseMcpResponse(response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    return JSON.parse(text);
  }

  const dataLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .filter((line) => line.length > 0 && line !== "[DONE]");
  const jsonLine = dataLines.find((line) => line.startsWith("{"));
  if (!jsonLine) {
    throw new Error("MCP event-stream response did not include a JSON data event.");
  }
  return JSON.parse(jsonLine);
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`GET ${url.href} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`GET ${url.href} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.text();
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function resolveMcpEndpoint() {
  const raw =
    process.env.REMOTE_MCP_URL?.trim() ??
    process.env.APP_MCP_URL?.trim() ??
    buildEndpointFromBase(process.env.APP_PUBLIC_BASE_URL?.trim());
  if (!raw || raw.includes("your-domain.example")) {
    throw new Error("Set REMOTE_MCP_URL or APP_PUBLIC_BASE_URL to a real public HTTPS endpoint before running smoke:remote.");
  }

  const url = new URL(raw);
  if (url.protocol !== "https:" && process.env.REMOTE_MCP_ALLOW_HTTP !== "1") {
    throw new Error("Remote MCP smoke requires HTTPS. Set REMOTE_MCP_ALLOW_HTTP=1 only for private local debugging.");
  }
  if (url.pathname !== "/mcp") {
    throw new Error(`Remote MCP endpoint must end at /mcp, got ${url.href}`);
  }
  return url;
}

function buildEndpointFromBase(value) {
  if (!value) return undefined;
  const url = new URL(value);
  url.pathname = "/mcp";
  url.search = "";
  url.hash = "";
  return url.href;
}

function resolveSiblingUrl(envName, mcpEndpoint, pathname) {
  const explicit = process.env[envName]?.trim();
  if (explicit) return new URL(explicit);
  const url = new URL(mcpEndpoint);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nextRpcId() {
  rpcId += 1;
  return rpcId;
}

function failAndExit(error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, reason }, null, 2));
  process.exit(1);
}
