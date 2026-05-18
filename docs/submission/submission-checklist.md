# ChatGPT App Submission Checklist

Status: publication-track checklist, not a completed submission record.

Official references checked on 2026-05-18:

- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines
- https://developers.openai.com/apps-sdk/deploy/testing
- https://developers.openai.com/apps-sdk/build/mcp-server

## Source-Complete Gates

- [x] Tool has explicit `readOnlyHint`, `destructiveHint`, and `openWorldHint`.
- [x] Tool returns structured output plus widget-only `_meta.reviewSession`.
- [x] Widget requires explicit confirmation before sending a revision request.
- [x] Default revision pack includes confirmed annotations only.
- [x] Server exposes `/health` for deployment checks.
- [x] Server exposes `/privacy` draft route for publication wiring.
- [x] Widget `_meta.ui.csp` is present and configurable by exact domain lists.
- [x] Widget `_meta.ui.domain` is configurable by `APP_WIDGET_DOMAIN`.
- [x] Submission JSON draft exists at `chatgpt-app-submission.json`.
- [x] OpenAI dashboard packet exists at `docs/submission/openai-dashboard-packet.md`.
- [x] Public test-case draft exists at `docs/submission/test-cases.md`.
- [x] Draft local screenshot exists at `docs/submission/screenshots/review-widget-desktop.png`.
- [x] Remote MCP smoke script exists as `npm run smoke:remote`.
- [x] Cloudflare Worker adapter exists and passes local Worker smoke.
- [x] Apache-2.0 `LICENSE` file exists.

## External Release Gates

- [x] Choose final public app name: `AI Annotated Review`.
- [ ] Choose public support contact.
- [x] Decide license and patent/open-source strategy before public repository release. Decision: Apache-2.0 open source.
- [ ] Publish a reviewed privacy policy URL.
- [x] Deploy MCP server to a public HTTPS origin outside local networks.
- [x] Deploy Cloudflare Worker to stable `workers.dev` or custom-domain origin: `https://ai-annotated-review.liujinxingde2008.workers.dev`.
- [x] Set production `APP_WIDGET_DOMAIN` to a unique app origin.
- [x] Set production CSP values to exact required origins only.
- [x] Run `npm run smoke:remote` against a temporary public `/mcp` endpoint and save `docs/submission/remote-smoke-report.json`.
- [x] Connect the temporary `/mcp` endpoint in ChatGPT Developer Mode.
- [x] Run the desktop golden workflow in ChatGPT web Developer Mode.
- [x] Run one negative prompt in ChatGPT web Developer Mode and verify the app does not trigger.
- [x] Replace the temporary tunnel with a stable production HTTPS endpoint before final submission.
- [ ] Confirm OpenAI Platform identity verification.
- [ ] Use a global data residency project for submission.
- [x] Connect the production `/mcp` endpoint in ChatGPT Developer Mode.
- [x] Run golden prompts on ChatGPT web.
- [ ] Run mobile smoke in ChatGPT iOS or Android even though v1 is desktop-first.
- [x] Capture accurate production desktop screenshot evidence.
- [ ] Submit through the OpenAI dashboard only after all gates above pass.

## Blockers To Keep Visible

- Apache-2.0 `LICENSE` is present by owner decision.
- The privacy policy text is a draft, not legal advice.
- Live ChatGPT Developer Mode testing has passed on the stable Cloudflare Worker production candidate, but this is not OpenAI approval.
- The current remote MCP smoke report uses the stable Cloudflare Worker production candidate.
- The current repo has not completed mobile ChatGPT smoke testing.
- The current production screenshot is desktop ChatGPT web evidence, not OpenAI approval or a mobile-support claim.
