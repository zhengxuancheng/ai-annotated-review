# Privacy Policy

Status: public policy text for the current web app, browser extension, CLI adapter, and Apps SDK technical preview.

Last updated: 2026-05-18

## Overview

AI Annotated Review helps users review long AI-generated documents with block-level annotations in a public web app, browser side panel, CLI workflow, or ChatGPT Apps SDK technical preview. The app does not create user accounts, provide billing, sync data across devices, or call an external LLM API from this server.

## Information Processed

The app processes Markdown or plain text that the user explicitly pastes, selects in ChatGPT or Claude web, provides through the CLI, or asks ChatGPT Developer Mode to open through the MCP tool.

Inside the review UI or CLI session, the app processes annotations, statuses, priorities, selected blocks, and generated revision instructions created by the user.

If the user clicks the browser voice-dictation button, the inline comment composer uses browser-provided Web Speech recognition when available. This project does not run its own speech server or store audio. Browser-provided speech recognition may be handled by the browser vendor according to that vendor's browser policy.

## Information Not Requested

The app does not ask for credentials, payment information, government identifiers, precise location, full conversation history, raw chat transcripts, API keys, or account passwords.

## How Information Is Used

Document text is parsed into review blocks so the app can render an annotation surface. Confirmed annotations are used to build a revision request only after the user confirms that action.

## Storage

The current app does not store review sessions in an application database. Public web and extension sessions live in browser memory until the user exports them. CLI sessions are written only to files selected by the user. Widget state may be kept by the ChatGPT Apps runtime for the active widget experience. Hosting providers may generate standard operational logs for security and reliability.

## Retention

The app does not maintain its own persistent review-session database. Review state is intended for the active browser, CLI, or Apps SDK widget experience. Hosting-provider operational logs, if generated, are retained according to the hosting provider's standard infrastructure policies.

## Recipients

The app sends, copies, or exports a revision request only after the user explicitly confirms or chooses that action. The hosted web and MCP preview are served from Cloudflare Workers, so Cloudflare may process standard operational request data needed to serve, secure, and debug the service.

## Sharing

The app does not sell personal data. The app sends, copies, or exports a revision request only after the user explicitly confirms or chooses that action. By default, that request contains confirmed annotations and necessary local context, not the full original document.

## User Control

Users decide which comments become confirmed revision instructions. Open, rejected, and resolved comments are excluded from the default revision request.

## Contact

For privacy or support questions, open an issue at https://github.com/zhengxuancheng/ai-annotated-review/issues. Do not include private documents, secrets, raw chat histories, credentials, or personal data in public issues.
