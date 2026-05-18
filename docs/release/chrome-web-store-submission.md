# Chrome Web Store Submission Packet

Status: prepared for first Chrome Web Store submission. Not submitted or approved yet.

## Recommendation

Submit the extension as a free Chrome Web Store item first. Do not add paid features, subscriptions, accounts, or external licensing in the first store release.

Rationale:

- The product's current purpose is public usefulness, open-source credibility, and demo distribution.
- Chrome Web Store payments are deprecated; monetization would require an external payment/licensing system.
- Paid functionality can require physical address and trader/commercial disclosure fields, which increases owner-side identity and privacy burden.
- A free listing is enough to validate demand and reduce installation friction.

## Package

Build the upload package from the repository root:

```bash
npm run package:extension
```

Expected outputs:

```text
release-artifacts/ai-annotated-review-companion-v0.1.1.zip
release-artifacts/ai-annotated-review-companion-v0.1.1.zip.sha256
```

Upload the zip file in Chrome Web Store Developer Dashboard.

## Listing Draft

Name:

```text
AI Annotated Review Companion
```

Short description:

```text
Review long AI outputs from ChatGPT and Claude in a browser side panel.
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

Category:

```text
Productivity
```

Language:

```text
English
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

## Permissions Justification

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

## Store Assets Needed

Required by Chrome Web Store:

- Extension icon: included in the extension zip as `icons/icon-128.png`.
- Small promotional image: `docs/release/chrome-web-store-assets/small-promo-440x280.png`.
- At least one screenshot: `docs/release/chrome-web-store-assets/screenshot-review-surface-1280x800.png`.

Recommended screenshots:

1. ChatGPT selected text with side panel import modal.
2. Review blocks with inline comment composer.
3. Built revision request with Copy button and copied notice.

Current screenshot asset shows the shared review surface. Before final Chrome Web Store submission, prefer replacing or supplementing it with a screenshot captured from the installed side panel beside ChatGPT or Claude.

## Owner-Side Steps

These steps require the owner's Google account and cannot be completed from the repository alone:

1. Register a Chrome Web Store developer account.
2. Pay the one-time developer registration fee.
3. Verify the developer email.
4. Choose free distribution and no paid functionality.
5. Upload the extension zip.
6. Fill Store Listing, Privacy, Distribution, and Test Instructions.
7. Submit for review.

Do not declare the extension as Chrome Web Store approved until review passes and the listing is live.
