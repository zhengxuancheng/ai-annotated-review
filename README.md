# AI Annotated Review

Open-source companion workflow for anchored review of long AI-generated documents.

The product renders long Markdown/text as review blocks, lets the reviewer attach comments to exact blocks, marks the comments that should drive revision, and generates a confirmed-only revision request.

Public source repository: https://github.com/zhengxuancheng/ai-annotated-review

Current release path:

- Chrome side panel extension for ChatGPT web and Claude web as the primary product surface.
- Public web app at `/app` on the deployed server as a demo and fallback review surface.
- CLI adapter for Codex CLI, Claude Code, and other terminal workflows.
- ChatGPT Apps SDK adapter retained as a technical preview for Developer Mode and possible future official submission.

Current boundary:

- No native ChatGPT message bubble modification.
- No native Claude message bubble modification.
- No scraping or hidden full-chat import.
- No accounts, billing, telemetry, external LLM API calls, or cloud sync.
- Revision requests are sent, copied, or exported only after explicit user action.
- In public web and browser-extension modes, `Copy` copies immediately and shows a short auto-dismissing copied notice; the extra confirmation modal is reserved for actual send-back-to-ChatGPT host actions.
- Licensed under Apache-2.0.

## Local Commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run verify:adapters
npm run verify
```

Use Node >=22. In Codex Desktop, the bundled Node runtime is known to work:

```bash
PATH="/Users/liujinxing/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm_config_prefix="/Users/liujinxing/.npm-codex-node24" npm run verify
```

## Web App

Local widget/web preview:

```bash
npm run preview:web
```

Open:

```text
http://127.0.0.1:5173/
```

Production Worker routes:

```text
/app      public review web app
/mcp      MCP endpoint for Apps SDK technical preview
/health   deployment health JSON
/privacy  privacy policy
```

## Browser Extension

The browser extension is the main v1 user experience. It keeps the review surface next to ChatGPT or Claude without modifying either product's native message UI.

Download the latest release zip:

```text
https://github.com/zhengxuancheng/ai-annotated-review/releases/latest
```

Or build the Chrome side panel extension locally:

```bash
npm run build -w @ai-annotated-review/browser-extension
```

Create a zip suitable for GitHub Release or Chrome Web Store upload:

```bash
npm run package:extension
```

Load this folder in Chrome's extension page:

```text
apps/browser-extension/dist
```

The extension requests only:

- `activeTab`
- `scripting`
- `sidePanel`
- host permissions for `chatgpt.com`, `chat.openai.com`, `claude.ai`, and `api.openai.com`

It imports only the text the user has selected in the active tab. It does not scrape the whole page.

Per-block comments are added inline: click a block's comment button, type the comment, and add it. Title, priority, and confirmed status are generated locally so the main review flow does not ask the reviewer to fill metadata fields. Where Chrome exposes Web Speech recognition, the inline composer also offers a `Dictate` button for browser-provided voice input. Optional `AI dictation` uses the user's own OpenAI API key and sends recorded audio directly to OpenAI only after the user clicks `Stop & transcribe`.

## CLI

Build the CLI:

```bash
npm run build -w @ai-annotated-review/cli
```

Example terminal workflow:

```bash
node apps/cli/dist/index.js create examples/fixtures/product-plan.md --out review.json --title "Review"
node apps/cli/dist/index.js blocks review.json
node apps/cli/dist/index.js annotate review.json --block BLOCK_ID_FROM_BLOCKS --title "Clarify" --body "Make this section more concrete." --status confirmed --out review.json
node apps/cli/dist/index.js pack review.json --out revision-pack.md
```

The CLI does not send prompts to any AI service. It creates files that can be pasted or attached back into Codex CLI, Claude Code, ChatGPT, or Claude.

## ChatGPT Apps SDK Technical Preview

Local MCP endpoint:

```text
http://localhost:8787/mcp
```

Run:

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

The official ChatGPT App Directory path is paused because publisher verification is an owner-side gate. The code remains useful for Developer Mode validation and future verified submission, but this repository does not claim public ChatGPT App Directory availability.

## Key Docs

- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Usage tutorial](docs/tutorial.md)
- [Chrome Web Store submission packet](docs/release/chrome-web-store-submission.md)
- [Architecture](docs/architecture.md)
- [Privacy model](docs/privacy-model.md)
- [Non-directory release plan](docs/strategy/non-directory-release-plan.md)
- [Alternative platform resource check](docs/research/alternative-platform-resource-check-2026-05-18.md)
- [Verification report](docs/development/verification-report.md)
- [Resource decisions](docs/research/resource-decision-record.md)
- [Patentability notes](docs/ip/patentability-notes.md)

## Publication Status

The source repository is public. The current practical release target is the Chrome side panel extension, supported by the public web demo/fallback and CLI adapter.

The ChatGPT Apps SDK adapter has not been submitted to or approved by OpenAI for App Directory distribution.

The Chrome Web Store listing has not been submitted or approved yet.
