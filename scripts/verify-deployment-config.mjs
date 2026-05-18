import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const failures = [];

await requireFile("Dockerfile");
await requireFile(".dockerignore");
await requireFile("docs/deployment/chatgpt-app-production.md");

const dockerfile = await readFile("Dockerfile", "utf8");
mustContain(dockerfile, "FROM node:22-alpine AS build", "Dockerfile must pin the build stage to Node 22 Alpine.");
mustContain(dockerfile, "RUN npm ci", "Dockerfile must use npm ci for reproducible installs.");
mustContain(dockerfile, "RUN npm run build", "Dockerfile must build the monorepo.");
mustContain(dockerfile, "RUN npm prune --omit=dev", "Dockerfile must prune dev dependencies for runtime.");
mustContain(dockerfile, "ENV HOST=0.0.0.0", "Dockerfile must bind to 0.0.0.0 for container hosts.");
mustContain(dockerfile, "HEALTHCHECK", "Dockerfile must define a health check.");
mustContain(dockerfile, "/health", "Dockerfile health check must target /health.");
mustNotContain(dockerfile, "COPY .env", "Dockerfile must not copy .env files.");

const dockerignore = await readFile(".dockerignore", "utf8");
for (const pattern of [".env", ".env.*", "node_modules", ".git", "secrets", "*.pem", "*.key"]) {
  mustContain(dockerignore, pattern, `.dockerignore must exclude ${pattern}.`);
}

const server = await readFile("apps/chatgpt-app/server/src/index.ts", "utf8");
mustContain(server, "const host = process.env.HOST", "Server must support HOST env for containers.");
mustContain(server, 'httpServer.listen(port, host', "Server must bind to the configured host.");
mustContain(server, 'url.pathname === "/health"', "Server must keep /health route.");

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
if (!packageJson.scripts?.start) {
  failures.push("package.json must define a root start script for container platforms.");
}
if (!packageJson.scripts?.["smoke:container"]) {
  failures.push("package.json must define smoke:container.");
}
if (!packageJson.scripts?.["smoke:remote"]) {
  failures.push("package.json must define smoke:remote.");
}
if (!packageJson.engines?.node?.includes(">=22")) {
  failures.push("package.json must declare node >=22.");
}

const envExample = await readFile(".env.example", "utf8");
for (const name of ["REMOTE_MCP_URL", "REMOTE_HEALTH_URL", "REMOTE_PRIVACY_URL", "SMOKE_REMOTE_REPORT_PATH"]) {
  mustContain(envExample, `${name}=`, `.env.example must document ${name}.`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }, null, 2));

async function requireFile(file) {
  if (!existsSync(file)) {
    failures.push(`Missing required deployment file: ${file}`);
  }
}

function mustContain(text, needle, message) {
  if (!text.includes(needle)) {
    failures.push(message);
  }
}

function mustNotContain(text, needle, message) {
  if (text.includes(needle)) {
    failures.push(message);
  }
}
