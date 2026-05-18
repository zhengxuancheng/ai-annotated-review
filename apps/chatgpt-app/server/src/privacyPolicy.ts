const PRIVACY_POLICY_UPDATED = "2026-05-18";

const privacySections = [
  {
    heading: "Overview",
    body:
      "AI Annotated Review helps users review long AI-generated documents with block-level annotations in a public web app, browser side panel, CLI workflow, or ChatGPT Apps SDK technical preview. The app does not create user accounts, provide billing, sync data across devices, or call an external LLM API from this server."
  },
  {
    heading: "Information processed",
    body:
      "The app processes Markdown or plain text that the user explicitly pastes, selects in ChatGPT or Claude web, provides through the CLI, or asks ChatGPT Developer Mode to open through the MCP tool. The app also processes annotations, statuses, priorities, selected blocks, and generated revision instructions created by the user. If the user clicks the browser voice-dictation button, the inline comment composer uses browser-provided Web Speech recognition when available. This project does not run its own speech server or store audio. Browser-provided speech recognition may be handled by the browser vendor according to that vendor's browser policy."
  },
  {
    heading: "Information not requested",
    body:
      "The app does not ask for credentials, payment information, government identifiers, precise location, full conversation history, raw chat transcripts, API keys, or account passwords."
  },
  {
    heading: "How information is used",
    body:
      "Document text is parsed into review blocks so the widget can render an annotation surface. Confirmed annotations are used to build a revision request only after the user confirms that action."
  },
  {
    heading: "Recipients",
    body:
      "The app sends, copies, or exports a revision request only after the user explicitly confirms or chooses that action. The hosted web and MCP preview are served from Cloudflare Workers, so Cloudflare may process standard operational request data needed to serve, secure, and debug the service."
  },
  {
    heading: "Storage",
    body:
      "The current app does not store review sessions in an application database. Public web and extension sessions live in browser memory until the user exports them. CLI sessions are written only to files selected by the user. Widget state may be kept by the ChatGPT Apps runtime for the active widget experience. Hosting providers may generate standard operational logs for security and reliability."
  },
  {
    heading: "Retention",
    body:
      "The app does not maintain its own persistent review-session database. Review state is intended for the active browser, CLI, or Apps SDK widget experience. Hosting-provider operational logs, if generated, are retained according to the hosting provider's standard infrastructure policies."
  },
  {
    heading: "Sharing",
    body:
      "The app does not sell personal data. The app sends, copies, or exports a revision request only after the user explicitly confirms or chooses that action. By default, that request contains confirmed annotations and necessary local context, not the full original document."
  },
  {
    heading: "User control",
    body:
      "Users decide which comments become confirmed revision instructions. Open, rejected, and resolved comments are excluded from the default revision request."
  },
  {
    heading: "Contact",
    body:
      "For privacy or support questions, open an issue at https://github.com/zhengxuancheng/ai-annotated-review/issues. Do not include private documents, secrets, raw chat histories, credentials, or personal data in public issues."
  }
];

export function renderPrivacyPolicyHtml(): string {
  const sections = privacySections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Annotated Review Privacy Policy</title>
    <style>
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #1f2933;
        background: #f7f5f0;
        line-height: 1.6;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 20px 72px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        line-height: 1.2;
      }
      h2 {
        margin: 28px 0 8px;
        font-size: 20px;
      }
      p {
        margin: 0;
      }
      .notice {
        padding: 14px 16px;
        margin: 24px 0;
        border: 1px solid #d9b25f;
        background: #fff8df;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>AI Annotated Review Privacy Policy</h1>
      <p>Last updated: ${PRIVACY_POLICY_UPDATED}</p>
      ${sections}
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
