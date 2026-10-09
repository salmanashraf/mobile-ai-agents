# CLAUDE.md — Mobile AI Agents

> This file is read automatically by Claude Code when the repo is opened.
> It tells Claude how to navigate, use, and contribute to this toolkit.

---

## What This Repo Is

The complete AI dev team for mobile engineers. 19 personality-driven agents, 35 composable
skills, and 13 end-to-end workflows for Android, iOS, Flutter, React Native, Unity, and Unreal.

Each agent has a name, a personality, a mission, and a real worked example. Drop any agent
into Claude Code as a system prompt and it works immediately.

---

## Quick Start

```bash
# Install everything
./install.sh

# Install by platform
./install.sh android
./install.sh ios
./install.sh flutter
```

---

## Repo Map

```
mobile-ai-agents/
├── agents/                   ← 19 personality-driven agents
│   ├── android/axiom/        ← AXIOM (Android architect)
│   ├── android/anr-investigation/ ← FREEZE (ANR investigator)
│   ├── android/compose-navigation/ ← NAVIGATOR (Compose navigation)
│   ├── android/memory-leak-analyzer/ ← RETAINER (memory leaks)
│   ├── ios/swift/            ← SWIFT (iOS engineer)
│   ├── flutter/dart/         ← DART (Flutter specialist)
│   ├── react-native/bridge/  ← BRIDGE (RN optimizer)
│   ├── gaming/
│   │   ├── forge/            ← FORGE (Unity architect)
│   │   └── unreal/           ← UNREAL (Unreal specialist)
│   └── cross-platform/
│       ├── appforge/         ← APPFORGE (idea-to-store)
│       ├── crasher/          ← CRASHER (crash investigator)
│       ├── sentinel/         ← SENTINEL (security auditor)
│       ├── launchpad/        ← LAUNCHPAD (ASO writer)
│       ├── mobile-harness/   ← MOBILE-HARNESS (build/test/verify)
│       ├── mobile-memory/          ← Mobile Memory (context preservation)
│       ├── pipeline/         ← PIPELINE (CI/CD)
│       ├── perf/             ← PERF (performance)
│       ├── scribe/           ← SCRIBE (release notes)
│       └── figma/            ← FIGMA (design-to-code)
├── skills/                   ← 35 composable skill modules
│   ├── android/              ← ANR, memory leak, TDD, Compose review, ...
│   ├── ios/                  ← ios-tdd, swiftui-review, swift-concurrency, ...
│   ├── flutter/              ← flutter-tdd, flutter-review, widget-extract, ...
│   ├── react-native/         ← rn-tdd, rn-review, new-arch-migrate, ...
│   ├── gaming/               ← unity-tdd, shader-gen, game-perf, blueprint-to-cpp
│   └── cross-platform/       ← grill-mobile, crash-triage, perf-audit, ...
├── workflows/                ← 13 end-to-end process guides
├── mobile-karpathy.md        ← 4 rules that prevent AI mobile mistakes (standalone)
├── examples/                 ← Real input/output pairs for each agent
├── templates/                ← Scaffold for new agents / skills / workflows
├── scripts/                  ← install-claude.sh, install-cursor.sh, ...
└── docs/                     ← Extended guides
```

---

## Agent Roster

| Agent | Path | Platform | Mission |
|---|---|---|---|
| **AXIOM** | `agents/android/axiom/` | Android | Clean Architecture + Kotlin + Compose review |
| **FREEZE** | `agents/android/anr-investigation/` | Android | ANR traces + thread dumps + main-thread blocking fixes |
| **NAVIGATOR** | `agents/android/compose-navigation/` | Android | Type-safe Compose routes, graphs, deep links, and back stack |
| **RETAINER** | `agents/android/memory-leak-analyzer/` | Android | LeakCanary traces + heap retention + lifecycle leak fixes |
| **SWIFT** | `agents/ios/swift/` | iOS | Memory safety + SwiftUI + async/await review |
| **DART** | `agents/flutter/dart/` | Flutter | Widget tree efficiency + state management review |
| **BRIDGE** | `agents/react-native/bridge/` | React Native | Bridge calls + re-renders + New Architecture |
| **FORGE** | `agents/gaming/forge/` | Unity | C# performance + frame budget + architecture |
| **UNREAL** | `agents/gaming/unreal/` | Unreal | Blueprint → C++ + performance + GC safety |
| **APPFORGE** | `agents/cross-platform/appforge/` | All | Rough app idea → PRD → tasks → QA → Play Store |
| **MOBILE-HARNESS** | `agents/cross-platform/mobile-harness/` | All | Build and verify mobile work; enterprise mode adds policy gates, risk, rollback, and auditable evidence |
| **CRASHER** | `agents/cross-platform/crasher/` | All | Crash log → root cause → fix |
| **SENTINEL** | `agents/cross-platform/sentinel/` | All | OWASP Mobile Top 10 security audit |
| **Mobile Memory** | `agents/cross-platform/mobile-memory/` | All | Mobile knowledge graph + context preservation |
| **LAUNCHPAD** | `agents/cross-platform/launchpad/` | All | Play Store + App Store ASO-optimized copy |
| **PIPELINE** | `agents/cross-platform/pipeline/` | All | GitHub Actions / Bitrise / Fastlane generation |
| **PERF** | `agents/cross-platform/perf/` | All | Frame budget + profiling + optimization |
| **SCRIBE** | `agents/cross-platform/scribe/` | All | Git log → polished release notes |
| **FIGMA** | `agents/cross-platform/figma/` | All | Figma spec → Compose / SwiftUI / Flutter / RN |

