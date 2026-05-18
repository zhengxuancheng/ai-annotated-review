# Codex Workflow Resource Audit

Date: 2026-05-18
Project: AI Annotated Review
Status: preparation report only. No product implementation has started.

## Executive Verdict

Do not install any broad third-party agent collections now.

The current Codex environment is already capable enough for this project: official OpenAI docs MCP is enabled, the ChatGPT Apps plugin is installed, web/build plugins are available, and multi-agent support is available when explicitly requested. The next useful step is a repo-local `AGENTS.md` and a small set of repo-local skills after the repository is initialized. External collections such as `agency-agents` are useful as inspiration, but they should not be imported wholesale.

## Current Codex Environment

Observed locally:

- `codex-cli 0.128.0`.
- Active model config: `gpt-5.5`, reasoning effort `xhigh`, personality `pragmatic`.
- Current workspace: `/Users/liujinxing/Documents/Working/AI探索/AI长文批注审阅`.
- The workspace is trusted in `~/.codex/config.toml`.
- The workspace is currently empty and not a Git repository.
- `~/.codex/AGENTS.md` exists but is empty, so it contributes no global guidance.
- `openaiDeveloperDocs` MCP is enabled at `https://developers.openai.com/mcp`.
- Other enabled MCP/app/tooling surfaces include Cloudflare API, XcodeBuildMCP, Computer Use, Browser, Chrome, GitHub, Build Web Apps, Build iOS Apps, ChatGPT Apps, Netlify, Documents, Presentations, Spreadsheets, Superpowers, and Test Android Apps plugins.

## Available Codex Extension Mechanisms

### AGENTS.md

Official Codex docs say Codex reads global and project `AGENTS.md` files before work, then layers project files from repo root down to the current directory. Empty files are skipped, and closer files override earlier guidance by appearing later in the instruction chain.

Recommendation:

- Create a repo-root `AGENTS.md` after initializing the project repo.
- Keep it short: purpose, non-goals, verification commands, security rules, package manager, license policy, and "no platform hacks".
- Do not add a huge product spec to `AGENTS.md`; link to docs instead.

Source: https://developers.openai.com/codex/guides/agents-md

### Agent Skills

Official Codex docs describe skills as directories with `SKILL.md` plus optional scripts, references, and assets. Skills use progressive disclosure, so only skill metadata is always in context; full instructions are loaded when the skill triggers.

Recommendation:

- Use repo-local skills under `.agents/skills/` only after this proposal is accepted.
- Prefer instruction-only skills first.
- Add scripts only for deterministic checks, such as license scanning or Apps SDK smoke tests.
- Keep each skill focused on one job.

Source: https://developers.openai.com/codex/skills

### Plugins

Codex plugins are the installable distribution unit. A plugin can bundle skills, MCP configuration, app mappings, lifecycle hooks, and assets. The official docs state that if a workflow is still being iterated on, start with a local skill; build a plugin when the workflow is stable enough to share.

Recommendation:

- Do not create a plugin during planning.
- Later, create a repo-local plugin only if the project wants to distribute the Codex adapter or reusable review skills.
- Keep plugin hooks disabled unless there is a clear need and a security review.

Sources:

- https://developers.openai.com/codex/plugins/build
- https://developers.openai.com/codex/config-reference

### MCP Servers

MCP servers can extend Codex with external tools and docs. Current configured MCP servers include official OpenAI docs, Cloudflare API, XcodeBuildMCP, and Computer Use.

Recommendation:

- Keep `openaiDeveloperDocs` as the main source for OpenAI Apps SDK guidance.
- Add no new MCP servers now.
- Later, consider a project-local MCP test server only as part of the ChatGPT app implementation.
- Avoid MCP servers that require broad filesystem, network, or credential access unless they are pinned, audited, and necessary.

### Multi-Agent Workflows

Official Codex docs state that subagents are enabled by default, but Codex only spawns them when explicitly asked. Subagents inherit sandbox policy and consume extra tokens.

Recommendation:

- Use multi-agent workflows only for later independent audits: security review, UX review, Apps SDK docs verification, and implementation review.
- Do not use autonomous fan-out as a default workflow.
- Define project-specific reviewer agents only after the repo has stable conventions.

Source: https://developers.openai.com/codex/subagents

## External Resources Researched

### `msitarzewski/agency-agents`

Observed via GitHub:

