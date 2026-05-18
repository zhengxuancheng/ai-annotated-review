# OpenAI Dashboard Submission Packet

Status: prepared for owner review. This is not an OpenAI submission record and does not claim approval.

Official Apps SDK references rechecked on 2026-05-18:

- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines
- https://developers.openai.com/apps-sdk/deploy/testing
- https://developers.openai.com/apps-sdk/build/mcp-server

## App Info

- Display name: `AI Annotated Review`
- Subtitle: `Annotate AI drafts`
- Category: `PRODUCTIVITY`
- Description:

```text
AI Annotated Review helps users open long AI-generated Markdown or plain text outputs inside a ChatGPT app widget, attach comments to specific document blocks, confirm the comments that should guide revision, and send a user-approved revision request back to ChatGPT.
```

## MCP Server

- Type: universal MCP server URL
- Production MCP URL: `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp`
- Public base URL: `https://ai-annotated-review.liujinxingde2008.workers.dev`
- Privacy policy URL candidate: `https://ai-annotated-review.liujinxingde2008.workers.dev/privacy`
- Authentication: no app account authentication in v1
- Widget domain: `https://ai-annotated-review.liujinxingde2008.workers.dev`
- Widget resource: `ui://ai-annotated-review/review-widget-v2.html`

Privacy note: the URL above currently serves the repo draft privacy policy. Treat it as owner/legal review required before final public submission.

## Submission Files

- Submission import JSON: `chatgpt-app-submission.json`
- Reviewer notes: `docs/submission/reviewer-notes.md`
- Test cases: `docs/submission/test-cases.md`
- Live validation report: `docs/submission/live-validation-report.md`
- Remote smoke report: `docs/submission/remote-smoke-report.json`
- App icon source: `docs/submission/app-icon.svg`
- Desktop production screenshot: `docs/submission/screenshots/production-review-widget-desktop.png`

## Tool Metadata

Tool: `review_markdown_document`

- `readOnlyHint`: `true`
- `openWorldHint`: `false`
- `destructiveHint`: `false`
- `outputSchema`: present in source and verified by smoke checks

Reviewer-facing justification:

- The tool parses an explicitly supplied document and returns a review widget session.
- It does not publish, post, message, or write to public internet state or third-party systems.
- It does not delete, overwrite, revoke access, charge users, or perform irreversible actions.
- The user-confirmed follow-up send happens inside the widget after an explicit confirmation modal.

## Verified Evidence

- `npm run verify`: passed on 2026-05-18 using Node v24.14.0, which satisfies the repo's Node >=22 requirement.
- `npm run verify:submission:strict`: passed with production environment variables; warnings and blockers were empty.
- `npm run smoke:remote`: passed against the production Cloudflare Worker endpoint at `2026-05-18T04:48:30.293Z`.
- `npm audit --audit-level=moderate`: passed with 0 vulnerabilities.
- ChatGPT web Developer Mode golden loop: passed with connector `AI Annotated Review Production`.
- Desktop production screenshot: captured and visually checked after Codex restart.

## Dashboard Steps

1. Confirm OpenAI Platform identity verification under the publishing name.
2. Use or create a global data residency project.
3. Confirm the owner-reviewed privacy policy URL and public support contact.
4. Create or update the ChatGPT app draft in the OpenAI dashboard.
5. Enter the app info above or import `chatgpt-app-submission.json` where supported.
6. Enter the production MCP URL: `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp`.
7. Upload or attach the app icon and production desktop screenshot.
8. Add the positive and negative test cases from `docs/submission/test-cases.md`.
9. Add reviewer notes from `docs/submission/reviewer-notes.md`.
10. Run the dashboard test flow before submission.
11. Submit only after explicit final approval from the owner.

## Claims To Avoid

- Do not claim OpenAI has approved or listed the app before approval.
- Do not claim the app modifies native ChatGPT message bubbles.
- Do not claim Claude, Codex, Cursor, VS Code, browser extension, or mobile support in v1.
- Do not claim cloud sync, collaboration, accounts, billing, telemetry, or external LLM integration.
- Do not publish patentability or novelty claims in the public README or launch copy.

## Remaining Human/Account Gates

- Owner-reviewed privacy policy text and support contact.
- OpenAI identity verification and project data residency.
- Mobile smoke only if required during final review; v1 remains desktop-first.
- Final dashboard submission approval.
