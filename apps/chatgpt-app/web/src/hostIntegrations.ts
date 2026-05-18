type ChromeTab = {
  id?: number;
  title?: string;
  url?: string;
};

type ChromeApi = {
  runtime?: { id?: string };
  tabs?: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<ChromeTab[]>;
  };
  scripting?: {
    executeScript: (injection: {
      target: { tabId: number };
      func: () => string;
    }) => Promise<Array<{ result?: unknown }>>;
  };
};

export type ActiveTabSelection = {
  text: string;
  title: string;
  sourceLabel: string;
  url?: string;
};

export function isBrowserExtensionHost(): boolean {
  const chrome = getChromeApi();
  return Boolean(chrome?.runtime?.id && chrome.tabs && chrome.scripting);
}

export async function readActiveTabSelection(): Promise<ActiveTabSelection> {
  const chrome = getChromeApi();
  if (!chrome?.tabs || !chrome.scripting) {
    throw new Error("Browser extension APIs are unavailable.");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active browser tab was found.");
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString() ?? ""
  });
  const text = typeof result?.result === "string" ? result.result.trim() : "";
  return {
    text,
    title: normalizeTitle(tab.title),
    sourceLabel: sourceLabelForUrl(tab.url),
    ...(tab.url ? { url: tab.url } : {})
  };
}

function getChromeApi(): ChromeApi | undefined {
  return (globalThis as unknown as { chrome?: ChromeApi }).chrome;
}

function sourceLabelForUrl(url: string | undefined): string {
  if (!url) return "Browser selection";
  try {
    const host = new URL(url).host;
    if (host === "chatgpt.com" || host === "chat.openai.com") {
      return "ChatGPT selected text";
    }
    if (host === "claude.ai") {
      return "Claude selected text";
    }
    return `Browser selection: ${host}`;
  } catch {
    return "Browser selection";
  }
}

function normalizeTitle(title: string | undefined): string {
  const normalized = title?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 120) : "Selected AI output";
}
