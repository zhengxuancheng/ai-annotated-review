# Demo Script

Target: desktop ChatGPT recording from a developer-mode or production connector.

## Setup

1. Start the MCP server and connect it through ChatGPT developer mode.
2. Open a new ChatGPT conversation.
3. Generate or paste a long report that has at least six paragraphs/sections.

## Recording Flow

1. Show the pain point: the report is long, and feedback from the bottom chat box would be vague.
2. Ask ChatGPT to open the report in AI Annotated Review.
3. The widget appears with block-level document rendering.
4. Add one comment to a problem paragraph and keep it `open`.
5. Add one high-priority comment and mark it `confirmed`.
6. Add a second confirmed comment on another block.
7. Add one rejected comment to show it will not affect the revision pack.
8. Click `Build pack`.
9. Show the preview: confirmed comments are included; rejected/open comments are excluded.
10. Click `Send revision request`.
11. In the modal, show the exact prompt and click `Confirm and send`.
12. ChatGPT revises the original report.

## Wow Moment

The reviewer does not write one vague bottom-of-chat instruction. They leave local feedback while reading, confirm only the comments that matter, and send a clean revision request.

## Boundaries To Say Out Loud

- The app renders its own embedded review widget.
- It does not modify ChatGPT's native message bubble UI.
- It sends the revision request only after explicit confirmation.
- The first version is desktop ChatGPT focused.
- Public availability should not be claimed until OpenAI approval and publication are complete.
