# Usage Tutorial

## 1. Install And Verify

From the repository root:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run verify:adapters
```

Expected result:

- unit tests pass,
- TypeScript project references pass,
- web app builds,
- browser extension builds,
- CLI builds and passes a create -> blocks -> annotate -> pack smoke test.

## 2. Chrome Side Panel Extension

The Chrome side panel extension is the primary v1 workflow because it sits beside ChatGPT or Claude while still importing only user-selected text.

Download the latest release zip:

```text
https://github.com/zhengxuancheng/ai-annotated-review/releases/latest
```

Install from the release zip:

1. Download `ai-annotated-review-companion-v*.zip`.
2. Unzip it locally.
3. Open `chrome://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped folder.

Build locally instead:

```bash
npm run package:extension
```

The packaged zip is written to:

```text
release-artifacts/
```

Use it:

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

The side panel imports only the text currently selected by the user in the active ChatGPT or Claude tab. It does not scrape the whole conversation.

The primary review flow asks only for the comment. The app generates a short title, priority, and confirmed status locally; the annotation list still allows later status or priority edits when needed.

If `Dictate` needs microphone permission, the extension opens an `Enable microphone dictation` tab. Allow microphone access there, return to the side panel, and click `Dictate` again.

`Dictate` uses Chrome's browser speech recognition. If macOS or Chrome routes Chrome's microphone input to an iPhone Continuity microphone, the extension cannot force it back to the Mac microphone from Web Speech code. Change the input source in macOS or Chrome settings, then click `Dictate` again.

`AI dictation` records audio until you click `Stop & transcribe`, then sends that audio directly to OpenAI's transcription endpoint with the current review-block context. This mode is optional, requires your own OpenAI API key, and stores the key only in this browser's local storage. Use the `Microphone` selector in `Voice settings` when Chrome exposes more than one input device.

Speech cleanup is intentionally conservative. It can correct obvious reviewed-block terms such as `face0a` -> `Phase 0A` when the selected block contains `Phase 0A`, but you should still read the comment before clicking `Add comment`.

## 3. Public Web App Flow

The public web app is a demo and fallback surface. It is not the main v1 distribution channel.

Local preview:

```bash
npm run preview:web
```

Open:

```text
http://127.0.0.1:5173/
```

Production Worker route after deploy:

```text
https://your-worker.example/app
```

Review workflow:

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

The public web app does not silently send anything back to an AI service.

## 4. CLI Adapter

Build the CLI:

```bash
npm run build -w @ai-annotated-review/cli
```

Create a review session:

```bash
node apps/cli/dist/index.js create report.md --out review.json --title "Report Review" --source-label "Codex CLI"
```

List review blocks:

```bash
node apps/cli/dist/index.js blocks review.json
```

Add a confirmed annotation:

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

```bash
node apps/cli/dist/index.js pack review.json --out revision-pack.md
```

Use `revision-pack.md` as the next message or attached instruction in Codex CLI, Claude Code, ChatGPT, or Claude.

## 5. ChatGPT Apps SDK Technical Preview

The Apps SDK adapter is retained for Developer Mode and future official submission.

Run the local MCP server:

```bash
npm run start -w @ai-annotated-review/chatgpt-app-server
```

Endpoint:

```text
http://localhost:8787/mcp
```

Local web route from the same server:

```text
http://localhost:8787/app
```

For ChatGPT Developer Mode, ChatGPT requires an HTTPS MCP URL. Use a temporary HTTPS tunnel only for development, then connect the `/mcp` URL in ChatGPT Developer Mode.

Inside the Apps SDK widget:

1. Add comments while reading.
2. Mark only revision-driving comments as `confirmed`.
3. Click `Build pack`.
4. Review the prompt.
5. Click `Send revision request`.
6. Confirm in the modal.

The send path is available only inside a compatible ChatGPT Apps SDK host. In local preview, public web app, and browser extension mode, the app copies or exports the revision request instead.

## 6. Limits

Current hard caps:

- 100,000 Unicode characters,
- 300 review blocks.

If the document exceeds a cap, the parser returns a clear error instead of attempting an unreliable import.

## 7. Verification

Run the core verification gate:

```bash
npm run verify
```

Run adapter-specific verification:

```bash
npm run verify:adapters
```

`verify:adapters` checks:

- the built Chrome extension manifest,
- exact ChatGPT/Claude/OpenAI-transcription host permissions,
- no broad `<all_urls>` access,
- selected-text-only import boundary,
- CLI create/blocks/annotate/pack behavior.

## 8. Release Boundary

This project currently ships as source plus deployable web/extension/CLI artifacts.

Do not claim official ChatGPT App Directory availability unless OpenAI publisher verification, final dashboard submission, and OpenAI approval are completed later.
