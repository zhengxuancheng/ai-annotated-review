const PRIVACY_POLICY_UPDATED = "2026-05-18";

const privacySections = [
  {
    heading: "Overview",
    body:
      "AI Annotated Review helps users review long AI-generated documents with block-level annotations inside a ChatGPT app widget. The app does not create user accounts, provide billing, sync data across devices, or call an external LLM API from this server."
  },
  {
    heading: "Information processed",
    body:
      "The MCP tool processes the Markdown or plain text document that the user explicitly asks ChatGPT to open for review, plus optional title and source label fields. The app also processes annotations, statuses, priorities, and generated revision instructions created by the user in the widget."
  },
  {
    heading: "How information is used",
    body:
      "Document text is parsed into review blocks so the widget can render an annotation surface. Confirmed annotations are used to build a revision request only after the user confirms that action."
  },
  {
    heading: "Storage",
    body:
      "The current app does not store review sessions in an application database. Widget state may be kept by the ChatGPT Apps runtime for the active widget experience. Hosting providers may generate standard operational logs for security and reliability."
  },
  {
    heading: "Sharing",
    body:
      "The app does not sell personal data. The app sends a revision request back to ChatGPT only after the user explicitly confirms. By default, that request contains confirmed annotations and necessary local context, not the full original document."
  },
  {
    heading: "User control",
    body:
      "Users decide which comments become confirmed revision instructions. Open, rejected, and resolved comments are excluded from the default revision request."
  },
  {
    heading: "Contact",
    body:
      "Before public release, replace this draft contact section with the owner's public support or privacy contact address."
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
      <div class="notice">
        Draft for publication readiness. Owner/legal review is required before using this as a public submission policy.
      </div>
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
