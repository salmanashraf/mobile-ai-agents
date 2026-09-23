# AGENTS.md — Mobile AI Agents

> This file is read automatically by Codex when the repo is opened.
> It tells Codex how to navigate, use, and contribute to this toolkit.

---

## What This Repo Is

A curated toolkit of AI agents, skill prompts, and reusable workflows for
Android, iOS, Flutter, React Native, Unity, and Unreal Engine developers.

Each agent is self-contained: it has a purpose, an input format, an output
format, and a real worked example. Drop any agent into Codex as a
system prompt and it works immediately.

---

## Repo Map

```
mobile-ai-agents/
├── agents/          ← Self-contained AI agents (start here)
│   ├── android/
│   ├── ios/
│   ├── flutter/
│   ├── react-native/
│   ├── unity/
│   ├── unreal/
│   └── cross-platform/
├── skills/          ← Reusable skill modules (compose into agents)
├── prompts/         ← Standalone one-shot prompts
├── templates/       ← Scaffold for new agents / skills / prompts
├── examples/        ← Real code samples for agents to operate on
└── docs/            ← Extended guides
```

---

## How to Use an Agent

### Option A — Paste into Codex chat

1. Open any `agents/<platform>/<name>/agent.md`
2. Copy the **System Prompt** section
3. Paste it at the start of your Codex session
4. Follow the **Input Format** to send your code

### Option B — Load via slash command (recommended)

If you have this repo cloned locally, add to your Codex config:

```json
{
  "mcpServers": {},
  "customSlashCommands": [
    {
      "name": "android-review",
      "description": "Android Kotlin code reviewer",
      "prompt": "$(cat agents/android/code-reviewer/agent.md)"
    },
    {
      "name": "crash-analyze",
      "description": "Parse crash logs and suggest fixes",
      "prompt": "$(cat agents/android/crash-analyzer/agent.md)"
    }
  ]
}
```

Then type `/android-review` in any session to activate the agent.

### Option C — Reference directly in Codex

With this repo open as your working directory, Codex can read agents
on demand. Just say:

```
Use the agent at agents/android/code-reviewer/agent.md to review this file:
[paste your code]
```

---

## Agent Index

| Agent | Path | Platform | What It Does |
|---|---|---|---|
| Android ANR Investigation Agent | `agents/android/anr-investigation/` | Android | ANR traces, Play Console clusters, and thread dumps → root cause, fix, and verification |
| Android Code Reviewer | `agents/android/code-reviewer/` | Android | Reviews Kotlin/Compose for Clean Architecture, leaks, anti-patterns |
| Compose Navigation Architect | `agents/android/compose-navigation/` | Android | Generates and reviews type-safe routes, nested graphs, deep links, and back-stack behavior |
| Android Memory Leak Analyzer | `agents/android/memory-leak-analyzer/` | Android | LeakCanary traces and heap-retention reports → root cause, fix, and verification |
| Crash Log Analyzer | `agents/android/crash-analyzer/` | Android / iOS | Parses crash logs → root cause + fix |
| Swift Code Reviewer | `agents/ios/swift-reviewer/` | iOS | Reviews Swift/SwiftUI for memory safety and idiomatic patterns |
| Flutter Widget Generator | `agents/flutter/widget-generator/` | Flutter | Generates Dart widget code from plain English |
| RN Performance Optimizer | `agents/react-native/performance-optimizer/` | React Native | Finds re-render bottlenecks and bridge overhead |
| Unity Shader Generator | `agents/unity/shader-generator/` | Unity | Produces HLSL/ShaderLab shaders from a visual description |
| Unreal Blueprint Advisor | `agents/unreal/blueprint-advisor/` | Unreal | Blueprint → C++ migration and logic advice |
| AppForge | `agents/cross-platform/appforge/` | All | Rough app idea → PRD → tasks → QA → Play Store launch prep |
| Mobile Memory | `agents/cross-platform/mobile-memory/` | All | Mobile knowledge graph + context preservation across AI tools |
| Release Notes Generator | `agents/cross-platform/release-notes-generator/` | All | Git commits → user-facing release notes |
| CI/CD Pipeline Generator | `agents/cross-platform/ci-cd-generator/` | All | Generates GitHub Actions / Bitrise / Fastlane configs |
| Store Listing Writer | `agents/cross-platform/store-listing-writer/` | All | Play Store / App Store descriptions optimised for ASO |
| Mobile Harness | `agents/cross-platform/mobile-harness/` | All | Guide beginners from idea and stack choice through one-task implementation, verification, device proof, and memory |

---

## Mobile MCP QA

Use `skills/cross-platform/mobile-mcp-qa.md` and `workflows/mobile-mcp-qa.md` when a user wants device, emulator, or simulator QA through Mobile MCP. This belongs after implementation, during APPFORGE UI match review, full QA, launch readiness, or screenshot validation.

## Android ANR Investigation

