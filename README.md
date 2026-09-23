# Mobile AI Agents

**The complete AI dev team for mobile engineers.**

19 personality-driven agents · 53 composable skills · 16 end-to-end workflows
Android · iOS · Flutter · React Native · Kotlin Multiplatform · Unity · Unreal

[![npm](https://img.shields.io/npm/v/mobile-ai-agents?color=CB3837&label=npm)](https://www.npmjs.com/package/mobile-ai-agents)
[![npm downloads](https://img.shields.io/npm/dm/mobile-ai-agents?color=CB3837)](https://www.npmjs.com/package/mobile-ai-agents)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/salmanashraf/mobile-agency?style=social)](https://github.com/salmanashraf/mobile-agency/stargazers)
[![Platform](https://img.shields.io/badge/platforms-Android%20%7C%20iOS%20%7C%20Flutter%20%7C%20RN%20%7C%20KMP%20%7C%20Unity%20%7C%20Unreal-brightgreen)](#core-loops-and-platform-plugins)

[Installation Guide](docs/installation.md) · [Core Loops](docs/core-loops.md) · [mobile-karpathy](mobile-karpathy.md) · [Wiki](https://github.com/salmanashraf/mobile-agency/wiki) · [Getting Started](docs/getting-started.md) · [Contributing](CONTRIBUTING.md)

> AI agents, skills, and Loop Engineering workflows for building, testing, reviewing, and shipping Android, iOS, Flutter, React Native, Unity, and Unreal apps.

**What Are Mobile AI Agents?**

![Mobile Harness Loop Engineering preview](https://github.com/user-attachments/assets/3e51426a-d2d9-41d3-b668-48d4c751f20c)

Mobile AI Agents is a ready-to-use AI engineering system for mobile apps, hybrid apps, and games. Instead of learning every platform from scratch or writing the same prompts again and again, you install the agents, skills, and workflows, then use them to plan, build, review, test, and ship real Android, iOS, Flutter, React Native, Kotlin Multiplatform, Unity, and Unreal projects.

Bring the idea. Mobile AI Agents brings the mobile team: product planning, architecture review, feature development, clean-code audits, security checks, performance analysis, UI verification, device QA, release prep, and store growth.

Mobile AI Agents is built around **Loop Engineering** and a **mobile-karpathy** mindset: define the goal once, then let the system keep moving through planning, implementation, code audit, security review, UI verification, device QA, reporting, and context saving. The aim is to reduce manual work and repeated manual prompting so developers can focus on product decisions, architecture tradeoffs, credentials, and final approval.

---
## Install

New to AI coding tools? Start with the step-by-step [Installation Guide](docs/installation.md).

Starting from a fresh app idea? Generate the starter docs first:

```bash
npx mobile-ai-agents start
```

This asks a few beginner-friendly questions and creates `PRD.md`, `DESIGN.md`, `TASKS.md`, `ROADMAP.md`, and `MOBILE_MEMORY.md` in your project.

Fast install path:

```bash
npx mobile-ai-agents install
```

This installs Mobile AI Agents for Claude Code. For Cursor, Windsurf, GitHub Copilot, Codex, platform-only installs, and troubleshooting, see [docs/installation.md](docs/installation.md).

Common installs:

| I use... | Run this |
|---|---|
| Claude Code | `npx mobile-ai-agents install` |
| Cursor | `npx mobile-ai-agents install --tool cursor` |
| Windsurf | `npx mobile-ai-agents install --tool windsurf` |
| GitHub Copilot | `npx mobile-ai-agents install --tool copilot` |
| Codex / OpenAI | `npx mobile-ai-agents install --tool codex` |
| All supported tools | `npx mobile-ai-agents install --tool all` |

Local clone install:

```bash
git clone https://github.com/salmanashraf/mobile-agency
cd mobile-agency
./install.sh --platform android
./install.sh --platform flutter --tool cursor
./install.sh --tool all
```

Existing users can still run the legacy binary name after install:

```bash
npx mobile-agency install
```

---
## How It Works

Mobile AI Agents turns AI coding from one-off prompts into a repeatable mobile engineering loop.

| Step | What Happens | Command |
|---|---|---|
| 1. Start | Turn a raw idea into starter PRD, design, task, roadmap, and memory docs. | `npx mobile-ai-agents start` |
| 2. Install | Add the agents, skills, and workflows to your AI coding tool. | `npx mobile-ai-agents install` |
| 3. Open your app | Use it inside an Android, iOS, Flutter, React Native, KMP, Unity, or Unreal project. | Claude Code · Cursor · Windsurf · Copilot · Codex |
| 4. Run the loop | Tell Mobile Harness to continue from the generated docs. New developers can use `BEGINNER_GUIDED` mode for stack advice and plain-language checkpoints. | `/mobile-harness` |
| 5. Build with gates | The loop plans, implements, reviews architecture, checks security, audits performance, verifies UI, and runs QA. | `@MOBILE-HARNESS` |
| 6. Continue later | Project context, decisions, reports, and next tasks are saved so work can continue across sessions. | Mobile Memory |

For focused work, use a specialist directly:

```text
//mobile-harness Create Habit Tracker App
@AXIOM review HomeViewModel.kt
@CRASHER analyze crash.log
/flutter-review lib/home_screen.dart
/perf-audit startup
/security-audit release
```

---

## Who It Helps

| Role | How Mobile AI Agents Helps |
|---|---|
| Senior developers | Delegates repeatable review, debugging, release, and QA work while keeping output tied to platform-specific standards and evidence. |
| Architects and tech leads | Turns product goals into PRDs, tasks, architecture checks, security gates, UI verification, and release readiness reports that teams can review. |
| Fresh joiners and new AI users | Provides a guided path from idea to implementation, with clear questions, examples, checklists, and safe defaults instead of a blank AI chat. |

The goal is a practical mobile engineering loop: plan the feature, build one task at a time, audit the code, run tests, verify the UI, test on a simulator or device, save context, and continue later without losing project memory.

---

## Core Loops and Platform Plugins

Mobile AI Agents is organized around core engineering loops, then extended with platform-specific plugins. Start with the loop that matches your current problem, then apply the Android, iOS, Flutter, React Native, Kotlin Multiplatform, Unity, or Unreal expertise needed for your app.

```text
Core Loops: Planning -> Architecture -> Development -> Performance -> Security -> Testing -> Release -> Growth -> Maintenance
Platform Plugins: Android · iOS · Flutter · React Native · Kotlin Multiplatform · Unity · Unreal
```

| Core Loop | What It Handles | Best Starting Point |
|---|---|---|
| Planning | Idea discovery, PRD, roadmap, task breakdown | `@APPFORGE`, `/grill-mobile`, `/feature-slice` |
| Architecture | System design, clean code, module boundaries, model separation | `@AXIOM`, `/clean-code-audit`, platform reviewers |
| Development | Feature implementation, UI build, refactor, code review | `@MOBILE-HARNESS`, `@FIGMA`, `/mobile-app-design`, platform builders |
| Performance | Startup, ANR, memory leaks, frame drops, battery, network, app size | `@PERF`, `@FREEZE`, `@RETAINER`, `/perf-audit`, [Performance Loop](docs/performance-loop.md) |
| Security | OWASP, secrets, auth, storage, deep links, WebView, permissions | `@SENTINEL`, `/security-audit`, `/security-scan` |
| Testing | Unit tests, UI tests, accessibility, PRD checks, device QA | `/mobile-mcp-qa`, TDD skills, accessibility audit |
| Release | CI/CD, signing, release notes, rollout, store checklist | `@PIPELINE`, `@SCRIBE`, `/release-prep` |
| Growth | ASO, store listing, screenshots, monetization | `@LAUNCHPAD`, `/store-listing` |
| Maintenance | Crash triage, context memory, issue planning, regression checks | `@CRASHER`, Mobile Memory, Mobile Flight Recorder, issue-to-agent workflow |

Security and performance are built into the loop before release. They are not optional cleanup steps.

Full guide: [docs/core-loops.md](docs/core-loops.md)

Performance guide: [docs/performance-loop.md](docs/performance-loop.md)

---

## See It In Action

`/mobile-harness` running Loop Engineering — one flow for planning, building, testing, UI verification, and release checks:

https://github.com/user-attachments/assets/c98d4468-d56d-41ce-b545-7d9fdc43e9d2

`/flutter-review` on a real Flutter project — prioritized findings, zero setup:

https://github.com/user-attachments/assets/427422db-b6b1-4e93-96d0-ad5dd2843f53

`@AXIOM` reviewing Android Kotlin/Compose code — Clean Architecture, lifecycle leaks, coroutine misuse, and Compose anti-patterns:

https://github.com/user-attachments/assets/ee8bbd61-9c64-47bf-a9b3-7812cc12412c

More context: [AXIOM discussion](https://github.com/salmanashraf/mobile-agency/discussions/5)

---

## Start Here

Not sure where to begin? Pick your situation:

| I want to… | Use this |
|---|---|
| Debug a crash | `@CRASHER` + paste your stacktrace |
| Review Android code | `@AXIOM` + paste your Kotlin file |
| Design Compose navigation | `@NAVIGATOR` + list screens and flows |
| Review Flutter code | `/flutter-review` + paste your Dart file |
| Optimize a slow screen | `/perf-audit` + describe the screen |
| Test on a device or emulator | `/mobile-mcp-qa` + provide app id and flow |
| Build, test, and verify a feature | `@MOBILE-HARNESS` + approved PRD/design/tasks |
| Prepare a release | `/release-prep` |
| Generate release notes | `@SCRIBE` + paste your git log |
| Plan an app without implementing it | `@APPFORGE` + answer the discovery questions |
| Build a first app with guided stack selection | `@MOBILE-HARNESS` in `BEGINNER_GUIDED` mode |
| Build an approved app plan through device proof | `@MOBILE-HARNESS` |

---

## Before vs After

### Android — Memory Leak

| | |
|---|---|
| **Input** | `HomeViewModel` holding a `Context` reference |
| **Agent** | `@AXIOM` |
| **Output** | `CRITICAL: Context leak via ViewModel — replace with ApplicationContext or use WeakReference` |
| **Result** | Leak eliminated before PR merge |

### Android — ANR

| | |
|---|---|
| **Input** | Network call on main thread in `onCreate()` |
| **Agent** | `@AXIOM` |
| **Output** | `CRITICAL: Blocking IO on main thread — move to viewModelScope.launch(Dispatchers.IO)` |
| **Result** | ANR fixed with coroutine scope and dispatcher |

### Flutter — Widget Review

| | |
|---|---|
| **Input** | `HomeScreen` with setState on a 400-line widget |
| **Agent** | `/flutter-review` |
| **Output** | 9 ranked findings: draft hydration in build(), ScrollController leak, missing semanticLabels, touch targets below 48dp |
| **Result** | Findings fixed before merge, accessibility score improved |

---

## Why Mobile AI Agents?

| | Generic AI prompt repos | Mobile AI Agents |
|---|---|---|
| Platform knowledge | Generic | Android · iOS · Flutter · React Native · Unity · Unreal |
| Agent personalities | None | 19 named specialists with opinions |
| Real workflows | No | 16 end-to-end processes |
| Real examples | Toy pseudocode | Production code input/output pairs |
| Installable | Copy-paste | `npx mobile-ai-agents install` |
| Severity levels | None | CRITICAL · WARNING · INFO |
| Slash commands | No | 53 composable skills |

---

## Agent Roster

### Platform Agents

| Agent | Platform | Personality | Mission |
|---|---|---|---|
| **AXIOM** | Android | Battle-scarred architect. Zero tolerance for GlobalScope. Has survived 3 Jetpack migrations. | Reviews Kotlin/Compose for Clean Architecture, leaks, and anti-patterns |
| **NAVIGATOR** | Android | Back-stack cartographer. Every destination has a type and every pop has a reason. | Generates and reviews type-safe Compose navigation, nested graphs, deep links, and bottom navigation |
| **RETAINER** | Android | Heap detective. Follows every strong reference until the guilty owner confesses. | LeakCanary and heap-retention reports to exact owner, fix, and verification plan |
| **FREEZE** | Android | Main-thread forensic analyst. Every freeze has a blocking chain. | ANR traces, Play Console clusters, and thread dumps to root cause, fix, and verification |
| **SWIFT** | iOS | Elegant, memory-safety obsessed. Will shame your retain cycles. | Reviews Swift/SwiftUI for memory safety, concurrency, and idiomatic patterns |
| **DART** | Flutter | Pixel-perfect widget obsessive. Counts rebuilds like a miser counts coins. | Reviews Flutter for rebuild efficiency, state management, and performance |
| **BRIDGE** | React Native | JSI evangelist. Tracks every bridge crossing like a border guard. | Finds bridge bottlenecks, re-renders, and New Architecture migration paths |
| **FORGE** | Unity | Game systems architect. Frame budget is sacred. | Reviews C# for GC pressure, Update() abuse, and draw call inefficiency |
| **UNREAL** | Unreal Engine | Blueprint-to-C++ enforcer. Every Tick() must earn its place. | Blueprint optimization, C++ migration, and Tick() abuse |

### Cross-Platform Agents

| Agent | Personality | Mission |
|---|---|---|
| **CRASHER** | Forensic investigator. Nothing escapes. | Crash log → root cause → concrete fix, all platforms |
| **SENTINEL** | Paranoid by design. Every input is malicious until proven otherwise. | OWASP Mobile Top 10 security audit |
| **APPFORGE** | End-to-end product lead. Practical, launch-focused, allergic to vague MVPs. | Rough app idea → PRD → tasks → QA → Play Store launch prep |
| **MOBILE-HARNESS** | Principal delivery lead. Trusts evidence, not vibes. | Autonomous top-level orchestrator for planning, build, memory, tests, UI verification, Mobile MCP QA, and launch |
| **MOBILE MEMORY** | Project memory that survives sessions. | Mobile knowledge graph + context preservation across any AI tool |
| **LAUNCHPAD** | ASO-obsessed conversion scientist. | Play Store + App Store copy, keywords, screenshot brief |
| **PIPELINE** | Automation purist. If it's done manually twice, it's a pipeline waiting to exist. | GitHub Actions / Bitrise / Fastlane configuration |
| **PERF** | Frame-rate zealot. Carries a stopwatch everywhere. | Profile slow screens → concrete optimization plan |
| **SCRIBE** | User-first writer. Translates git commits into things humans understand. | Git log → polished release notes |
| **FIGMA** | Pixel-perfect or it didn't happen. | Figma spec → Compose / SwiftUI / Flutter / RN code |

---

## Skills Library

36 focused prompt modules — use inline or compose with agents.

### Android
| Skill | What It Does |
|---|---|
| `/anr-investigation` | Evidence-first Android ANR classification, root cause, fix, and verification |
| `/android-tdd` | Red-green-refactor loop for JUnit5 + Compose UI tests |
| `/compose-review` | Recomposition audit before PR |
| `/compose-migration` | XML layouts → Jetpack Compose |
| `/kotlin-modernize` | Old Kotlin → modern idioms |
| `/memory-leak-investigation` | LeakCanary reference-path and lifecycle ownership analysis |
| `/proguard-rules` | R8/ProGuard rules from your dependency list |

### iOS
| Skill | What It Does |
|---|---|
| `/ios-tdd` | XCTest TDD loop for Swift/SwiftUI |
| `/swiftui-review` | View lifecycle + memory audit + unnecessary redraws |
| `/swift-concurrency` | Completion handlers → async/await safely |
| `/xcode-warnings` | Explains and fixes Xcode warnings in plain English |

### Flutter
| Skill | What It Does |
|---|---|
| `/flutter-tdd` | Widget test + unit test + Bloc test loop |
| `/flutter-review` | Widget tree audit, const constructors, state management |
| `/widget-extract` | Extracts oversized build() into reusable components |
| `/dart-modernize` | Pre-null-safety Dart → Dart 3.x patterns |

### React Native
| Skill | What It Does |
|---|---|
| `/rn-tdd` | Jest + React Native Testing Library loop |
| `/rn-review` | Bridge calls audit + re-render profiling |
| `/new-arch-migrate` | Step-by-step New Architecture migration |
| `/expo-optimize` | Expo config + OTA + bundle size audit |

### Gaming
| Skill | What It Does |
|---|---|
| `/unity-tdd` | NUnit + Unity Test Runner (EditMode + PlayMode) |
| `/shader-gen` | Plain English → HLSL/ShaderLab shader |
| `/game-perf` | Frame budget audit + draw call optimizer |
| `/blueprint-to-cpp` | Unreal Blueprint → C++ with explanation |

### Cross-Platform
| Skill | What It Does |
|---|---|
| `/grill-mobile` | 20 questions before any mobile code is written |
| `/mobile-app-design` | Lovable/Stitch-style mobile UI generation, redesigns, and full app reskins |
| `/crash-triage` | Paste stacktrace → root cause → fix |
| `/perf-audit` | Slow screen → systematic profiling guide |
| `/clean-code-audit` | App-wide clean code, model separation, and architecture boundary audit |
| `/security-audit` | Complete mobile app security audit for release readiness |
| `/prd-verification` | Check implementation, UI evidence, tests, and reports against PRD/design/tasks |
| `/store-listing` | Conversation → ASO-optimized listing copy |
| `/feature-slice` | Epic → independently shippable tickets |
| `/release-prep` | Full release checklist from freeze to store |
| `/accessibility-audit` | WCAG 2.1 AA, reskin contrast, and semantic color-token migration review |
| `/api-versioning` | API deprecation strategy for mobile clients |
| `/deeplink-debug` | Diagnoses broken deep links across Android and iOS |
| `/mobile-mcp-qa` | Run AI-assisted QA on iOS/Android devices, simulators, and emulators |
| `/mobile-memory-save` | Checkpoint your session — resume on any AI tool instantly |
| `/mobile-memory-graph` | Build a mobile knowledge graph from your codebase files |
| `/mobile-memory-search` | Search local Mobile AI Agents memory and inject relevant context |

---

## Workflows

16 end-to-end processes that chain agents and skills together.

| Workflow | What It Covers |
|---|---|
| `feature-ship` | Ticket → /grill-mobile → /feature-slice → implement → review → test → PR |
| `crash-to-fix` | Crash alert → CRASHER → fix → regression test → deploy |
| `app-launch` | Release build → SENTINEL → PERF → LAUNCHPAD → SCRIBE → /release-prep → store |
| `new-screen` | Figma spec → FIGMA → implement → review → performance check |
| `ci-setup` | PIPELINE → generate config → secrets → test → document |
| `release-cycle` | Feature freeze → CRASHER → SENTINEL → SCRIBE → /release-prep → staged rollout |
| `perf-sprint` | Baseline → /perf-audit → fix → re-measure → document |
| `game-level` | Design doc → FORGE/UNREAL → /shader-gen → /game-perf → /unity-tdd → playtest |
| `new-project-setup` | /grill-mobile → architecture → CI → security baseline → test infrastructure |
| `mobile-flight-recorder` | End-of-session context → update `MOBILE_AGENCY_CONTEXT.md` → capture bugs, device setup, decisions, and next action |
| `mobile-memory-workflow` | Mobile Memory: restore context → capture decisions → generate `MOBILE_MEMORY.md` → hand off across AI tools |
| `issue-to-agent` | GitHub issue → classify → route to agents/skills → implementation and verification plan |
| `device-proof-report` | Mobile MCP evidence → screenshots, assertions, bugs, and pass/fail proof |
| `appforge-workflow` | App idea → PRD → design plan → tasks → implementation gates → QA → Play Store |
| `mobile-mcp-qa` | Install/launch app → inspect UI → run flows → capture screenshots → QA report |
| `mobile-harness` | Approved task → implementation → tests → UI match → Mobile MCP QA → report |

---

## Release Process

npm publishing is handled by GitHub Actions from git tags. Do not run `npm publish` manually.

```bash
# 1. bump package.json version, for example 1.0.19
git add package.json
git commit -m "Release v1.0.19"

# 2. create and push the release tag
git tag v1.0.19
git push origin main
git push origin v1.0.19
```

GitHub Actions publishes npm after the tag push. Full guide: [docs/release-process.md](docs/release-process.md)

---

## APPFORGE — Idea to Store

APPFORGE turns a rough mobile app idea into a small, shippable MVP plan and Play Store launch package.

```
@APPFORGE
1. Discovery        → refined ideas + best MVP recommendation
2. PRD              → PRD.md
3. Free design plan → screens, wireframes, design system, states
4. Task breakdown   → TASKS.md + DEPENDENCIES.md + ROADMAP.md
5. Implementation   → one approved subtask at a time
6. UI match review  → layout, spacing, colors, accessibility
7. Full QA          → QA_REPORT.md + launch readiness score
8. Store prep       → PLAYSTORE_LISTING.md + SCREENSHOT_PLAN.md + RELEASE_CHECKLIST.md
```

APPFORGE does not write code until the PRD, design plan, and task breakdown are approved. It pairs with AXIOM, SWIFT, DART, and BRIDGE for platform review, then LAUNCHPAD and `/release-prep` for store launch.

Mobile MCP fits the QA stage next: use it for emulator, simulator, or real-device automation once the app is ready for flow testing.

---

## Mobile MCP — Device QA Automation

Mobile MCP gives Mobile AI Agents a device automation layer for iOS and Android simulators, emulators, and real devices.

```
/mobile-mcp-qa
1. List devices
2. Install or launch app
3. Capture screenshot + UI elements
4. Tap, type, swipe, rotate, restart
5. Verify happy path and edge cases
6. Produce MOBILE_MCP_QA_REPORT.md
```

Use it inside APPFORGE Stage 7 Full QA, UI match review, launch readiness checks, and screenshot validation. Full guide: [docs/mobile-mcp.md](docs/mobile-mcp.md)

### Device Proof Reports

Use `device-proof-report` after `/mobile-mcp-qa` when you need evidence that survives beyond the chat. It turns Mobile MCP actions, screenshots, element snapshots, crashes/logs, accessibility notes, and assertions into `DEVICE_QA_REPORT.md`.

This helps teams prove that a build was installed, launched, tested on a named device, and checked against expected behavior. Use it for PR handoff, release gates, Mobile Harness reports, screenshot validation, and any bug fix where "works on my machine" is not enough.

```text
device-proof-report
1. Read Mobile MCP screenshots and actions
2. Record device, OS, app id, build, commit, and orientation
3. Map each PASS/FAIL/BLOCKED result to evidence
4. List crashes, accessibility notes, performance notes, and bugs
5. Produce DEVICE_QA_REPORT.md with next fixes
```

---

## Mobile Harness — Top-Level Orchestrator

Mobile Harness is the Loop Engineering orchestrator for Mobile AI Agents. It can start from a rough app idea or an existing codebase, then coordinate APPFORGE, Mobile Memory, platform reviewers, tests, UI verification, Mobile MCP QA, accessibility, performance, security, release prep, and store/growth work.

Use it when you want to define the goal once and have the system keep moving through the app-building loop without repeating the same manual prompts at every stage.

Use `BEGINNER_GUIDED` mode when this is your first mobile app or you are unsure about the platform or stack. Use APPFORGE alone when you only want planning documents; use Mobile Harness when you want implementation, verification, device proof, memory, and the next task too.

### What It Runs

```text
Goal
-> PLAN: choose profile/stack and create or read PRD.md + ROADMAP.md
-> DESIGN: approve DESIGN.md
-> TASK: select one small item from TASKS.md
-> IMPLEMENT: change only that task
-> VERIFY: review, build, test, and check the PRD
-> DEVICE PROOF: run Mobile MCP QA when available
-> MEMORY: update MOBILE_MEMORY.md and the report
-> NEXT ACTION: continue, fix, or stop at a human gate
```

Beginner prompt:

```text
Use MOBILE-HARNESS in BEGINNER_GUIDED mode. I have an app idea but I am not sure which platform or stack to use. Recommend one with reasons, create PRD.md, DESIGN.md, TASKS.md, DEPENDENCIES.md, ROADMAP.md, and MOBILE_MEMORY.md, then stop for approval before coding.
```

### First Questions It Should Ask

Mobile Harness now asks the questions that prevent thin or wrong output:

```text
1. New app idea or existing codebase?
2. Platform and stack?
3. Delivery profile?
   A. Smallest MVP
   B. Demo-grade MVP
   C. Production-ready MVP
4. Design direction?
   Clean utility, polished consumer, playful gamified, premium wellness,
   dense dashboard, enterprise/admin, kids/education, game-like, or custom reference.
5. Existing PRD/design/tasks/dependencies/memory?
6. Build/test command?
7. Device/emulator/simulator available?
8. Done criteria?
```

For video, marketing, or social demos, choose:

```text
Delivery Profile: Demo-grade MVP
Design direction: Playful gamified, polished consumer, or another clear visual style.
```

Demo-grade mode requires seeded data, multiple visible screens/states, a screenshot plan, and a UI polish pass. It should not stop at a technically correct but boring two-screen app.

### Run It

In Claude Code, install Mobile AI Agents, open your app project, then run:

```
/mobile-harness
```

For a full explicit prompt, use:

```
@MOBILE-HARNESS

Use Mobile AI Agents Loop Engineering to build this app from idea to verified MVP.

App idea: <your app idea>
Platform: <Android | iOS | Flutter | React Native>
Tech stack: <your stack>

Delivery Profile: Demo-grade MVP
Design direction: <clean utility | polished consumer | playful gamified | premium wellness | dense dashboard | enterprise/admin | custom reference>

Before building, ask only the clarification questions needed to avoid wrong assumptions.
After clarification, run the full loop:
1. Planning
2. Architecture
3. Development
4. Performance review
5. Security audit
6. Testing plan
7. UI/device verification
8. Release checklist
9. Growth/store listing draft
10. Save project context

Do not ask me to repeat the idea at each stage.
Do not skip stages.
Keep changes scoped.
Create or update project files as needed.
At the end, produce MOBILE_HARNESS_REPORT.md with build, tests, PRD verification, UI match, device QA, and next action.
```

### Example Demo Prompt

```text
@MOBILE-HARNESS

Use Mobile AI Agents Loop Engineering to build a demo-grade Android app.

App idea: Habit Pulse — an offline habit tracker where users add habits, mark today complete, see streaks, and review progress.
Platform: Android
Tech stack: Kotlin + Jetpack Compose + Room
Delivery Profile: Demo-grade MVP
Design direction: Playful gamified, polished consumer app. Colorful but clean. Streaks, progress, rewards, cards, dashboard, and screenshot-ready seeded data.

Ask clarification first if needed, then run the full loop without asking me to repeat the idea.
```

Full guide: [docs/mobile-harness.md](docs/mobile-harness.md)

---

## Mobile Memory — Never Lose Context

When tokens run out or you switch AI tools, your entire session context — architectural decisions, agent findings, code in progress — vanishes. Mobile Memory captures durable project context locally and can generate a portable `MOBILE_MEMORY.md` handoff file.

```
mobile-ai-agents memory init        → creates local project memory
mobile-ai-agents memory capture     → saves decisions, findings, progress, and next actions
mobile-ai-agents memory search      → searches project memory
mobile-ai-agents memory checkpoint  → generates MOBILE_MEMORY.md for handoff
```

For local persistent memory in a project:

```bash
npx mobile-ai-agents memory init
npx mobile-ai-agents memory capture --type decision --text "Use Room for offline persistence"
npx mobile-ai-agents memory search persistence
npx mobile-ai-agents memory inject
npx mobile-ai-agents memory checkpoint
```

This stores raw local memory in `.mobile-ai-agents/memory/`, keeps sensitive event history out of git by default, and generates `MOBILE_MEMORY.md` when you want a portable handoff.

Works across Claude Code, Cursor, Windsurf, ChatGPT, and Gemini. Integrates with every Mobile AI Agents agent — AXIOM findings, CRASHER analysis, and LAUNCHPAD copy are all preserved in the same file.

Inspired by Graphify's token reduction approach, built for mobile architecture. Up to 80× token reduction on large mobile projects vs reading raw files.

Claude slash commands are now named `/mobile-memory`, `/mobile-memory-save`, `/mobile-memory-graph`, and `/mobile-memory-search`.

### Quick Save With Claude Code

Use `/mobile-memory-save` when you are inside a long AI session and want a fast handoff file without setting up the full local memory store.

```text
/mobile-memory-save
```

Then provide the current project state:

```text
PROJECT: Habit Pulse
PLATFORM: Android
CURRENT TASK:
Building habit tracker MVP with list, add habit, streak tracking.

DECISIONS:
- Use Room for offline storage.
- Use MVVM with StateFlow.
- Keep UI simple for demo.

PROGRESS:
- Done: habit list screen and add habit dialog.
- In progress: persistence and restart test.
- Blocked: none.

CODE STATE:
MainActivity.kt has current UI. Habit data is still in memory.

NEXT ACTION:
Add Room HabitEntity, HabitDao, and repository, then persist created habits across app restart.
```

The skill returns a compact `MOBILE_MEMORY.md` document. Save it in the app project root, then a future AI session can read it and continue from `NEXT ACTION`.

Use this rule of thumb:

| Need | Use |
|---|---|
| Fast one-time checkpoint inside chat | `/mobile-memory-save` |
| Searchable project memory over days/weeks | `npx mobile-ai-agents memory init/capture/search/checkpoint` |
| Resume a new session from saved context | `/mobile-memory` or `Read MOBILE_MEMORY.md and continue` |

Full guide: [docs/mobile-memory.md](docs/mobile-memory.md)

---

## The Viral File

**[mobile-karpathy.md](mobile-karpathy.md)** — 4 rules that stop AI coding agents shipping broken mobile apps.

Add it to your project's `CLAUDE.md`. Share it independently. It's designed to travel.

```
Rule 1 — Ask the API level before assuming
Rule 2 — Check for existing platform components first
Rule 3 — Never touch what wasn't asked
Rule 4 — Performance is a feature, not an afterthought
```

---

## Real Examples

Every agent ships with a real worked example — production code in, structured findings out.

| Example | Input | Output |
|---|---|---|
| Android review | [`examples/android-code-review/input.kt`](examples/android-code-review/input.kt) | [`output.md`](examples/android-code-review/output.md) |
| Crash triage | [`examples/crash-triage/input.txt`](examples/crash-triage/input.txt) | [`output.md`](examples/crash-triage/output.md) |
| Flutter review | [`examples/flutter-review/input.dart`](examples/flutter-review/input.dart) | [`output.md`](examples/flutter-review/output.md) |
| Store listing | [`examples/store-listing/input.md`](examples/store-listing/input.md) | [`output.md`](examples/store-listing/output.md) |
| New screen workflow | [`examples/new-screen-workflow/figma-spec.md`](examples/new-screen-workflow/figma-spec.md) | [`output.kt`](examples/new-screen-workflow/output.kt) |
| App idea to store | [`agents/cross-platform/appforge/agent.md`](agents/cross-platform/appforge/agent.md) | Stage-gated discovery, PRD, design, tasks, QA, and store prep |

---

## Multi-Tool Support

| Tool | How to Use |
|---|---|
| Claude Code | `npx mobile-ai-agents install` |
| Cursor | `npx mobile-ai-agents install --tool cursor` |
| Windsurf | `npx mobile-ai-agents install --tool windsurf` |
| GitHub Copilot | Paste agent system prompt into Copilot instructions |
| Codex / OpenAI | Use agents as system prompts via API or CLI |
| Local repo | `git clone` + `./install.sh` |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

- Every agent needs a personality, not just a function
- Every agent needs a real worked example using production code
- Run your agent against at least 2 real files before submitting
- Skills must have a slash command name
- Workflows must list every agent and skill used, step by step

---

## Community

- [GitHub Discussions](https://github.com/salmanashraf/mobile-agency/discussions) — share your output, ask questions, show and tell
- [Issues](https://github.com/salmanashraf/mobile-agency/issues) — bug reports, new agent requests

If Mobile AI Agents saved you time, a star helps others find it.
[![GitHub Stars](https://img.shields.io/github/stars/salmanashraf/mobile-agency?style=social)](https://github.com/salmanashraf/mobile-agency/stargazers)

---

*Built for mobile engineers who ship real apps.*
