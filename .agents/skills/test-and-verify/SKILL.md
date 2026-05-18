---
name: test-and-verify
description: Use before claiming implementation work is complete or ready for review. Defines verification expectations for parser, core model, Apps SDK widget, and public-demo behavior.
---

# Test And Verify

Use this skill before any done/pass claim after implementation begins.

## Verification Ladder

1. Run unit tests for changed packages.
2. Run fixture tests for Markdown parsing and revision-pack generation.
3. Run import/export round-trip tests for review sessions.
4. Run build checks.
5. Run MCP Inspector smoke tests for Apps SDK tools.
6. Run desktop ChatGPT developer mode smoke tests before demo claims.
7. Run browser visual checks for the widget before UI completion claims.
8. Run license/security checks before public release.

## Current Phase Rule

During Phase 0A/0B, verification means checking docs, repo structure, and absence of product code/dependencies/license files unless explicitly approved.

