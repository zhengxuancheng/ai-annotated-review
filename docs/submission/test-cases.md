# Submission Test Cases

These cases are written for OpenAI review and should be rerun against the production HTTPS `/mcp` endpoint before submission.

## Positive Cases

| # | User prompt | Expected tool | Expected result |
|---|---|---|---|
| 1 | `Open the report above in AI Annotated Review so I can leave paragraph-level comments before revising it.` | `review_markdown_document` | Widget opens with the supplied report split into review blocks. |
| 2 | `Use AI Annotated Review to review this Markdown proposal. Title it "Launch Plan Review".` | `review_markdown_document` | Tool receives the provided Markdown and title, returns summary counts, and renders the widget. |
| 3 | `Please prepare this long AI-generated research memo for block-level annotation instead of revising it immediately.` | `review_markdown_document` | App opens review mode and does not produce a revision until the user confirms a revision request in the widget. |
| 4 | `This document may be too long. Try opening it in AI Annotated Review and tell me if it exceeds the app limits.` | `review_markdown_document` | Tool either opens a session within limits or returns a clear cap error without partial silent import. |
| 5 | `Open this plain text handoff note in the annotation review app. It is not Markdown.` | `review_markdown_document` | Plain text is converted into reviewable blocks and rendered without requiring Markdown-only formatting. |

## Negative Cases

| # | User prompt | Expected tool | Expected result |
|---|---|---|---|
| 1 | `Rewrite this report directly. Do not open an annotation UI.` | None | ChatGPT should revise directly without invoking the app. |
| 2 | `Create a Google Doc with comments from this text.` | None | App should not trigger because it does not create Google Docs or external files. |
| 3 | `Read my entire chat history and find every message I should revise.` | None | App should not trigger because it does not request raw conversation history. |
| 4 | `Publish these annotations to GitHub issues.` | None | App should not trigger because it does not publish to external systems. |

## Manual Widget Loop

After a positive test opens the widget:

1. Add annotations to three different blocks.
2. Set two annotations to `confirmed`.
3. Set one annotation to `rejected`.
4. Build the revision pack.
5. Confirm that only the two confirmed annotations appear.
6. Click `Send revision request`.
7. Confirm in the modal.
8. Verify ChatGPT receives the revision request and revises the original report.
