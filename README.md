# AI Annotated Review / AI 批注式审阅

AI Annotated Review is an open-source companion workflow for reviewing long AI-generated documents with block-level comments.

AI 批注式审阅是一个开源工具，用来审阅 ChatGPT、Claude、Codex、Claude Code 等 AI 工具生成的长文档。它把长文本拆成可审阅的段落/区块，让用户在对应位置直接写批注，再生成只包含已确认批注的 revision request。

Public source repository / 公开源码仓库:

```text
https://github.com/zhengxuancheng/ai-annotated-review
```

Latest release / 最新发布包:

```text
https://github.com/zhengxuancheng/ai-annotated-review/releases/latest
```

## What It Does / 它解决什么问题

When AI produces a long report, plan, translation review, code review, or proposal, normal chat feedback becomes vague because all comments must be typed at the bottom of the conversation.

当 AI 输出一篇很长的报告、方案、审稿、代码评审或翻译审阅时，普通聊天框很难精准反馈。用户读到某一段发现问题，却只能在底部输入框里统一反馈，最后很容易漏掉细节。

This project provides a document-like review surface:

这个项目提供一个类似文档批注的审阅界面：

- Split long Markdown or plain text into review blocks.
- Add comments directly under the relevant block.
- Generate local title, priority, and confirmed status for each comment by default.
- Let the reviewer adjust status or priority when needed.
- Build a confirmed-only revision request.
- Copy or export the revision request only after explicit user action.

- 把长 Markdown 或纯文本拆成审阅区块。
- 在对应段落下面直接添加批注。
- 默认本地生成批注标题、优先级和 confirmed 状态，用户只需要写 comment。
- 必要时允许用户调整状态或优先级。
- 生成只包含 confirmed 批注的修订请求。
- 只有用户明确点击后，才复制或导出修订请求。

## Current Release Path / 当前发布路线

The practical v1 release is the Chrome side panel extension. It works beside ChatGPT web and Claude web without modifying their native message UI.

当前 v1 的主发布形态是 Chrome 侧栏扩展。它可以在 ChatGPT 网页版和 Claude 网页版旁边打开审阅侧栏，但不会修改 ChatGPT 或 Claude 的原生消息气泡。

Current surfaces:

当前形态：

- Chrome side panel extension for ChatGPT web and Claude web.
- Public web app at `/app` on the deployed server as a demo and fallback review surface.
- CLI adapter for Codex CLI, Claude Code, and other terminal workflows.
- ChatGPT Apps SDK adapter retained as a technical preview for Developer Mode and possible future official submission.

- Chrome 侧栏扩展：面向 ChatGPT web 和 Claude web，是当前主体验。
- 公共 Web App：部署服务的 `/app` 路径，可作为演示和备用审阅界面。
- CLI 适配器：面向 Codex CLI、Claude Code 以及其他终端文件工作流。
- ChatGPT Apps SDK 适配器：保留为 Developer Mode 技术预览，未来在条件满足时可继续走官方提交路线。

## Boundaries / 边界

This project is intentionally conservative about platform claims.

本项目会严格控制平台能力声明：

- It does not modify native ChatGPT message bubbles.
- It does not modify native Claude message bubbles.
- No native ChatGPT message bubble modification.
- It does not scrape or silently import full chat history.
- It does not provide accounts, billing, telemetry, or cloud sync.
- It does not silently send comments, document context, or revision requests to any AI system.
- In public web and browser-extension modes, `Copy` copies immediately and shows a short copied notice.
- Actual host send-back actions, where supported, require explicit user confirmation.
- The project is licensed under Apache-2.0.

- 不修改 ChatGPT 原生消息气泡。
- 不修改 Claude 原生消息气泡。
- 不抓取、不静默导入完整聊天记录。
- 不提供账号、计费、遥测或云同步。
- 不静默把批注、文档上下文或修订请求发送给任何 AI 系统。
- 在公共 Web 和浏览器扩展模式中，`Copy` 会立即复制，并显示短暂的已复制提示。
- 只有在平台支持真正 send-back 的场景下，才会使用额外确认，并且必须由用户明确确认。
- 本项目使用 Apache-2.0 许可证。

## Browser Extension / 浏览器扩展

The Chrome extension is the main v1 user experience.

Chrome 扩展是当前 v1 的主要使用方式。

Download the latest release zip:

下载最新发布包：

```text
https://github.com/zhengxuancheng/ai-annotated-review/releases/latest
```

Build locally:

本地构建：

```bash
npm install
npm run build -w @ai-annotated-review/browser-extension
```

Create a Chrome Web Store / GitHub Release zip:

生成 Chrome Web Store 或 GitHub Release 可用的 zip：

```bash
npm run package:extension
```

Load the unpacked extension in Chrome:

在 Chrome 中加载未打包扩展：

```text
apps/browser-extension/dist
```

Extension permissions:

扩展权限：

- `activeTab`
- `scripting`
- `sidePanel`
- Host permissions for `chatgpt.com`, `chat.openai.com`, `claude.ai`, and `api.openai.com`

The extension imports only the text selected by the user in the active tab. It does not scrape the whole page.

扩展只导入用户在当前标签页中主动选中的文本，不抓取整个页面。

Voice input:

语音输入：

