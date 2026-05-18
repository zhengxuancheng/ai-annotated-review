# Usage Tutorial / 使用教程

This tutorial covers the current practical release path: Chrome side panel extension first, with public web app and CLI as fallback workflows. The ChatGPT Apps SDK adapter is a technical preview.

本教程覆盖当前实际发布路线：优先使用 Chrome 侧栏扩展，公共 Web App 和 CLI 作为备用工作流。ChatGPT Apps SDK 适配器目前是技术预览。

## 1. Install And Verify / 安装与验证

From the repository root:

在仓库根目录运行：

```bash
npm install
npm test
npm run typecheck
npm run build
npm run verify:adapters
```

Expected result:

预期结果：

- Unit tests pass.
- TypeScript project references pass.
- Web app builds.
- Browser extension builds.
- CLI passes a create -> blocks -> annotate -> pack smoke test.

- 单元测试通过。
- TypeScript project references 通过。
- Web App 构建通过。
- 浏览器扩展构建通过。
- CLI 的 create -> blocks -> annotate -> pack smoke test 通过。

## 2. Chrome Side Panel Extension / Chrome 侧栏扩展

The Chrome side panel extension is the primary v1 workflow because it sits beside ChatGPT or Claude while importing only user-selected text.

Chrome 侧栏扩展是当前 v1 的主工作流，因为它可以放在 ChatGPT 或 Claude 页面旁边，同时只导入用户主动选中的文本。

Download the latest release zip:

下载最新发布包：

```text
https://github.com/zhengxuancheng/ai-annotated-review/releases/latest
```

Install from the release zip:

从 Release zip 安装：

1. Download `ai-annotated-review-companion-v*.zip`.
2. Unzip it locally.
3. Open `chrome://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped folder.

1. 下载 `ai-annotated-review-companion-v*.zip`。
2. 在本地解压。
3. 打开 `chrome://extensions`。
4. 开启 `Developer mode` / 开发者模式。
5. 点击 `Load unpacked` / 加载已解压的扩展程序。
6. 选择解压后的文件夹。

Build locally instead:

也可以本地构建：

```bash
npm run package:extension
```

The packaged zip is written to:

打包后的 zip 会输出到：

```text
release-artifacts/
```

Use it beside ChatGPT or Claude:

在 ChatGPT 或 Claude 旁边使用：

1. Open `https://chatgpt.com` or `https://claude.ai`.
2. Select the AI output text you want to review.
3. Click the extension icon to open the side panel.
4. Click `Use selected text`.
5. Review the imported text, then click `Create review session`.
6. Click the comment button on any review block.
7. Type the comment directly under that block, use `Dictate` when Chrome offers browser voice recognition, or use `AI dictation` after adding your own OpenAI API key in `Voice settings`.
8. Click `Add comment`.
9. Click `Build pack`.
10. Review the generated revision request.
11. Click `Copy`.
12. Paste the revision request back into ChatGPT or Claude yourself.

1. 打开 `https://chatgpt.com` 或 `https://claude.ai`。
2. 选中你想审阅的 AI 输出文本。
3. 点击扩展图标，打开侧栏。
4. 点击 `Use selected text`。
5. 检查导入的文本，然后点击 `Create review session`。
6. 点击任意审阅区块上的评论按钮。
7. 直接在该区块下面输入 comment；如果 Chrome 支持浏览器语音识别，可以用 `Dictate`；如果你在 `Voice settings` 中填入自己的 OpenAI API key，也可以用 `AI dictation`。
8. 点击 `Add comment`。
9. 点击 `Build pack`。
10. 检查生成的 revision request。
11. 点击 `Copy`。
12. 自己把 revision request 粘贴回 ChatGPT 或 Claude。

Important boundaries:

重要边界：

- The side panel imports only the text currently selected by the user in the active ChatGPT or Claude tab.
- It does not scrape the whole conversation.
- The main review flow asks only for the comment.
- The app generates a short title, priority, and confirmed status locally.
- The annotation list still allows later status or priority edits when needed.

- 侧栏只导入用户在当前 ChatGPT 或 Claude 标签页中主动选中的文本。
- 它不会抓取整段对话或整个页面。
- 主审阅流程只要求用户填写 comment。
- 应用会在本地生成简短标题、优先级和 confirmed 状态。
- 如有需要，用户仍可在批注列表中调整状态或优先级。

## 3. Voice Input / 语音输入

`Dictate` uses Chrome's browser speech recognition when available.

