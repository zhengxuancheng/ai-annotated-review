# Apps SDK Publication Refresh

Date: 2026-05-18

Sources checked:

- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines
- https://developers.openai.com/apps-sdk/deploy/testing
- https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- https://developers.openai.com/apps-sdk/build/mcp-server

## Current Publication Facts

- Public distribution uses the dashboard-based submission flow after the app has been built and tested in Developer Mode.
- Developer-mode testing requires an HTTPS-reachable MCP endpoint.
- Public submission requires a concrete working MCP URL, not a local or placeholder endpoint.
- Widget resources need `_meta.ui.csp`; this is required before broad distribution.
- Widget resources need `_meta.ui.domain` for app submission.
- Submission materials include app metadata, privacy policy URL, screenshots, test prompts, and review-facing tool information.
- Tool hints must match behavior. Missing or incorrect `readOnlyHint`, `destructiveHint`, or `openWorldHint` can cause rejection.
- Tools should request only minimum task-specific inputs and should not request full conversation history just in case.
- Apps should be complete, reliable, responsive, and not submitted as trial/demo apps.
- Projects with EU data residency cannot currently submit apps for review; a global data residency project is required.
- Review can test web and mobile. This repo remains desktop-first, but mobile smoke is a pre-submission gate.

## Impact On This Repo

- Keep the first release as a ChatGPT Apps SDK app, not a standalone paste/export MVP.
- Keep the MCP tool read-only and closed-world.
- Keep full document text in widget-only `_meta` and compact summaries in `structuredContent`.
- Require explicit user confirmation before sending a revision request back to ChatGPT.
- Use exact CSP domains and a unique production widget domain.
- Treat privacy policy URL, live HTTPS deployment, screenshots, mobile smoke, identity verification, and data residency as release gates.

## Not Yet Done

- Public HTTPS MCP deployment exists at `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp` and has passed remote smoke.
- A privacy policy URL exists at `https://ai-annotated-review.liujinxingde2008.workers.dev/privacy`.
- No OpenAI dashboard submission has been made.
- Production ChatGPT Developer Mode validation has passed and is recorded in `docs/submission/live-validation-report.md`.
- No mobile smoke has been run.