Use `skills/android/anr-investigation.md` when a user provides an Android ANR trace, Play Console cluster, Crashlytics ANR, `ApplicationExitInfo`, or related source code. The skill requires evidence-based thread, lock, binder, and timeout analysis before recommending a fix.

Use `agents/android/anr-investigation/agent.md` when a full Android ANR investigation is needed, including deterministic report output, corrected code, and verification steps.

## Android Memory Leak Investigation

Use `skills/android/memory-leak-investigation.md` when a user provides a LeakCanary trace, heap-retention report, memory-growth reproduction, or lifecycle-related code. Follow the strong-reference path from the GC root and identify the first app-controlled reference with incorrect lifetime.

Use `agents/android/memory-leak-analyzer/agent.md` when a full Android memory leak investigation is needed, including deterministic report output, corrected code, and verification steps.

## Clean Code and Security Gates

Use `skills/cross-platform/clean-code-audit.md` when a user asks for app structure, clean code, model separation, architecture boundary, or maintainability review across a feature or full app.

Use `skills/cross-platform/security-audit.md` for complete app security audits before release, especially when auth, payments, storage, deep links, WebViews, permissions, or sensitive data are involved. Use `skills/shared/security-scan.md` only for quick inline scans.

Use `skills/cross-platform/prd-verification.md` when a user asks whether an implementation matches the approved PRD, design plan, task acceptance criteria, tests, screenshots, or Mobile MCP evidence. Use it inside Mobile Harness and APPFORGE before marking a task complete.

Use `skills/cross-platform/mobile-memory-search.md` when a user needs to resume from local Mobile AI Agents memory, search project history, or inject relevant context from `.mobile-ai-agents/memory/`. When using Mobile Harness for multi-session work, capture durable decisions and next actions with `npx mobile-ai-agents memory capture` when terminal access is available.

## Release Process

For npm releases, follow `docs/release-process.md`. Do not run `npm publish` manually. Update `package.json`, commit, create a local `vX.Y.Z` tag, push `main`, then push the tag so GitHub Actions publishes npm.

---

## How to Create a New Agent

1. Copy `templates/agent-template.md` into `agents/<platform>/<your-agent-name>/agent.md`
2. Fill in every section — **do not leave placeholders**
3. The **Example** section is mandatory: one real input → one real output
4. Open a GitHub issue using the `New Agent` template before large work
5. Submit a PR — see `CONTRIBUTING.md`

**Minimum bar for a merged agent:**
- System prompt is under 600 tokens (keeps it usable in constrained sessions)
- Output format is deterministic and parseable
- Example is real code, not toy pseudocode

---

## How to Create a New Skill

Skills are smaller than agents — they are reusable prompt modules that can
be composed together or embedded inside agents.

1. Copy `templates/skill-template.md` into `skills/<platform>/<skill-name>.md`
2. A skill has: purpose, inputs, the prompt module itself, and usage notes
3. Keep skills focused on one concern (e.g., "detect coroutine scope leaks",
   not "review entire file")

---

## Conventions Codex Should Follow in This Repo

When Codex is helping with this repo, follow these rules:

**Naming**
- Agent folders: `kebab-case` (e.g., `code-reviewer`, `crash-analyzer`)
- Agent file: always named `agent.md`
- Skill files: `kebab-case.md`
- Prompt files: `kebab-case.md`

**System prompts**
- Written in second person ("You are a senior Android engineer…")
- State the exact output format the agent must produce
- Never exceed 600 tokens for the system prompt section alone
- End with: "Output MUST follow the exact format specified. Do not add extra sections or omit any section."

**Severity levels (for review agents)**
- `CRITICAL` — causes crashes, memory leaks, data loss, security issues
- `WARNING` — technical debt, bad practice, will cause pain at scale
- `INFO` — minor improvement, style, optional enhancement

**Tested with**
- Always note which model(s) the agent was validated on (e.g., Codex Sonnet 4.6)
- If an agent degrades on smaller models, note it

---

## Platform-Specific Notes

### Android
- Assume MVVM + Clean Architecture unless the agent specifies otherwise
- Prefer `StateFlow` + `collectAsStateWithLifecycle` over `LiveData` in new agents
- Flag `GlobalScope`, direct `!!` assertions, and repository-in-ViewModel as CRITICAL
- Compose agents: check `remember`, `LaunchedEffect`, `derivedStateOf` usage

### iOS
- Assume Swift 5.9+ and SwiftUI unless specified
- Flag retain cycles, force unwraps, and MainActor misuse

### Flutter
- Assume Dart 3.x, null safety enabled
- Flag `setState` in large widgets, missing `const` constructors

### React Native
- Flag bridge calls in hot paths, missing `useMemo`/`useCallback`

---

## Contributing

See `CONTRIBUTING.md` for the full guide.

Short version:
- Every agent needs a working example — no placeholders
- Run your agent against at least 2 real files before submitting
- If you are updating an existing agent, note which model you tested on

---

## Questions / Discussion

Open a GitHub Discussion or Issue. PRs are always welcome.
