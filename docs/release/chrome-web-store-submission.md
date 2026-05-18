# Chrome Web Store Submission Packet / Chrome Web Store 提交包

Status: `v0.1.2` was submitted to Chrome Web Store review on 2026-05-18. Current observed dashboard status: `Pending review`. It is not approved or live yet.

状态：`v0.1.2` 已于 2026-05-18 提交 Chrome Web Store 审核。当前后台可见状态为 `Pending review`。它尚未审核通过，也尚未正式上线。

## Recommendation / 建议

Submit the extension as a free Chrome Web Store item first. Do not add paid features, subscriptions, accounts, or external licensing in the first store release.

Rationale:

- The product's current purpose is public usefulness, open-source credibility, and demo distribution.
- Chrome Web Store payments are deprecated; monetization would require an external payment/licensing system.
- Paid functionality can require physical address and trader/commercial disclosure fields, which increases owner-side identity and privacy burden.
- A free listing is enough to validate demand and reduce installation friction.

建议第一版作为免费 Chrome Web Store 扩展提交。不要在第一版加入付费功能、订阅、账号体系或外部授权系统。

原因：

- 当前目标是公开可用、开源可信和演示传播。
- Chrome Web Store 的内置付款能力已废弃；商业化需要外部支付或授权系统。
- 付费功能可能带来地址、trader/commercial disclosure 等额外身份与隐私负担。
- 免费上架已经足够验证需求，并降低用户安装门槛。

## Package / 扩展包

Build the upload package from the repository root:

```bash
npm run package:extension
```

Expected outputs:

```text
release-artifacts/ai-annotated-review-companion-v0.1.2.zip
release-artifacts/ai-annotated-review-companion-v0.1.2.zip.sha256
```

Upload the zip file in Chrome Web Store Developer Dashboard.

从仓库根目录构建上传包。`v0.1.2` 已使用上面的 zip 提交审核。

## Listing Draft / 商店文案草稿

Name:

```text
AI Annotated Review Companion
```

Chinese name:

```text
AI 批注式审阅助手
```

Short description:

```text
Review long AI outputs from ChatGPT and Claude in a browser side panel.
```

Chinese short description:

```text
在浏览器侧栏中审阅来自 ChatGPT 和 Claude 的长篇 AI 输出。
```

Detailed description:

```text
AI Annotated Review Companion helps you review long AI-generated answers without losing paragraph-level feedback.

Select text from ChatGPT or Claude, open the side panel, and turn the selected output into review blocks. Add comments directly under the relevant block, confirm the comments that should drive revision, build a revision request, then copy it back into your AI chat.

Core features:
- Import only the text you select in the active ChatGPT or Claude tab.
- Split long Markdown or plain text into review blocks.
- Add inline block-level comments.
- Generate comment title, priority, and confirmed status locally.
- Edit annotation status or priority when needed.
- Build a confirmed-only revision request.
- Copy or export the revision request after explicit user action.
- Use optional browser dictation where Chrome supports speech recognition.
- Use optional AI dictation with your own OpenAI API key.

Privacy and boundaries:
- The extension does not scrape your whole conversation.
- The extension does not modify ChatGPT or Claude native message bubbles.
- Review sessions stay in the browser surface until you export or copy them.
- Optional AI dictation sends recorded audio directly to OpenAI only after you enter your own API key and click Stop & transcribe.
- No accounts, billing, telemetry, or cloud sync are provided by this extension.

This is an open-source project licensed under Apache-2.0.
```

Chinese detailed description:

```text
AI 批注式审阅助手可以帮助你审阅很长的 AI 生成回答，不再丢失段落级反馈。

在 ChatGPT 或 Claude 中选中一段文本，打开侧栏，把选中的输出转换成审阅区块。你可以在对应区块下直接添加评论，确认哪些评论应该驱动修订，生成修订请求，然后复制回 AI 对话。

核心功能：
- 只导入你在当前 ChatGPT 或 Claude 标签页中主动选中的文本。
- 把长 Markdown 或纯文本拆成审阅区块。
- 添加区块级内联批注。
- 本地生成批注标题、优先级和 confirmed 状态。
- 必要时编辑批注状态或优先级。
- 生成只包含 confirmed 批注的修订请求。
- 只有用户明确操作后，才复制或导出修订请求。
- 在 Chrome 支持语音识别时，可使用可选浏览器语音输入。
- 可选 AI 语音输入使用你自己的 OpenAI API key。

隐私和边界：
- 扩展不会抓取你的完整对话。
- 扩展不会修改 ChatGPT 或 Claude 的原生消息气泡。
- 审阅会话会停留在浏览器界面中，直到你主动导出或复制。
- 可选 AI 语音输入只有在你输入自己的 API key 并点击 Stop & transcribe 后，才会把录音直接发送给 OpenAI。
- 本扩展不提供账号、计费、遥测或云同步。

本项目开源，使用 Apache-2.0 许可证。
```

Category:

```text
Workflow & Planning
```

Languages:

```text
English
Chinese (China)
```

Support URL:

```text
https://github.com/zhengxuancheng/ai-annotated-review/issues
```

Homepage URL:

```text
https://github.com/zhengxuancheng/ai-annotated-review
```

Privacy policy URL:

