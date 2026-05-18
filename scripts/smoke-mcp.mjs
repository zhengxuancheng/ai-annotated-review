import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const PORT = parsePort(process.env.SMOKE_MCP_PORT, 8977);
const MCP_URL = `http://127.0.0.1:${PORT}/mcp`;
const ROOT_URL = `http://127.0.0.1:${PORT}/`;
const HEALTH_URL = `http://127.0.0.1:${PORT}/health`;
const PRIVACY_URL = `http://127.0.0.1:${PORT}/privacy`;
const TEST_PUBLIC_ORIGIN = "https://ai-annotated-review.example.com";
let rpcId = 0;

const server = spawn(
  process.execPath,
  ["apps/chatgpt-app/server/dist/index.js"],
  {
    env: {
      ...process.env,
      PORT: String(PORT),
      APP_PUBLIC_BASE_URL: TEST_PUBLIC_ORIGIN,
      APP_PRIVACY_POLICY_URL: `${TEST_PUBLIC_ORIGIN}/privacy`,
      APP_WIDGET_DOMAIN: TEST_PUBLIC_ORIGIN
    },
    stdio: ["ignore", "pipe", "pipe"]
  }
);

const logs = [];
server.stdout.on("data", (chunk) => logs.push(String(chunk)));
server.stderr.on("data", (chunk) => logs.push(String(chunk)));

try {
  await waitForHttp(ROOT_URL);
  const health = await fetchJson(HEALTH_URL);
  assert(health.ok === true, "health endpoint did not return ok");
  assert(health.mcpPath === "/mcp", "health endpoint returned wrong MCP path");
  assert(health.widgetDomainConfigured === true, "health endpoint did not report widget domain");

  const privacy = await fetchText(PRIVACY_URL);
  assert(privacy.includes("AI Annotated Review Privacy Policy"), "privacy route missing policy title");

  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "ai-annotated-review-smoke", version: "0.1.0" }
  });
  assert(init.result?.serverInfo?.name === "ai-annotated-review", "initialize returned wrong server name");

  const toolList = await rpc("tools/list", {});
  const tool = toolList.result?.tools?.find((candidate) => candidate.name === "review_markdown_document");
  assert(tool, "review_markdown_document tool missing");
  assert(tool.annotations?.readOnlyHint === true, "tool must be read-only");
  assert(tool.annotations?.destructiveHint === false, "tool must be non-destructive");
  assert(tool.annotations?.openWorldHint === false, "tool must be closed-world");

  const markdown = await readFile("examples/fixtures/product-plan.md", "utf8");
  const call = await rpc("tools/call", {
    name: "review_markdown_document",
    arguments: {
      title: "MCP Smoke Fixture",
      sourceLabel: "smoke-mcp",
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
  assert(
    content?._meta?.ui?.domain === TEST_PUBLIC_ORIGIN,
    "widget domain metadata did not honor APP_WIDGET_DOMAIN"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        server: init.result.serverInfo,
        blockCount: result.structuredContent.blockCount,
        widgetHtmlChars: content.text.length
      },
      null,
      2
    )
  );
} finally {
  server.kill("SIGTERM");
}

async function rpc(method, params) {
  const response = await fetch(MCP_URL, {
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
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`RPC ${method} returned error: ${JSON.stringify(payload.error)}`);
  }
  return payload;
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
  throw new Error(`Server did not become ready. Logs:\n${logs.join("")}`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.text();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nextRpcId() {
  rpcId += 1;
  return rpcId;
}

function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid port: ${value ?? fallback}`);
  }
  return parsed;
}
