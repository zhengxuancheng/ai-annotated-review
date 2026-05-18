---
name: open-source-first-research
description: Use before choosing dependencies, frameworks, SDKs, examples, or architecture for this repo. Requires official docs, license checks, maintenance checks, and prior-art review before implementation.
---

# Open Source First Research

Use this skill before adding a dependency, adopting an external repo, or making a platform claim.

## Workflow

1. Read official platform docs first when the decision involves ChatGPT Apps SDK, Codex, MCP, Claude Code, browser extensions, VS Code, or Cursor.
2. Search GitHub/npm for mature reusable resources.
3. Record license, last update, maintenance signal, and fit.
4. Reject GPL, LGPL, AGPL, source-available, unclear-license, or abandoned resources unless the owner explicitly approves.
5. Prefer official SDKs and small focused libraries over broad agent collections.
6. Treat `agency-agents` and similar collections as reference material only unless separately reviewed.
7. Produce a short decision table before implementation.

## Output

Return:

- resources considered,
- accepted resources,
- rejected or deferred resources,
- license concerns,
- implementation recommendation.

