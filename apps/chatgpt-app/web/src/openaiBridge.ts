import type { ReviewSession } from "@ai-annotated-review/annotation-model";

const BRIDGE_REQUEST_TIMEOUT_MS = 1500;

type JsonRpcMessage = {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

type ToolResult = {
  structuredContent?: unknown;
  content?: unknown;
  _meta?: {
    reviewSession?: ReviewSession;
    [key: string]: unknown;
  };
};

type StructuredWidgetState = {
  modelContent: string | Record<string, unknown> | null;
  privateContent: Record<string, unknown> | null;
  imageIds: string[];
};

type OpenAiBridge = {
  toolOutput?: unknown;
  toolResponseMetadata?: ToolResult["_meta"];
  widgetState?: StructuredWidgetState | null;
  setWidgetState?: (state: StructuredWidgetState) => void;
  sendFollowUpMessage?: (message: {
    prompt: string;
    scrollToBottom?: boolean;
  }) => Promise<void> | void;
  requestDisplayMode?: (input: { mode: "inline" | "pip" | "fullscreen" }) => Promise<void> | void;
  notifyIntrinsicHeight?: (height: number) => void;
};

declare global {
  interface Window {
    openai?: OpenAiBridge;
  }
}

let rpcId = 0;
const pending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
>();

window.addEventListener(
  "message",
  (event) => {
    if (event.source !== window.parent) return;
    const message = event.data as JsonRpcMessage;
    if (!message || message.jsonrpc !== "2.0" || typeof message.id !== "number") {
      return;
    }

    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) {
      request.reject(message.error);
      return;
    }
    request.resolve(message.result);
  },
  { passive: true }
);

export function getInitialReviewSession(): ReviewSession | null {
  const metaSession = window.openai?.toolResponseMetadata?.reviewSession;
  if (metaSession) return metaSession;
  return null;
}

export function getInitialWidgetState(): StructuredWidgetState | null {
  return window.openai?.widgetState ?? null;
}

export function persistPrivateWidgetState(privateContent: Record<string, unknown>): void {
  window.openai?.setWidgetState?.({
    modelContent: null,
    privateContent,
    imageIds: []
  });
}

export function subscribeToReviewSession(
  onSession: (session: ReviewSession) => void
): () => void {
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    const message = event.data as JsonRpcMessage;
    if (!message || message.jsonrpc !== "2.0") return;
    if (message.method !== "ui/notifications/tool-result") return;
    const result = message.params as ToolResult;
    const session = result?._meta?.reviewSession;
    if (session) onSession(session);
  };

  const onGlobals = (event: Event) => {
    const detail = (event as CustomEvent<{ globals?: OpenAiBridge }>).detail;
    const session = detail?.globals?.toolResponseMetadata?.reviewSession;
    if (session) onSession(session);
  };

  window.addEventListener("message", onMessage, { passive: true });
  window.addEventListener("openai:set_globals", onGlobals, { passive: true });
  return () => {
    window.removeEventListener("message", onMessage);
    window.removeEventListener("openai:set_globals", onGlobals);
  };
}

export async function initializeMcpBridge(): Promise<void> {
  if (window.parent === window) return;
  try {
    await rpcRequest("ui/initialize", {
      appInfo: { name: "ai-annotated-review", version: "0.1.0" },
      appCapabilities: {},
      protocolVersion: "2026-01-26"
    });
    rpcNotify("ui/notifications/initialized", {});
  } catch {
    // ChatGPT compatibility globals may still be available even if the standard bridge init is not.
  }
}

export type RevisionDeliveryMode = "send" | "copy";
export type RevisionDeliveryResult = "sent" | "copied" | "fallback";

export function getRevisionDeliveryMode(): RevisionDeliveryMode {
  if (window.openai?.sendFollowUpMessage || window.parent !== window) {
    return "send";
  }
  return "copy";
}

export async function sendRevisionFollowUp(prompt: string): Promise<RevisionDeliveryResult> {
  if (window.openai?.sendFollowUpMessage) {
    await window.openai.sendFollowUpMessage({ prompt, scrollToBottom: true });
    return "sent";
  }

  if (window.parent !== window) {
    rpcNotify("ui/message", {
      role: "user",
      content: [{ type: "text", text: prompt }]
    });
    return "sent";
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(prompt);
    return "copied";
  }

  return "fallback";
}

export async function requestFullscreen(): Promise<void> {
  await window.openai?.requestDisplayMode?.({ mode: "fullscreen" });
}

function rpcNotify(method: string, params: unknown): void {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
}

function rpcRequest(method: string, params: unknown): Promise<unknown> {
  const id = ++rpcId;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP bridge request timed out: ${method}`));
    }, BRIDGE_REQUEST_TIMEOUT_MS);

    pending.set(id, {
      resolve: (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      reject: (reason) => {
        window.clearTimeout(timeout);
        reject(reason);
      }
    });
    window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  });
}
