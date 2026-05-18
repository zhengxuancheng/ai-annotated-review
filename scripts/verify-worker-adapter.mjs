import { access, readFile } from "node:fs/promises";
import path from "node:path";

process.on("uncaughtException", failAndExit);
process.on("unhandledRejection", failAndExit);

const workerRoot = path.join("apps", "chatgpt-app", "cloudflare-worker");
const requiredFiles = [
  path.join(workerRoot, "package.json"),
  path.join(workerRoot, "tsconfig.json"),
  path.join(workerRoot, "wrangler.jsonc"),
  path.join(workerRoot, "src", "index.ts"),
  path.join(workerRoot, "src", "generated", "widgetHtml.ts")
];

for (const file of requiredFiles) {
  await access(file);
}

const packageJson = JSON.parse(await readFile(path.join(workerRoot, "package.json"), "utf8"));
assert(
  packageJson.name === "@ai-annotated-review/chatgpt-app-cloudflare-worker",
  "worker package name is wrong"
);
assert(packageJson.private === true, "worker package must remain private before release decision");
assert(packageJson.scripts?.build, "worker package must define a build script");
assert(packageJson.scripts?.deploy, "worker package must define a deploy script");
assert(packageJson.dependencies?.agents, "worker package must depend on Cloudflare agents");

const wrangler = await readJsonc(path.join(workerRoot, "wrangler.jsonc"));
assert(wrangler.name === "ai-annotated-review", "wrangler worker name must be stable");
assert(wrangler.main === "src/index.ts", "wrangler main must point to src/index.ts");
assert(
  Array.isArray(wrangler.compatibility_flags) &&
    wrangler.compatibility_flags.includes("nodejs_compat"),
  "wrangler config must enable nodejs_compat for MCP SDK compatibility"
);
assert(
  !JSON.stringify(wrangler).includes("trycloudflare.com"),
  "wrangler config must not contain temporary tunnel URLs"
);
assert(
  !JSON.stringify(wrangler).includes("your-domain.example"),
  "wrangler config must not contain placeholder submission URLs"
);

const workerSource = await readFile(path.join(workerRoot, "src", "index.ts"), "utf8");
assert(workerSource.includes("createMcpHandler"), "worker must use Cloudflare createMcpHandler");
assert(workerSource.includes("createAiAnnotatedReviewServer"), "worker must reuse the shared MCP app server");
assert(workerSource.includes("resolvePublicOrigin"), "worker must derive a stable origin from the request or env");
assert(workerSource.includes("/app"), "worker must expose the public web app at /app");
assert(workerSource.includes("/health"), "worker must expose /health");
assert(workerSource.includes("/privacy"), "worker must expose /privacy");

const widgetSource = await readFile(path.join(workerRoot, "src", "generated", "widgetHtml.ts"), "utf8");
assert(widgetSource.includes("export const WIDGET_HTML"), "generated widget module must export WIDGET_HTML");
assert(widgetSource.includes("<div id=\\\"root\\\">"), "generated widget HTML must include the React root");
assert(widgetSource.length > 100_000, "generated widget HTML is unexpectedly small");

console.log(
  JSON.stringify(
    {
      ok: true,
      workerRoot,
      requiredFiles: requiredFiles.length,
      widgetSourceChars: widgetSource.length
    },
    null,
    2
  )
);

async function readJsonc(file) {
  const text = await readFile(file, "utf8");
  return JSON.parse(stripJsonc(text));
}

function stripJsonc(value) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function failAndExit(error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, reason }, null, 2));
  process.exit(1);
}