```text
https://ai-annotated-review.liujinxingde2008.workers.dev/privacy
```

## Permissions Justification / 权限说明

`activeTab`:

```text
Used only after the user opens the extension on the active tab. The extension reads only the text the user selected for review.
```

`scripting`:

```text
Used to execute a small selected-text extraction script in the active ChatGPT or Claude tab after user action.
```

`sidePanel`:

```text
Used to show the review workflow next to ChatGPT or Claude without modifying either product's native UI.
```

Host permission `https://chatgpt.com/*`:

```text
Allows selected-text import from the current ChatGPT web tab after user action.
```

Host permission `https://chat.openai.com/*`:

```text
Allows selected-text import from the legacy ChatGPT web domain after user action.
```

Host permission `https://claude.ai/*`:

```text
Allows selected-text import from the current Claude web tab after user action.
```

Host permission `https://api.openai.com/*`:

```text
Allows optional AI dictation when the user enters their own OpenAI API key, records audio, and clicks Stop & transcribe.
```

## Privacy Fields Draft

Single purpose:

```text
Review user-selected AI-generated text in a side panel, attach block-level comments, and create a user-copied revision request.
```

Data handling:

```text
The extension processes user-selected page text, review comments, annotation status/priority, generated revision requests, and optional audio for AI dictation. It does not collect full browsing history, payment information, passwords, government identifiers, or location. Review sessions are kept in browser memory until the user copies or exports them. Optional AI dictation sends recorded audio directly from the browser to OpenAI using the user's own API key.
```

Remote code:

```text
The extension does not execute remotely hosted code. Extension pages use bundled scripts from the package.
```

## Test Instructions For Reviewer

```text
1. Install the extension.
2. Open https://chatgpt.com or https://claude.ai.
3. Select a multi-paragraph AI answer.
4. Click the extension icon to open the side panel.
5. Click Use selected text.
6. Confirm the imported selected text and create a review session.
7. Click a block comment button.
8. Type a comment and click Add comment.
9. Click Build pack.
10. Confirm that the revision request includes only confirmed comments.
11. Click Copy and verify that the copied notice appears.

Optional AI dictation:
1. Open Voice settings.
2. Enter an OpenAI API key owned by the tester.
3. Click AI dictation, record a short comment, then click Stop & transcribe.
4. Verify that the recognized text appears in the comment box before adding the comment.
```

Chinese reviewer instructions:

```text
1. 安装扩展。
2. 打开 https://chatgpt.com 或 https://claude.ai。
3. 选中一段多段落 AI 回答。
4. 点击扩展图标打开侧栏。
5. 点击 Use selected text。
6. 检查导入的选中文本，并创建审阅会话。
7. 点击某个区块的评论按钮。
8. 输入评论并点击 Add comment。
9. 点击 Build pack。
10. 确认修订请求只包含 confirmed 评论。
11. 点击 Copy，并确认出现已复制提示。

可选 AI 语音输入：
1. 打开 Voice settings。
2. 输入测试者自己的 OpenAI API key。
3. 点击 AI dictation，录一小段评论，再点击 Stop & transcribe。
4. 确认识别文本出现在评论框中，然后再添加评论。
```

## Store Assets Needed

Required by Chrome Web Store:

- Extension icon: included in the extension zip as `icons/icon-128.png`.
- Small promotional image: `docs/release/chrome-web-store-assets/small-promo-440x280.png`.
- At least one screenshot: `docs/release/chrome-web-store-assets/screenshot-review-surface-1280x800.png`.

Recommended screenshots:

1. ChatGPT selected text with side panel import modal.
2. Review blocks with inline comment composer.
3. Built revision request with Copy button and copied notice.

Current submitted screenshot asset shows the shared review surface. For a future update, prefer replacing or supplementing it with a screenshot captured from the installed side panel beside ChatGPT or Claude.

当前已提交的截图素材展示的是共享审阅界面。未来更新版本时，建议补充或替换为安装后的侧栏扩展在 ChatGPT 或 Claude 旁边运行的截图。

## Owner-Side Steps / Owner 侧步骤

These steps required the owner's Google account and could not be completed from the repository alone:

1. Register a Chrome Web Store developer account. Completed.
2. Pay the one-time developer registration fee. Completed before submission.
3. Verify the developer email. Completed by owner.
4. Choose free distribution and no paid functionality. Completed.
5. Upload the extension zip. Completed with `v0.1.2`.
6. Fill Store Listing, Privacy, Distribution, and Test Instructions. Completed with English and Chinese listing fields.
7. Submit for review. Completed on 2026-05-18.

Do not declare the extension as Chrome Web Store approved until review passes and the listing is live.

这些步骤需要 owner 的 Google 账号，不能只靠仓库文件完成：

1. 注册 Chrome Web Store 开发者账号。已完成。
2. 支付一次性开发者注册费。提交前已完成。
3. 验证开发者邮箱。owner 已完成。
4. 选择免费分发，不启用付费功能。已完成。
5. 上传扩展 zip。已使用 `v0.1.2` 完成。
6. 填写 Store Listing、Privacy、Distribution 和 Test Instructions。已完成，并包含英文和中文商店信息。
7. 提交审核。已于 2026-05-18 完成。

在 Google 审核通过且商店页面真正上线前，不要声明扩展已经获批或正式上架。
