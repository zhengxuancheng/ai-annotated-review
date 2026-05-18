---
name: reality-checker
description: Use before publishing claims, README text, demo scripts, release notes, or completion statements. Checks platform limits, overclaims, privacy claims, and external-resource facts.
---

# Reality Checker

Use this skill before any public-facing statement or completion claim.

## Checks

1. Verify platform capabilities against official docs.
2. Reject claims that the app modifies native ChatGPT/Claude/Codex UI.
3. Verify desktop-only v1 scope is not blurred into mobile support.
4. Confirm every send-to-ChatGPT action is user-confirmed.
5. Recheck external repo metrics before public docs, including stars, license, and update dates.
6. Confirm no GPL/AGPL resources are presented as accepted dependencies.
7. Confirm privacy claims match actual tool inputs, tool outputs, widget state, and storage behavior.

## Output

Lead with blockers. If no blockers, state remaining caveats.