`Dictate` 使用 Chrome 提供的浏览器语音识别能力。

If `Dictate` needs microphone permission, the extension opens an `Enable microphone dictation` tab. Allow microphone access there, return to the side panel, and click `Dictate` again.

如果 `Dictate` 需要麦克风权限，扩展会打开一个 `Enable microphone dictation` 页面。在那里允许麦克风访问，然后回到侧栏再次点击 `Dictate`。

If macOS or Chrome routes Chrome's microphone input to an iPhone Continuity microphone, the extension cannot force it back to the Mac microphone from Web Speech code. Change the input source in macOS or Chrome settings, then click `Dictate` again.

如果 macOS 或 Chrome 把 Chrome 的麦克风输入路由到了 iPhone 连续互通麦克风，扩展无法通过 Web Speech 代码强制切回 Mac 麦克风。需要在 macOS 或 Chrome 设置中切换输入源，然后重新点击 `Dictate`。

`AI dictation` records audio until you click `Stop & transcribe`, then sends that audio directly to OpenAI's transcription endpoint with the current review-block context. This mode is optional, requires your own OpenAI API key, and stores the key only in this browser's local storage.

`AI dictation` 会持续录音直到你点击 `Stop & transcribe`，然后把录音和当前审阅区块上下文直接发送到 OpenAI 转写接口。这个模式是可选的，需要你自己的 OpenAI API key，并且 key 只保存在当前浏览器的本地存储中。

Use the `Microphone` selector in `Voice settings` when Chrome exposes more than one input device.

如果 Chrome 暴露了多个输入设备，可以在 `Voice settings` 里的 `Microphone` 选择器中切换。

Speech cleanup is intentionally conservative. It can correct obvious reviewed-block terms such as `face0a` -> `Phase 0A` when the selected block contains `Phase 0A`, and it can add lightweight Chinese punctuation. You should still read the comment before clicking `Add comment`.

语音后处理是保守增强。比如选中区块里有 `Phase 0A` 时，它可以把明显错误的 `face0a` 修成 `Phase 0A`，也会补充一些基础中文标点。但点击 `Add comment` 前，用户仍然应该自己检查 comment。

## 4. Public Web App Flow / 公共 Web App 流程

The public web app is a demo and fallback surface. It is not the main v1 distribution channel.

公共 Web App 是演示和备用界面，不是当前 v1 的主要分发渠道。

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

Production Worker route after deploy:

部署后的生产 Worker 路由：

```text
https://your-worker.example/app
```

Review workflow:

审阅流程：

1. Click `New document`.
2. Paste a long AI-generated Markdown/text report.
3. Click `Create review session`.
4. Click a block's comment button.
5. Type the comment directly below that block, use `Dictate` for basic browser speech, or use `AI dictation` after adding your own OpenAI API key in `Voice settings`.
6. Click `Add comment`.
7. Create at least three annotations.
8. Keep revision-driving comments confirmed, or change status later in the annotations panel.
9. Click `Build pack`; the app scrolls to the generated revision pack.
10. Review the generated prompt.
11. Click `Copy` to copy immediately; a short copied notice appears and then disappears. You can also click `Export pack`.
12. Paste the revision request into ChatGPT, Claude, Codex, or Claude Code yourself.

1. 点击 `New document`。
2. 粘贴一篇较长的 AI 生成 Markdown/纯文本报告。
3. 点击 `Create review session`。
4. 点击某个区块的评论按钮。
5. 在该区块下面直接输入 comment；也可以用 `Dictate` 做基础浏览器语音输入，或在 `Voice settings` 中填入自己的 OpenAI API key 后使用 `AI dictation`。
6. 点击 `Add comment`。
7. 至少创建三条批注。
8. 保持真正驱动修订的 comment 为 confirmed，或者稍后在批注面板中修改状态。
9. 点击 `Build pack`；应用会自动滚动到生成的 revision pack。
10. 检查生成的 prompt。
11. 点击 `Copy` 立即复制；界面会短暂显示已复制提示并自动消失。也可以点击 `Export pack`。
12. 自己把 revision request 粘贴到 ChatGPT、Claude、Codex 或 Claude Code。

The public web app does not silently send anything back to an AI service.

公共 Web App 不会静默把内容发送回任何 AI 服务。

## 5. CLI Adapter / CLI 适配器

Build the CLI:

构建 CLI：

```bash
npm run build -w @ai-annotated-review/cli
```

Create a review session:

创建审阅会话：

```bash
node apps/cli/dist/index.js create report.md --out review.json --title "Report Review" --source-label "Codex CLI"
```

