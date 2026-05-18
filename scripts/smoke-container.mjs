import { spawn, spawnSync } from "node:child_process";

const image = process.env.SMOKE_CONTAINER_IMAGE ?? "ai-annotated-review:local-smoke";
const hostPort = parsePort(process.env.SMOKE_CONTAINER_PORT, 8988);
const containerPort = 8787;
const baseUrl = `http://127.0.0.1:${hostPort}`;
const testOrigin = "https://ai-annotated-review.example.com";
let rpcId = 0;

const dockerVersion = spawnSync("docker", ["--version"], { encoding: "utf8" });
if (dockerVersion.status !== 0) {
  fail("Docker is not available. Install Docker or skip smoke:container.");
}

const dockerInfo = spawnSync("docker", ["info"], { encoding: "utf8" });
if (dockerInfo.status !== 0) {
  fail(
    `Docker CLI is installed but the Docker daemon is not reachable. Start Docker Desktop or the Docker daemon, then rerun smoke:container.\n${dockerInfo.stderr || dockerInfo.stdout}`
  );
}

await run("docker", ["build", "-t", image, "."]);

const runResult = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-d",
    "-p",
    `127.0.0.1:${hostPort}:${containerPort}`,
    "-e",
    `APP_PUBLIC_BASE_URL=${testOrigin}`,
    "-e",
    `APP_WIDGET_DOMAIN=${testOrigin}`,
    "-e",
    `APP_PRIVACY_POLICY_URL=${testOrigin}/privacy`,
    image
  ],
  { encoding: "utf8" }
);

if (runResult.status !== 0) {
  throw new Error(`docker run failed:\n${runResult.stderr || runResult.stdout}`);
}

const containerId = runResult.stdout.trim();

try {
  await waitForHealth(`${baseUrl}/health`);
  const health = await fetchJson(`${baseUrl}/health`);
  assert(health.ok === true, "container health did not return ok");
  assert(health.mcpPath === "/mcp", "container health returned wrong MCP path");
  assert(health.widgetDomainConfigured === true, "container did not report widget domain");

  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "ai-annotated-review-container-smoke", version: "0.1.0" }
  });
  assert(init.result?.serverInfo?.name === "ai-annotated-review", "container MCP initialize failed");

  const tools = await rpc("tools/list", {});
  const tool = tools.result?.tools?.find((candidate) => candidate.name === "review_markdown_document");
  assert(tool, "container MCP tool missing");

  console.log(
    JSON.stringify(
      {
        ok: true,
        image,
        containerId,
        health,
        toolCount: tools.result?.tools?.length ?? 0
      },
      null,
      2
    )
  );
} finally {
  spawnSync("docker", ["stop", containerId], { stdio: "ignore" });
}

async function rpc(method, params) {
  const response = await fetch(`${baseUrl}/mcp`, {
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

async function waitForHealth(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
    }
    await sleep(250);
  }
  throw new Error(`Container did not become healthy at ${url}.`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, reason: message.trim() }, null, 2));
  process.exit(1);
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
