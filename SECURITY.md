# Security Policy

## Supported Versions

This repository is currently pre-1.0. Security fixes apply to the default branch unless a release branch is explicitly created.

## Reporting A Vulnerability

Do not post secrets, private documents, raw chat logs, credentials, or exploit details in a public issue.

After the GitHub repository is public, prefer GitHub private vulnerability reporting if it is enabled for the repository. If that channel is not available yet, open a public issue with a non-sensitive summary and ask for a private reporting path.

## Current Security Boundaries

- The v1 app has no accounts, billing, telemetry, cloud sync, or external LLM API integration.
- The MCP tool parses user-provided Markdown or plain text and returns a widget session.
- Full review-session data is sent to the widget through `_meta`; compact summary data is returned through `structuredContent`.
- The default revision request includes confirmed annotations only and requires explicit user confirmation.
- The app must not request credentials, API keys, payment data, government IDs, or raw chat history.

## Dependency Policy

The project rejects GPL, LGPL, AGPL, source-available, or unclear-license dependencies unless the owner explicitly approves them. Run:

```bash
npm run verify:license
npm audit --audit-level=moderate
```

before reporting a dependency-related release as clean.
