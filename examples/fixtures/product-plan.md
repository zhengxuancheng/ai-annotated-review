# NextKey Launch Plan Review Fixture

## Summary

NextKey should launch as a focused assistant for AI-assisted writing and review workflows. The first public version should demonstrate one strong workflow rather than many shallow integrations.

## User Problem

People can generate long drafts with AI, but revision happens through a single chat input. This makes paragraph-level feedback hard to capture and harder to apply.

## Proposed Scope

- Import a long AI-generated report from ChatGPT.
- Split the report into reviewable blocks.
- Let the reviewer attach comments to exact blocks.
- Generate a revision instruction pack from confirmed comments.

## Risks

The biggest risk is overclaiming platform integration. The app should say it renders an embedded review component inside ChatGPT, not that it changes ChatGPT's native message UI.

## Demo

The demo should show three annotations, two confirmed comments, one rejected comment, and a final revision request sent only after explicit user confirmation.
