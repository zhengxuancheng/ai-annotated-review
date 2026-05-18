# Privacy Policy Draft

Status: draft for publication readiness. Owner/legal review is required before this text is used as the public privacy policy URL in an OpenAI app submission.

Last updated: 2026-05-18

## Overview

AI Annotated Review helps users review long AI-generated documents with block-level annotations inside a ChatGPT app widget. The app does not create user accounts, provide billing, sync data across devices, or call an external LLM API from this server.

## Information Processed

The MCP tool processes the Markdown or plain text document that the user explicitly asks ChatGPT to open for review, plus optional title and source label fields.

Inside the widget, the app processes annotations, statuses, priorities, selected blocks, and generated revision instructions created by the user.

The app does not ask for credentials, payment information, government identifiers, precise location, full conversation history, or raw chat transcripts.

## How Information Is Used

Document text is parsed into review blocks so the widget can render an annotation surface. Confirmed annotations are used to build a revision request only after the user confirms that action.

## Storage

The current app does not store review sessions in an application database. Widget state may be kept by the ChatGPT Apps runtime for the active widget experience. Hosting providers may generate standard operational logs for security and reliability.

## Sharing

The app does not sell personal data. The app sends a revision request back to ChatGPT only after the user explicitly confirms. By default, that request contains confirmed annotations and necessary local context, not the full original document.

## User Control

Users decide which comments become confirmed revision instructions. Open, rejected, and resolved comments are excluded from the default revision request.

## Contact

Before public release, replace this section with the owner's public support or privacy contact address.
