import { createMcpHandler } from "agents/mcp";
import {
  MCP_PATH,
  SERVER_VERSION,
  createAiAnnotatedReviewServer
} from "@ai-annotated-review/chatgpt-app-server/app";
import { renderPrivacyPolicyHtml } from "@ai-annotated-review/chatgpt-app-server/privacy";
import { WIDGET_HTML } from "./generated/widgetHtml.js";

type Env = {
  APP_PUBLIC_BASE_URL?: string;
  APP_WIDGET_DOMAIN?: string;
  APP_PRIVACY_POLICY_URL?: string;
  APP_CSP_CONNECT_DOMAINS?: string;
  APP_CSP_RESOURCE_DOMAINS?: string;
  APP_CSP_FRAME_DOMAINS?: string;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const publicOrigin = resolvePublicOrigin(request, env);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(`AI Annotated Review MCP server. Endpoint: ${MCP_PATH}`, {
        headers: textHeaders()
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        ok: true,
        name: "ai-annotated-review",
        version: SERVER_VERSION,
        mcpPath: MCP_PATH,
        publicBaseUrl: publicOrigin,
        privacyPolicyUrl: env.APP_PRIVACY_POLICY_URL ?? `${publicOrigin}/privacy`,
        widgetDomainConfigured: true,
        runtime: "cloudflare-workers"
      });
    }

    if (request.method === "GET" && url.pathname === "/privacy") {
      return new Response(renderPrivacyPolicyHtml(), {
        headers: htmlHeaders()
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === MCP_PATH &&
      !acceptsEventStream(request.headers.get("accept"))
    ) {
      return new Response("AI Annotated Review MCP endpoint. Use POST with MCP JSON-RPC messages.", {
        headers: {
          ...textHeaders(),
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    if (url.pathname === MCP_PATH) {
      const server = createAiAnnotatedReviewServer({
        loadWidgetHtml: () => WIDGET_HTML,
        widgetDomain: resolveWidgetDomain(request, env),
        cspConnectDomains: parseDomainList(env.APP_CSP_CONNECT_DOMAINS),
        cspResourceDomains: parseDomainList(env.APP_CSP_RESOURCE_DOMAINS),
        cspFrameDomains: parseDomainList(env.APP_CSP_FRAME_DOMAINS)
      });

      return createMcpHandler(server, { route: MCP_PATH })(request, env, ctx);
    }

    return new Response("Not Found", { status: 404, headers: textHeaders() });
  }
};

function resolvePublicOrigin(request: Request, env: Env): string {
  const configured = env.APP_PUBLIC_BASE_URL?.trim();
  if (configured) return validateHttpsOrigin(configured, "APP_PUBLIC_BASE_URL");
  return new URL(request.url).origin;
}

function resolveWidgetDomain(request: Request, env: Env): string {
  const configured = env.APP_WIDGET_DOMAIN?.trim();
  if (configured) return validateHttpsOrigin(configured, "APP_WIDGET_DOMAIN");
  return resolvePublicOrigin(request, env);
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
    validateHttpsOrigin(domain, "CSP domain");
  }
  return domains;
}

function validateHttpsOrigin(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${label} must use https://.`);
  }
  return url.origin;
}

function acceptsEventStream(value: string | null): boolean {
  return (value ?? "").toLowerCase().includes("text/event-stream");
}

function htmlHeaders(): HeadersInit {
  return {
    "content-type": "text/html; charset=utf-8"
  };
}

function textHeaders(): HeadersInit {
  return {
    "content-type": "text/plain; charset=utf-8"
  };
}