- Repository: https://github.com/msitarzewski/agency-agents
- License: MIT.
- Public activity metrics are intentionally omitted from this repo document. Recheck directly on GitHub before citing stars, update dates, or maintenance status in public-facing material.
- Description: broad collection of specialized AI agency agents.

Assessment:

- Suitable as a reference for role naming, review personas, and deliverable templates.
- Not directly compatible with Codex as-is unless converted into Codex custom agents or skills.
- Too broad to install globally. It would add context noise and unreviewed behavior.
- Some personas are marketing/content oriented and not aligned with this project.

Decision:

- Do not install.
- If useful later, selectively read individual files in a sandbox and adapt the ideas manually into repo-local Codex skills or custom agents.

### OpenAI Skills Catalog and Agent Skills Standard

Observed via GitHub:

- `openai/skills`: https://github.com/openai/skills. No license file was detected via GitHub API in this run, so do not copy content without license review.
- `agentskills/agentskills`: https://github.com/agentskills/agentskills. Apache-2.0. This is the specification and documentation for Agent Skills.

Assessment:

- Use the official Codex skill docs and Agent Skills specification for structure.
- Avoid copying unlicensed skill text from catalogs. Treat catalogs as examples unless license terms are explicit.

Sources:

- https://developers.openai.com/codex/skills
- https://agentskills.io/specification

### Anthropic Skills and Claude Code Repos

Observed via GitHub:

- `anthropics/skills`: public skills repository, no license file detected via GitHub API in this run.
- `anthropics/claude-code`: public Claude Code repository, no license file detected via GitHub API in this run.

Assessment:

- Useful for understanding Claude Code ecosystem conventions.
- Not safe to copy into this project without a license review.
- Claude-specific command/skill formats should not be used as the core project format.

Decision:

- Defer. Use as reference only when designing a later Claude Code adapter.

### Official Apps SDK Examples

Observed via GitHub:

- Repository: https://github.com/openai/openai-apps-sdk-examples
- License: MIT.
- Public activity metrics are intentionally omitted from this repo document. Recheck directly on GitHub before citing stars, update dates, or maintenance status in public-facing material.

Assessment:

- Mature enough to use as the preferred starting point for ChatGPT Apps SDK implementation.
- Directly relevant and official.

Decision:

- Use later as implementation reference, not during this proposal-only phase.

### Model Context Protocol SDKs

Observed:

- `@modelcontextprotocol/sdk` on npm: MIT, version `1.29.0`, modified 2026-03-30.
- `@modelcontextprotocol/ext-apps` on npm: MIT, version `1.7.2`, modified 2026-05-15.
- `@openai/apps-sdk-ui` on npm: MIT, version `0.2.2`, modified 2026-05-12.
- `modelcontextprotocol/python-sdk`: MIT via GitHub.
- `modelcontextprotocol/typescript-sdk`: GitHub license file is in MIT to Apache-2.0 transition, while npm currently reports MIT.

Assessment:

- TypeScript SDK plus `@modelcontextprotocol/ext-apps` is the best initial stack because the UI will be React/TypeScript.
- Python SDK is viable for server-only apps but less natural for a React widget monorepo.

Decision:

- Use Node/TypeScript first.
- Keep Python out of first implementation unless needed for tests or utilities.

## Recommended Workflow Helpers

### Install Now

Nothing new.

Current Codex setup already includes the required official docs MCP and relevant plugins. Installing broad collections now would increase risk without improving proposal quality.

### Create After Repo Initialization

1. `AGENTS.md`
   - Project purpose and non-goals.
   - "ChatGPT widget, not native bubble modification" boundary.
   - Open-source license policy: prefer MIT, Apache-2.0, BSD; no GPL/AGPL without owner approval.
   - Verification commands once available.
   - Security rules: no secrets in repo, no scraping, no native UI hacks.

2. `.agents/skills/open-source-first-research/SKILL.md`
   - Trigger when choosing dependencies or platform approaches.
   - Require official docs, GitHub/npm license checks, maintenance check, and prior art scan before coding.

3. `.agents/skills/apps-sdk-builder/SKILL.md`
   - Trigger for ChatGPT Apps SDK implementation.
   - Require official docs fetch, Apps SDK examples check, tool schema plan, CSP plan, MCP Inspector smoke test.

