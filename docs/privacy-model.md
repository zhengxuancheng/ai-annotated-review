# Privacy Model

## Current Version

This publication-track build has no accounts, no backend database, no telemetry, and no cloud sync. The optional `AI dictation` voice path can make a user-triggered direct browser request to OpenAI's transcription API using the user's own API key.

The current public release path is a web app, Chrome side panel extension, and CLI adapter. The ChatGPT Apps SDK adapter remains a technical preview and future official-submission path.

## Data Entering The App

The public web app accepts text the user explicitly pastes.

The browser extension accepts only text the user explicitly selects in the active ChatGPT or Claude web tab before clicking `Use selected text`.

If the user clicks `Dictate`, the inline comment composer uses the browser's built-in Web Speech recognition when available. The project does not run its own speech server or store audio. Browser-provided speech recognition may be handled by the browser vendor according to that vendor's browser policy.

If the user clicks `AI dictation`, enters an OpenAI API key, records audio, and clicks `Stop & transcribe`, the browser sends the recorded audio directly to OpenAI with the current review-block context. The project server does not receive the audio or the API key.

The CLI accepts a file path or stdin chosen by the user.

The MCP tool accepts only the document the user or model explicitly passes as `markdown`, plus optional `title` and `sourceLabel`.

It does not request:

- full chat history,
- raw conversation transcript,
- user profile,
- location,
- credentials,
- files,
- API keys, except for the optional OpenAI key entered by the user for `AI dictation`.

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

In public web app, browser extension, and CLI workflows, the default action is copy/export/file generation. The user manually pastes or attaches the revision request into ChatGPT, Claude, Codex, or Claude Code.

## Storage

The widget uses ChatGPT widget state when available to preserve local UI state for the current widget instance. The current implementation stores annotation state, selected block, and filter state there. It does not use `localStorage`.

The browser extension and public web app keep the active review session in browser memory until the user exports JSON or Markdown. The CLI writes only the files explicitly named by the user.

The optional OpenAI API key for `AI dictation` is stored in browser local storage when provided and can be cleared from `Voice settings`.

## Public Release Gap

Official ChatGPT App Directory submission is paused. It still requires publisher verification, final dashboard submission, and OpenAI approval before any public directory claim.

The current production candidate has a privacy policy URL at `https://ai-annotated-review.liujinxingde2008.workers.dev/privacy`, public support via GitHub issues, and production desktop screenshot evidence in `docs/submission/screenshots/production-review-widget-desktop.png`.

The repo includes the policy source at `docs/legal/privacy-policy.md` and serves the same policy through `/privacy`.