---

## How to Use an Agent

### Option A — Paste the System Prompt

1. Open any `agents/<platform>/<name>/agent.md`
2. Copy the **System Prompt** block
3. Paste it at the start of your Claude Code session
4. Follow the **Input Format**

### Option B — Install and reference

```bash
./install.sh  # copies agents to ~/.claude/agents/
```

Then in any session: "Use the AXIOM agent to review this file: [paste code]"

### Option C — Slash command

Add to your Claude Code config (`~/.claude/settings.json`):

```json
{
  "customSlashCommands": [
    {
      "name": "axiom",
      "description": "AXIOM — Android architect review",
      "prompt": "$(cat agents/android/axiom/agent.md)"
    },
    {
      "name": "crasher",
      "description": "CRASHER — crash log investigation",
      "prompt": "$(cat agents/cross-platform/crasher/agent.md)"
    }
  ]
}
```

---

## How to Create a New Agent

1. Copy `templates/agent-template.md` → `agents/<platform>/<name>/agent.md`
2. Give the agent a **personality** — not just a function, but a character
3. Fill every section — no placeholders
4. The **Example** section is mandatory: one real input → one real output
5. Submit a PR — see `CONTRIBUTING.md`

**Minimum bar for a merged agent:**
- System prompt ≤ 600 tokens
- Output format is deterministic and parseable
- Example uses real code, not toy pseudocode
- Personality is clear in the system prompt

---

## How to Create a New Skill

1. Copy `templates/skill-template.md` → `skills/<platform>/<slug>.md`
2. One skill = one concern (e.g., "detect recomposition issues", not "review entire file")
3. Include a slash command name

---

## How to Create a New Workflow

1. Copy `templates/workflow-template.md` → `workflows/<name>.md`
2. List the agents and skills used
3. Each step must reference a specific agent or skill

---

## Conventions

**Naming**
- Agent folders: personality code name, lowercase (`axiom`, `crasher`, `swift`)
- Agent file: always `agent.md`
- Skill files: `kebab-case.md` with a `/slash-command` name
- Workflow files: `kebab-case.md`

**Agent system prompts**
- Open with the agent's name and personality in first person
- State exact output format
- ≤ 600 tokens
- End: "Output MUST follow the exact format specified. Do not add extra sections or omit any section."

**Severity levels**
- `CRITICAL` — crashes, memory leaks, data loss, security vulnerabilities
- `WARNING` — technical debt, bad practice, will cause pain at scale
- `INFO` — minor improvement, style, optional enhancement

**Tested with**
- Note the model(s) validated on (e.g., Claude Sonnet 4.6)

---

## Platform Notes

### Android
- MVVM + Clean Architecture by default
- StateFlow + collectAsStateWithLifecycle over LiveData in new code
- GlobalScope, !! operators, repository-in-ViewModel = CRITICAL findings

### iOS
- Swift 5.9+, SwiftUI by default
- Retain cycles, force unwraps, MainActor misuse = CRITICAL findings

### Flutter
- Dart 3.x, null safety enabled
- setState in large widgets, missing const constructors = WARNING findings

### React Native
- Check New Architecture compatibility on all new code
- Bridge calls in hot paths = CRITICAL findings

### Unity / Unreal
- Mobile = tight frame budget, measure everything
- Update() / Tick() logic that can be event-driven = WARNING findings

---

## The Viral Files

- `mobile-karpathy.md` — 4 rules that stop AI coding agents making mobile mistakes
  Share this file independently. It has viral potential on its own.

---

## Questions / Contributing

Open a GitHub Discussion or Issue. PRs are always welcome.
See `CONTRIBUTING.md` for the full guide.

## Release Process

For npm releases, follow `docs/release-process.md`. Do not run `npm publish` manually. Update `package.json`, commit, create a local `vX.Y.Z` tag, push `main`, then push the tag so GitHub Actions publishes npm.

## Figma specs and implementation

Use `/figma-mcp-setup` to connect official Figma MCP, `/figma-spec-harvest` to extract source-traced specs, and `/figma-to-implementation` to build in the existing native platform. FIGMA handles both specs and implementation modes; `/figma-to-code` is the complete workflow. Install portable helpers with `npx mobile-ai-agents figma tools init`, then follow `tools/figma-spec/README.md`. Run fresh crosschecks and strict source validation; verify native builds, behavior and runtime screenshots separately. See `docs/figma-mcp.md`.
