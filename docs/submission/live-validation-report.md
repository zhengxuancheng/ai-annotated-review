# Live ChatGPT Developer-Mode Validation Report

Status: passed

Scope: ChatGPT web Developer Mode validation through the stable Cloudflare Worker production candidate. This is not OpenAI approval, public app submission, or public directory listing evidence.

## Environment

- Date: 2026-05-18 12:28 CST
- Commit: no git commit yet; initial repository is still uncommitted
- Public MCP endpoint: `https://ai-annotated-review.liujinxingde2008.workers.dev/mcp`
- Public base URL: `https://ai-annotated-review.liujinxingde2008.workers.dev`
- Remote smoke report: `docs/submission/remote-smoke-report.json`, `ok: true`, checked at `2026-05-18T04:48:30.293Z`
- ChatGPT client: ChatGPT web, Developer Mode, desktop, Chrome, Instant model
- Desktop browser: Google Chrome on macOS
- ChatGPT development connector name: `AI Annotated Review Production`
- Widget iframe origin observed in ChatGPT: `ai-annotated-review-liujinxingde2008-workers-dev.web-sandbox.oaiusercontent.com`
- Mobile client: not in v1 scope

## Web Developer-Mode Results

- Connector creation: passed; `AI Annotated Review Production` was connected to the stable `/mcp` endpoint with no auth.
- Tool invocation: passed; ChatGPT invoked `review_markdown_document`, returned `Review ready.`, and rendered the widget.
- Positive prompt 1: passed; the prompt asked to open a Markdown production demo document for review only and not revise yet.
- Positive prompt 2: covered by the same manual positive flow using explicit title/content import behavior.
- Positive prompt 3: covered by the manual flow because ChatGPT opened review mode and did not revise until the widget sent a confirmed revision request.
- Negative prompt 1: passed; when asked to rewrite directly and not open `AI Annotated Review Production` or any annotation UI, ChatGPT answered directly and did not create a new tool call or widget.
- Negative prompt 2: outside this focused production pass; additional negative cases remain useful before final dashboard submission.
- Widget render: passed; the iframe rendered the document as 7 blocks with `3 annotations · 2 confirmed`.
- Confirmation modal: passed; `Send revision request` opened `Confirm send` before transmission and stated that confirmed annotations only would be sent.
- Follow-up send: passed after explicit user confirmation; widget displayed `Revision request sent.`
- Revised document: passed; ChatGPT revised `Problem` and `Workflow` according to the two confirmed P1 annotations, and preserved `Boundary`, which corresponded to the rejected annotation.

## Golden Workflow Evidence

- Imported document title: `Production Demo Review`.
- Confirmed annotation 1: `Make pain concrete`, block `b0003_1k755pc`, status `confirmed`, priority `P1`.
- Confirmed annotation 2: `Keep confirmed-only revision`, block `b0005_1c8qwoj`, status `confirmed`, priority `P1`.
- Rejected annotation: `Reject native UI claim`, block `b0007_1uc6n3r`, status `rejected`, priority `P2`.
- Revision pack summary shown in widget: `2 confirmed instruction(s). Priority mix: P0=0, P1=2, P2=0, P3=0. Prompt length: 1335 characters.`
- Confirmed-only behavior: passed; the revision pack listed the two confirmed annotations and did not list the rejected annotation.
- Explicit-send behavior: passed; no follow-up was sent until the user confirmed the modal.
- ChatGPT revision result: passed; `Problem` was rewritten to name the bottom-feedback/context-loss failure mode, `Workflow` was rewritten to say only confirmed comments are sent back, and `Boundary` remained unchanged.
- Negative prompt result: passed; ChatGPT produced a direct rewrite of `Direct Rewrite Test` without opening a new annotation widget.

## Console Or Runtime Issues

- Web: no visible ChatGPT runtime error during the successful pass.
- Screenshot capture: after Codex restart, `docs/submission/screenshots/production-review-widget-desktop.png` was captured and visually checked. It shows ChatGPT web with connector `AI Annotated Review Production`, the embedded review widget, three annotations, two confirmed annotations, and the revision pack panel.
- Mobile: not tested for v1.

## Verdict

Verdict: Developer-mode golden-loop validation passed on the stable Cloudflare Worker production candidate. The product is now proven to work in ChatGPT web Developer Mode for the core flow: MCP tool call, iframe widget render, block selection, anchored annotations, confirmed-only revision pack, explicit confirmation, follow-up send, and ChatGPT revision.

Remaining release blockers: final privacy policy review, official OpenAI submission, mobile smoke if OpenAI requires it for review, and any extra review cases required by the final submission checklist.
