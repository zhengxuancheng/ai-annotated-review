# Public GitHub Checklist / 公开 GitHub 检查清单

Status: public source repository created. This is separate from OpenAI app approval and Chrome Web Store approval.

状态：源码仓库已公开。这与 OpenAI App Directory 审核、Chrome Web Store 审核是彼此独立的状态。

## Repository

- Target owner: `zhengxuancheng`
- Target repository name: `ai-annotated-review`
- Target visibility: public
- License: Apache-2.0
- Default branch: `main`
- Repository URL: `https://github.com/zhengxuancheng/ai-annotated-review`
- Created and pushed: 2026-05-18
- GitHub Release: `v0.1.2`
- Chrome Web Store status: submitted on 2026-05-18, currently `Pending review`

## Required Files

- [x] `README.md`
- [x] `LICENSE`
- [x] `CONTRIBUTING.md`
- [x] `SECURITY.md`
- [x] `SUPPORT.md`
- [x] `CODE_OF_CONDUCT.md`
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [x] `.github/ISSUE_TEMPLATE/bug_report.yml`
- [x] `.github/ISSUE_TEMPLATE/feature_request.yml`
- [x] `.github/ISSUE_TEMPLATE/adapter_proposal.yml`

## Pre-Push Checks

Current pre-push status on 2026-05-18:

- [x] `npm run verify:reality`
- [x] `npm run verify:license`
- [x] `npm run verify:submission:strict` with production environment variables
- [x] `npm run verify` with Node v24.14.0

Command reference:

```bash
npm run verify:reality
npm run verify:license
APP_PUBLIC_BASE_URL=https://ai-annotated-review.liujinxingde2008.workers.dev \
APP_WIDGET_DOMAIN=https://ai-annotated-review.liujinxingde2008.workers.dev \
APP_PRIVACY_POLICY_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/privacy \
REMOTE_MCP_URL=https://ai-annotated-review.liujinxingde2008.workers.dev/mcp \
npm run verify:submission:strict
```

Run the full gate with Node 22+:

```bash
npm run verify
```

## Public Claims To Preserve

- The app is an open-source companion workflow for reviewing long AI outputs.
- Current practical targets are public web app, Chrome side panel extension, and CLI adapter.
- The ChatGPT Apps SDK adapter is a technical preview.
- The app renders its own review surface.
- The app does not modify native ChatGPT or Claude message bubbles.
- The browser extension imports selected text only.
- The app is not OpenAI-approved until dashboard approval happens.
- The Chrome Web Store extension is not approved or live until Google review passes.
- Claude Desktop MCPB, VS Code/Cursor, and deeper Codex/Claude skills are roadmap items, not current v1 support.

## 需要保留的公开中文边界

- 这是一个用于审阅长篇 AI 输出的开源 companion workflow。
- 当前实际发布目标是公共 Web App、Chrome 侧栏扩展和 CLI 适配器。
- ChatGPT Apps SDK 适配器只是技术预览。
- 应用渲染自己的审阅界面。
- 应用不修改 ChatGPT 或 Claude 的原生消息气泡。
- 浏览器扩展只导入用户主动选中的文本。
- 未获 OpenAI 审核批准前，不得声称已经是公开 ChatGPT App Directory 应用。
- 未获 Google 审核通过前，不得声称 Chrome Web Store 扩展已经正式上线。
- Claude Desktop MCPB、VS Code/Cursor、更深入的 Codex/Claude skill 都是路线图，不是当前 v1 支持。

## Completed GitHub Actions

- [x] Created public GitHub repository `zhengxuancheng/ai-annotated-review`.
- [x] Pushed local `main` branch.
- [x] Set repository description.
- [x] Updated repository description to a bilingual Chrome-extension-first summary after the v0.1.2 submission pivot.
- [x] Set repository topics: `chatgpt-apps-sdk`, `mcp`, `markdown`, `annotation`, `ai-tools`, `open-source`.
- [x] Created GitHub Release `v0.1.2` with extension zip and checksum.

## Do Not Publish

- Secrets, tokens, API keys, Cloudflare local state, or `.wrangler` cache.
- `node_modules`, generated `dist`, generated `dist-types`, or `*.tsbuildinfo`.
- Private documents or user data.
- Patentability or novelty claims beyond the cautious notes in `docs/ip/patentability-notes.md`.