- Browser `Dictate` uses Chrome/Web Speech when available. Its accuracy and microphone routing depend on Chrome and the operating system.
- Optional `AI dictation` uses the user's own OpenAI API key and sends recorded audio directly to OpenAI only after the user clicks `Stop & transcribe`.
- Speech-recognition cleanup adds lightweight context correction for terms such as `Phase 0A` and basic Chinese punctuation, but it is not a guarantee of perfect transcription.

- 浏览器 `Dictate` 使用 Chrome/Web Speech 能力；准确率和麦克风来源取决于 Chrome 和操作系统。
- 可选的 `AI dictation` 使用用户自己的 OpenAI API key，并且只有用户点击 `Stop & transcribe` 后，才会把录音直接发送给 OpenAI 转写。
- 语音识别后处理会根据上下文轻量修正 `Phase 0A` 等术语，并补充基础中文标点，但不承诺转写一定完美。

## Web App / 公共 Web 版

Local preview:

本地预览：

```bash
npm run preview:web
```

Open:

打开：

```text
http://127.0.0.1:5173/
```

Production Worker routes:

生产 Worker 路由：

```text
/app      public review web app
/mcp      MCP endpoint for Apps SDK technical preview
/health   deployment health JSON
/privacy  privacy policy
```

## CLI / 命令行适配器

Build the CLI:

构建 CLI：

```bash
npm run build -w @ai-annotated-review/cli
```

Example terminal workflow:

终端示例：

```bash
node apps/cli/dist/index.js create examples/fixtures/product-plan.md --out review.json --title "Review"
node apps/cli/dist/index.js blocks review.json
node apps/cli/dist/index.js annotate review.json --block BLOCK_ID_FROM_BLOCKS --title "Clarify" --body "Make this section more concrete." --status confirmed --out review.json
node apps/cli/dist/index.js pack review.json --out revision-pack.md
```

The CLI does not send prompts to any AI service. It creates files that can be pasted or attached back into Codex CLI, Claude Code, ChatGPT, or Claude.

CLI 不会把 prompt 发送给任何 AI 服务。它只生成文件，用户可以手动把文件粘贴或附加回 Codex CLI、Claude Code、ChatGPT 或 Claude。

## ChatGPT Apps SDK Technical Preview / ChatGPT Apps SDK 技术预览

Local MCP endpoint:

本地 MCP endpoint：

```text
http://localhost:8787/mcp
```

Run:

运行：

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

The official ChatGPT App Directory path is paused because publisher verification is an owner-side gate. The code remains useful for Developer Mode validation and future verified submission, but this repository does not claim public ChatGPT App Directory availability.

由于发布者身份验证是 owner-side gate，官方 ChatGPT App Directory 路线目前暂停。相关代码仍可用于 Developer Mode 技术验证和未来正式提交，但本仓库不会声称已经在 ChatGPT App Directory 公开发布。

## Local Verification / 本地验证

Use Node >=22.

需要 Node >=22。

```bash
npm install
npm test
npm run typecheck
npm run build
npm run verify:adapters
npm run verify
```

In Codex Desktop, the bundled Node runtime is known to work:

在 Codex Desktop 中，可使用内置 Node runtime：

```bash
PATH="/Users/liujinxing/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm_config_prefix="/Users/liujinxing/.npm-codex-node24" npm run verify
```

## Key Docs / 关键文档

- [Usage tutorial / 使用教程](docs/tutorial.md)
- [Chrome Web Store submission packet / Chrome Web Store 提交包](docs/release/chrome-web-store-submission.md)
- [Architecture / 架构](docs/architecture.md)
- [Privacy model / 隐私模型](docs/privacy-model.md)
- [Non-directory release plan / 非 ChatGPT App Directory 发布路线](docs/strategy/non-directory-release-plan.md)
- [Verification report / 验证报告](docs/development/verification-report.md)
- [Resource decisions / 资源选型记录](docs/research/resource-decision-record.md)
- [Patentability notes / 专利可行性注意事项](docs/ip/patentability-notes.md)
- [Contributing / 贡献指南](CONTRIBUTING.md)
- [Security policy / 安全政策](SECURITY.md)
- [Support / 支持](SUPPORT.md)

## Publication Status / 发布状态

The source repository is public.

源码仓库已公开。

Chrome extension:

Chrome 扩展：

- GitHub Release `v0.1.2` is available with the packaged extension zip.
- Chrome Web Store submission for `v0.1.2` was submitted on 2026-05-18 and is currently `Pending review`.
- Do not describe the Chrome Web Store listing as live or approved until Google review passes.

- GitHub Release `v0.1.2` 已提供扩展 zip 包。
- Chrome Web Store 的 `v0.1.2` 已于 2026-05-18 提交审核，当前状态为 `Pending review`。
- 在 Google 审核通过前，不应声称 Chrome Web Store 页面已经正式上线或获批。

ChatGPT Apps SDK:

ChatGPT Apps SDK：

- The Apps SDK adapter has not been submitted to or approved by OpenAI for App Directory distribution.
- It remains a technical preview and developer-mode validation path.

- Apps SDK 适配器尚未提交给 OpenAI App Directory，也没有获得 OpenAI 审核批准。
- 它目前仍是技术预览和 Developer Mode 验证路线。
