# Privacy Model

## Current Version

This publication-track build has no accounts, no backend database, no telemetry, no third-party API calls, and no cloud sync.

## Data Entering The App

The MCP tool accepts only the document the user or model explicitly passes as `markdown`, plus optional `title` and `sourceLabel`.

It does not request:

- full chat history,
- raw conversation transcript,
- user profile,
- location,
- credentials,
- files,
- API keys.

## Model-Visible Data

The tool response `structuredContent` contains:

- success/error flag,
- session ID,
- title,
- char count,
- block count,
- compact outline,
- limits,
- warnings/errors,
- next action.

It does not contain the full raw document.

## Widget-Only Data

The full parsed review session is returned in `_meta.reviewSession`. Apps SDK docs state `_meta` is delivered to the component and hidden from the model.

## Sending Back To ChatGPT

The widget sends a revision request only after the reviewer clicks the send button and confirms in the modal.

Default send behavior includes:

- confirmed annotations only,
- block ID,
- heading path,
- priority,
- short quote,
- requested change.

Default send behavior excludes:

- open comments,
- rejected comments,
- resolved comments,
- the full source document.

## Storage

The widget uses ChatGPT widget state when available to preserve local UI state for the current widget instance. The current implementation stores annotation state, selected block, and filter state there. It does not use `localStorage`.

## Public Submission Gap

Public ChatGPT app submission still requires mobile smoke if required by review and organization/individual verification. The current production candidate has a privacy policy URL at `https://ai-annotated-review.liujinxingde2008.workers.dev/privacy`, public support via GitHub issues, and production desktop screenshot evidence in `docs/submission/screenshots/production-review-widget-desktop.png`.

The repo includes the policy source at `docs/legal/privacy-policy.md` and serves the same policy through `/privacy`.