4. `.agents/skills/annotation-review-workflow/SKILL.md`
   - Trigger for annotation model, block parser, revision prompt builder, and review UI flows.
   - Keep core data model platform-agnostic.

5. `.agents/skills/reality-checker/SKILL.md`
   - Trigger before release claims.
   - Check platform limitations, unsupported features, privacy overclaims, and demo claims.

6. `.agents/skills/test-and-verify/SKILL.md`
   - Trigger before completion.
   - Run unit tests, parser fixtures, Apps SDK local checks, Playwright UI checks, and license checks.

### Defer

- Custom Codex agents: defer until the project has real code and review surfaces.
- Codex plugin packaging: defer until repo-local skills stabilize.
- Additional MCP servers: defer until a tool is demonstrably needed.
- Browser extension tooling: defer until after the ChatGPT Apps SDK proof.
- Claude Code skill/plugin packaging: defer until core packages are stable.

## Draft Skill Modules

### `open-source-first-research`

Purpose: force dependency and prior-art review before implementation.

Core workflow:

1. Search official docs first for platform claims.
2. Search GitHub/npm for mature permissively licensed packages.
3. Record license, maintenance, stars/downloads if available, and last update.
4. Reject GPL/AGPL/transitive copyleft unless explicitly approved.
5. Prefer standard libraries and official SDKs for platform integration.
6. Produce a resource decision table before implementation.

### `product-spec-review`

Purpose: review product scope before code.

Core workflow:

1. Identify target users and job-to-be-done.
2. Separate first release, later adapters, and non-goals.
3. Flag platform claims that need docs evidence.
4. Produce acceptance criteria and demo script.

### `mvp-or-production-planning`

Purpose: prevent throwaway MVPs that do not match the intended product.

Core workflow:

1. Classify the artifact: throwaway prototype, public demo, or production-ready open-source.
2. Require public-demo polish if the goal is audience trust.
3. Keep architecture extensible only where future adapters are concrete.

### `test-and-verify`

Purpose: complete verification before any "done" claim.

Core workflow:

1. Run unit tests.
2. Run fixture tests for block parsing and prompt generation.
3. Run MCP Inspector or Apps SDK local smoke tests.
4. Run Playwright for rendered UI.
5. Run license/security checks.

### `reality-checker`

Purpose: catch overclaims.

Core workflow:

1. Compare every README/demo claim against code and official docs.
2. Mark unsupported native UI modification claims as blockers.
3. Verify privacy and data retention statements.
4. Verify "works in ChatGPT/Codex/Claude" separately per adapter.

### `apps-sdk-builder`

Purpose: implement Apps SDK features with current docs.

Core workflow:

1. Fetch current Apps SDK docs.
2. Choose app archetype.
3. Design MCP tools before UI.
4. Use MCP Apps bridge by default, ChatGPT `window.openai` only as optional extension.
5. Define tool annotations and CSP.
6. Verify with MCP Inspector and ChatGPT developer mode.

### `annotation-review-workflow`

Purpose: keep annotation logic portable.

Core workflow:

1. Parse Markdown into stable blocks.
2. Generate stable block IDs.
3. Store annotations with block references, text quote selectors, status, priority, and discussion.
4. Build revision instruction packs from confirmed annotations only.
5. Keep ChatGPT-specific send/follow-up behavior out of the core package.

## Risks And Security Concerns

- Third-party skills can include scripts, references, and hooks. Scripts and hooks should be treated as executable supply-chain code.
- MCP servers can expose network, filesystem, or account tools. Install only trusted servers, pin versions where possible, and avoid broad write tools.
- Broad agent collections create prompt bloat and unpredictable behavior.
- GitHub star counts, update dates, and license metadata are time-sensitive. Recheck before copying them into public README, launch copy, or video scripts.
- Apps SDK submissions require privacy policy accuracy and minimal tool inputs. The app must not request the full chat transcript "just in case".
- Widget `_meta`, `structuredContent`, content, and widget state must not contain secrets.
- AGPL/GPL code should be avoided unless the owner explicitly accepts license obligations.

## Recommendation

Proceed with the project, but keep the Codex self-upgrade small and repo-local:

1. Initialize the repo.
2. Add `AGENTS.md`.
3. Add a few instruction-only `.agents/skills` after the proposal is approved.
4. Use official Apps SDK examples and MCP SDKs as implementation baselines.
5. Do not install `agency-agents` or large external skill collections globally.