List review blocks:

列出审阅区块：

```bash
node apps/cli/dist/index.js blocks review.json
```

Add a confirmed annotation:

添加一条 confirmed 批注：

```bash
node apps/cli/dist/index.js annotate review.json \
  --block BLOCK_ID_FROM_BLOCKS \
  --title "Clarify this section" \
  --body "Make the claim more concrete and add one example." \
  --priority P1 \
  --status confirmed \
  --out review.json
```

Build the revision pack:

生成 revision pack：

```bash
node apps/cli/dist/index.js pack review.json --out revision-pack.md
```

Use `revision-pack.md` as the next message or attached instruction in Codex CLI, Claude Code, ChatGPT, or Claude.

把 `revision-pack.md` 作为下一条消息或附件说明，交给 Codex CLI、Claude Code、ChatGPT 或 Claude。

## 6. ChatGPT Apps SDK Technical Preview / ChatGPT Apps SDK 技术预览

The Apps SDK adapter is retained for Developer Mode and future official submission.

Apps SDK 适配器保留用于 Developer Mode 和未来可能的官方提交。

Run the local MCP server:

运行本地 MCP server：

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

Endpoint:

Endpoint：

```text
http://localhost:8787/mcp
```

Local web route from the same server:

同一 server 的本地 Web 路由：

```text
http://localhost:8787/app
```

For ChatGPT Developer Mode, ChatGPT requires an HTTPS MCP URL. Use a temporary HTTPS tunnel only for development, then connect the `/mcp` URL in ChatGPT Developer Mode.

对于 ChatGPT Developer Mode，ChatGPT 需要 HTTPS MCP URL。开发时可以临时使用 HTTPS tunnel，然后在 ChatGPT Developer Mode 中连接 `/mcp` URL。

Inside the Apps SDK widget:

在 Apps SDK widget 中：

1. Add comments while reading.
2. Mark only revision-driving comments as `confirmed`.
3. Click `Build pack`.
4. Review the prompt.
5. Click `Send revision request`.
6. Confirm in the modal.

1. 边阅读边添加 comment。
2. 只把真正驱动修订的 comment 标为 `confirmed`。
3. 点击 `Build pack`。
4. 检查 prompt。
5. 点击 `Send revision request`。
6. 在弹窗中确认。

The send path is available only inside a compatible ChatGPT Apps SDK host. In local preview, public web app, and browser extension mode, the app copies or exports the revision request instead.

真正的 send path 只在兼容的 ChatGPT Apps SDK host 中可用。在本地预览、公共 Web App 和浏览器扩展模式中，应用只会复制或导出 revision request。

## 7. Limits / 限制

Current hard caps:

当前硬限制：

- 100,000 Unicode characters.
- 300 review blocks.

- 100,000 个 Unicode 字符。
- 300 个审阅区块。

If the document exceeds a cap, the parser returns a clear error instead of attempting an unreliable import.

如果文档超过限制，解析器会返回明确错误，而不是尝试不可靠的导入。

## 8. Verification / 验证

Run the core verification gate:

运行核心验证：

```bash
npm run verify
```

Run adapter-specific verification:

运行适配器验证：

```bash
npm run verify:adapters
```

`verify:adapters` checks:

`verify:adapters` 会检查：

- The built Chrome extension manifest.
- Exact ChatGPT/Claude/OpenAI-transcription host permissions.
- No broad `<all_urls>` access.
- Selected-text-only import boundary.
- CLI create/blocks/annotate/pack behavior.

- 构建后的 Chrome 扩展 manifest。
- ChatGPT/Claude/OpenAI transcription 的精确 host permissions。
- 不使用宽泛的 `<all_urls>` 权限。
- 只导入用户选中文本的边界。
- CLI create/blocks/annotate/pack 行为。

## 9. Release Boundary / 发布边界

This project currently ships as source plus deployable web/extension/CLI artifacts.

本项目当前以源码、可部署 Web、浏览器扩展和 CLI artifact 形式发布。

Do not claim official ChatGPT App Directory availability unless OpenAI publisher verification, final dashboard submission, and OpenAI approval are completed later.

除非未来完成 OpenAI publisher verification、最终 dashboard submission 和 OpenAI approval，否则不要声称本项目已经是官方 ChatGPT App Directory 应用。

Do not claim the Chrome Web Store listing is live or approved until Google review passes.

除非 Google 审核通过，否则不要声称 Chrome Web Store 扩展已经正式上线或获批。
