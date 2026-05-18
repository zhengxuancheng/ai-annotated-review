import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import {
  MCP_PATH,
  SERVER_VERSION,
  createAiAnnotatedReviewServer
} from "./app.js";
import { renderPrivacyPolicyHtml } from "./privacyPolicy.js";
import { loadWidgetHtml } from "./widgetHtml.js";

const PUBLIC_BASE_URL = parseOptionalHttpsUrl("APP_PUBLIC_BASE_URL", true);
const PRIVACY_POLICY_URL = parseOptionalHttpsUrl("APP_PRIVACY_POLICY_URL", false);
const WIDGET_DOMAIN = parseOptionalHttpsUrl("APP_WIDGET_DOMAIN", true);

function createConfiguredMcpServer() {
  return createAiAnnotatedReviewServer({
    loadWidgetHtml,
    widgetDomain: WIDGET_DOMAIN,
    cspConnectDomains: parseDomainList(process.env.APP_CSP_CONNECT_DOMAINS),
    cspResourceDomains: parseDomainList(process.env.APP_CSP_RESOURCE_DOMAINS),
    cspFrameDomains: parseDomainList(process.env.APP_CSP_FRAME_DOMAINS)
  });
}

function parseDomainList(value: string | undefined): string[] {
  if (!value) return [];
  const domains = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const domain of domains) {
    if (domain.includes("*")) {
      throw new Error(`CSP domains must be exact origins, got "${domain}".`);
    }
    validateHttpsUrl(domain, "CSP domain");
  }
  return domains;
}

function parseOptionalHttpsUrl(envName: string, originOnly: boolean): string | null {
  const value = process.env[envName]?.trim();
  if (!value) return null;
  return validateHttpsUrl(value, envName, originOnly);
}

function validateHttpsUrl(value: string, label: string, originOnly = true): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${label} must use https://.`);
  }
  return originOnly ? url.origin : url.href;
}

function acceptsEventStream(value: string | string[] | undefined): boolean {
  const header = Array.isArray(value) ? value.join(",") : value ?? "";
  return header.toLowerCase().includes("text/event-stream");
}

function parsePort(value: string | undefined): number {
  const parsed = Number(value ?? 8787);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return parsed;
}

const port = parsePort(process.env.PORT);
const host = process.env.HOST?.trim() || "0.0.0.0";

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(`AI Annotated Review MCP server. Endpoint: ${MCP_PATH}`);
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        ok: true,
        name: "ai-annotated-review",
        version: SERVER_VERSION,
        mcpPath: MCP_PATH,
        publicBaseUrl: PUBLIC_BASE_URL,
        privacyPolicyUrl: PRIVACY_POLICY_URL,
        widgetDomainConfigured: Boolean(WIDGET_DOMAIN)
      })
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/privacy") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(renderPrivacyPolicyHtml());
    return;
  }

  if (
    req.method === "GET" &&
    url.pathname === MCP_PATH &&
    !acceptsEventStream(req.headers.accept)
  ) {
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    });
    res.end("AI Annotated Review MCP endpoint. Use POST with MCP JSON-RPC messages.");
    return;
  }

  if (url.pathname === MCP_PATH && ["POST", "GET", "DELETE"].includes(req.method ?? "")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createConfiguredMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("MCP request failed:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null
          })
        );
      }
    }
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

httpServer.listen(port, host, () => {
  console.log(`AI Annotated Review MCP server listening on http://${host}:${port}${MCP_PATH}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
}
