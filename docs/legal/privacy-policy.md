# Privacy Policy

Status: public policy text for the current ChatGPT Apps SDK production candidate.

Last updated: 2026-05-18

## Overview

AI Annotated Review helps users review long AI-generated documents with block-level annotations inside a ChatGPT app widget. The app does not create user accounts, provide billing, sync data across devices, or call an external LLM API from this server.

## Information Processed

The MCP tool processes the Markdown or plain text document that the user explicitly asks ChatGPT to open for review, plus optional title and source label fields.

Inside the widget, the app processes annotations, statuses, priorities, selected blocks, and generated revision instructions created by the user.

## Information Not Requested

The app does not ask for credentials, payment information, government identifiers, precise location, full conversation history, or raw chat transcripts.

## How Information Is Used

Document text is parsed into review blocks so the widget can render an annotation surface. Confirmed annotations are used to build a revision request only after the user confirms that action.

## Storage

The current app does not store review sessions in an application database. Widget state may be kept by the ChatGPT Apps runtime for the active widget experience. Hosting providers may generate standard operational logs for security and reliability.

## Retention

The app does not maintain its own persistent review-session database. Review state is intended for the active ChatGPT widget experience. Hosting-provider operational logs, if generated, are retained according to the hosting provider's standard infrastructure policies.

## Recipients

The app sends a revision request back to ChatGPT only after the user explicitly confirms. The app is hosted on Cloudflare Workers, so Cloudflare may process standard operational request data needed to serve, secure, and debug the service.

## Sharing

The app does not sell personal data. The app sends a revision request back to ChatGPT only after the user explicitly confirms. By default, that request contains confirmed annotations and necessary local context, not the full original document.

## User Control

Users decide which comments become confirmed revision instructions. Open, rejected, and resolved comments are excluded from the default revision request.

## Contact

For privacy or support questions, open an issue at https://github.com/zhengxuancheng/ai-annotated-review/issues. Do not include private documents, secrets, raw chat histories, credentials, or personal data in public issues.
