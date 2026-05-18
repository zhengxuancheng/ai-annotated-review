# Demo Script

Target: desktop recording of the public web app or Chrome side panel beside ChatGPT/Claude web.

## Setup

1. Open ChatGPT or Claude in Chrome.
2. Generate or paste a long report with at least six paragraphs/sections.
3. Open AI Annotated Review:
   - public web app route `/app`, or
   - Chrome side panel extension loaded from `apps/browser-extension/dist`.

## Public Web Recording Flow

1. Show the pain point: the report is long, and feedback from the bottom chat box would be vague.
2. Open the public web app.
3. Click `New document`.
4. Paste the long AI output.
5. Click `Create review session`.
6. Add one comment to a problem paragraph and keep it `open`.
7. Add one high-priority comment and mark it `confirmed`.
8. Add a second confirmed comment on another block.
9. Add one rejected comment to show it will not affect the revision pack.
10. Click `Build pack`; the app jumps to the revision pack.
11. Show the preview: confirmed comments are included; rejected/open comments are excluded.
12. Click `Copy` to copy immediately; show the short copied notice, or click `Export pack`.
13. Paste the revision request back into ChatGPT or Claude.
14. Show the assistant revising according to the confirmed comments.

## Browser Side Panel Recording Flow

1. Show ChatGPT or Claude with a long answer.
2. Select the answer text manually.
3. Open the Chrome side panel extension.
4. Click `Use selected text`.
5. Confirm the imported text and click `Create review session`.
6. Repeat the annotation and revision-pack steps above.
7. Copy/export the revision request and paste it back into the same AI conversation.

## Wow Moment

The reviewer does not write one vague bottom-of-chat instruction. They leave local feedback while reading, confirm only the comments that matter, and generate a clean revision request that can be pasted back into the assistant.

## Boundaries To Say Out Loud

- The app renders its own review surface.
- It does not modify ChatGPT or Claude native message bubbles.
- The browser extension imports selected text only; it does not scrape the whole chat.
- The public web and browser extension flows copy/export the revision request; they do not silently send anything.
- The ChatGPT Apps SDK adapter is a technical preview, not an approved public ChatGPT App Directory listing.
