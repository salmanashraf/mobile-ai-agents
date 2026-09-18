# Mobile Dev Skill Agents — Wiki

> Complete reference for using, understanding, and contributing to the toolkit.

---

## Table of Contents

1. [What Is This Repo?](#1-what-is-this-repo)
2. [Installation](#2-installation)
3. [Three Resource Types](#3-three-resource-types)
4. [How to Use an Agent](#4-how-to-use-an-agent)
5. [Tool-by-Tool Guides](#5-tool-by-tool-guides)
6. [Platform-by-Platform Agent Guide](#6-platform-by-platform-agent-guide)
7. [How Skills Work](#7-how-skills-work)
8. [How Prompts Work](#8-how-prompts-work)
9. [Device Proof Reports](#9-device-proof-reports)
10. [Mobile Flight Recorder](#10-mobile-flight-recorder)
11. [Input Format Reference](#11-input-format-reference)
12. [Output Format Reference](#12-output-format-reference)
13. [Contributing a New Agent](#13-contributing-a-new-agent)
14. [FAQ](#14-faq)

---

## 1. What Is This Repo?

**Mobile Dev Skill Agents** is a toolkit of ready-to-use AI instructions for mobile and game developers. It is not a library, not a framework, and not a SaaS product. It is a collection of carefully written text files that tell an AI assistant exactly how to help you.

**The three core ideas:**

- **Agents** — Full analysis tools. You paste code or data in a defined format; you get structured, typed output back. Every agent has a purpose, an input format, an output format, and a tested example.
- **Skills** — Lightweight modules. Paste a skill into any session to add one focused analysis capability. Compose multiple skills together.
- **Prompts** — One-shot helpers. Single-purpose prompts for common tasks — unit test generation, migration guides, widget creation.

**Supported AI tools:** Claude Code, Cursor, ChatGPT, GitHub Copilot, Windsurf, or any instruction-following LLM.

---

## 2. Installation

For first-time setup, use the dedicated [Installation Guide](installation.md). It explains which command to run for Claude Code, Cursor, Windsurf, GitHub Copilot, and Codex.

Fast path:

```bash
npx mobile-ai-agents install
```

Common installs:

| I use... | Run this |
|---|---|
| Claude Code | `npx mobile-ai-agents install` |
| Cursor | `npx mobile-ai-agents install --tool cursor` |
| Windsurf | `npx mobile-ai-agents install --tool windsurf` |
| GitHub Copilot | `npx mobile-ai-agents install --tool copilot` |
| Codex / OpenAI | `npx mobile-ai-agents install --tool codex` |

---

## 3. Three Resource Types

### Agents (`agents/`)

A full specification with:
- `README.md` — purpose, quick start, input format preview, links to examples
- `agent.md` — the complete spec: input format, output format, system prompt
- `example-input.md` — a real, paste-ready input with variations
- `example-output.md` — the verified output the agent produces on that input

**When to use:** You want a structured, repeatable analysis with typed output — code review, crash report, performance audit, screen generation.

### Skills (`skills/`)

A single `.md` file containing a focused prompt module:
- Purpose and when to use
- The skill prompt text (paste into any session)
- One concrete example
- Notes on composing with other skills

**When to use:** You want to add one specific capability to a session without the full agent structure. Skills are composable — paste multiple together for broader coverage.

### Prompts (`prompts/`)

A single `.md` file for a one-shot task:
- The raw prompt text with a `[PASTE YOUR CODE HERE]` placeholder
- One worked example
- Variations for related use cases

**When to use:** Quick, single-purpose tasks — "generate a unit test for this class", "explain this Flow chain", "generate a Compose layout".

---

## 4. How to Use an Agent

### Step 1 — Choose the right agent

| I want to... | Use this agent |
|---|---|
| Review a Kotlin/Compose file | `agents/android/code-reviewer` |
| Debug an Android crash log | `agents/android/android-crash-analyzer` |
| Generate an Android Compose screen | `agents/android/compose-screen-builder` |
| Review Compose recomposition / state | `agents/android/compose-ui-reviewer` |
| Review a Swift/SwiftUI file | `agents/ios/swift-reviewer` |
| Debug an iOS crash report | `agents/ios/crash-analyzer` |
| Generate a Flutter widget | `agents/flutter/widget-generator` |
| Build a full Flutter BLoC feature | `agents/flutter/bloc-feature-builder` |
| Audit React Native performance | `agents/react-native/performance-optimizer` |
| Generate a Unity shader | `agents/unity/shader-generator` |
| Review an Unreal Blueprint | `agents/unreal/blueprint-advisor` |
| Scan code for security vulnerabilities | `agents/cross-platform/security-scanner` |
| Audit a UI for accessibility | `agents/cross-platform/accessibility-auditor` |
| Write release notes from git log | `agents/cross-platform/release-notes-generator` |
| Generate a CI/CD pipeline | `agents/cross-platform/ci-cd-generator` |
| Write App Store / Play Store copy | `agents/cross-platform/store-listing-writer` |

### Step 2 — Open the agent folder

Every agent folder has four files. Start with `README.md` for the quick start. Open `agent.md` for the full system prompt and input format.

### Step 3 — Apply the system prompt

Copy the text inside the `## System Prompt` code block in `agent.md`. This is what you paste into your AI tool of choice before submitting your code.

### Step 4 — Prepare your input

Use the `## Input Format` table in `agent.md` to structure your input. Most agents follow this pattern:

```
PLATFORM: <value>
VERSION: <value>
FILE_PATH: <relative path>
CODE:
<paste the code here>
```

Fields marked **Required** must be filled. Optional fields improve the output but can be omitted.

### Step 5 — Review the output

The agent returns output in the exact structure defined by `## Output Format`. Every section is labelled. Copy-paste the corrected code snippets directly into your editor.

---

## 5. Tool-by-Tool Guides

### Claude Code

**How agents load:** `CLAUDE.md` at the repo root is read automatically whenever Claude Code is opened in this directory. It contains the agent index and platform conventions.

**How to run an agent:**
```
# In the Claude Code chat:
Use the agent at agents/android/android-crash-analyzer/agent.md to analyze this crash:
[paste crash log]
```

Or reference the example file:
```
Use the agent at agents/android/code-reviewer/agent.md to review this file:
@examples/android/ProfileViewModel.kt
```

Full guide: [`docs/getting-started.md`](getting-started.md)

---

### Cursor

**How agents load:** `.cursorrules` at the repo root is read automatically. It contains the full agent index, severity level definitions, and platform conventions. Every Cursor Chat session in this repo already knows the agents.

**Cursor Chat (single file):**
```
@agents/android/code-reviewer/agent.md
Review this ViewModel for Clean Architecture violations: [paste code]
```

**Cursor Composer (apply fixes):**
```
@agents/android/android-crash-analyzer/agent.md @crash.txt
Analyze this crash and apply the fix to the relevant file.
```

**Multi-file review:**
```
@ProfileViewModel.kt @ProfileRepository.kt @ProfileUseCase.kt
Review the full data flow for Clean Architecture violations using the code-reviewer agent.
```

Full guide: [`docs/cursor-integration.md`](cursor-integration.md)

---

### ChatGPT

**Method 1 — Manual paste (any tier):**
1. Open `agents/<platform>/<name>/agent.md`
2. Copy the `## System Prompt` block
3. Paste as your first message in a new chat
4. Follow with your code using the input format

**Method 2 — Custom GPT (recommended for teams):**
A ready-made Custom GPT system prompt is in `docs/chatgpt-integration.md`. It routes to the right agent automatically based on what you describe. One GPT covers all 17 agents.

**Method 3 — Assistants API:**
```python
import openai
client = openai.OpenAI()
assistant = client.beta.assistants.create(
    name="Android Code Reviewer",
    instructions=open("agents/android/code-reviewer/agent.md").read(),
    model="gpt-4o",
)
```

Full guide: [`docs/chatgpt-integration.md`](chatgpt-integration.md)

---

### GitHub Copilot (VS Code)

**How agents load:** `.github/copilot-instructions.md` is read when you use `@workspace` in Copilot Chat. It contains all agent rules in a condensed format.

**Usage:**
```
@workspace Review this file using the Android Code Reviewer rules:
#file:ProfileViewModel.kt
```

**Copilot Edits (apply inline):**
Select the problematic code → Cmd+I → describe the fix using agent terminology:
```
Fix the GlobalScope leak and remove the direct UserRepository instantiation
```

Full guide: [`docs/vscode-copilot-integration.md`](vscode-copilot-integration.md)

---

## 6. Platform-by-Platform Agent Guide

### Android

#### Android Crash Analyzer (`agents/android/android-crash-analyzer/`)

**Paste:** Full logcat output, Firebase Crashlytics export, ANR trace, or LeakCanary report.

**Best practice:** Always fill `USER_ACTION` — it is the single most useful field for lifecycle crashes ("User tapped Back while the photo was uploading" narrows the root cause immediately).

**Supported crash types:** NullPointerException, IllegalStateException, GlobalScope coroutine crashes, Fragment lifecycle crashes (requireContext after detach), RecyclerView position errors, OOM, ANR, LeakCanary memory leak chains.

**Output:** 9 sections — Crash Summary, Root Cause, Why This Happens, Risk Level, Recommended Fix, Updated Code, Edge Cases, Testing Checklist, Prevention Tips.

---

#### Android Code Reviewer (`agents/android/code-reviewer/`)

**Paste:** A complete Kotlin class — ViewModel, Repository, UseCase, Composable, Fragment, or Activity.

**Best practice:** Set `FILE_PATH` accurately — the agent infers the architectural layer from the path (a file in `.../viewmodel/` is reviewed as a ViewModel; `.../data/repository/` is reviewed as a Repository).

**Reviews:** Clean Architecture layer boundaries, `GlobalScope` usage, LiveData vs StateFlow, dependency injection, `!!` force-unwrap, Compose recomposition, coroutine exception handling, testability.

---

#### Android Compose Screen Builder (`agents/android/compose-screen-builder/`)

**Paste:** A plain-English screen description — what it displays, what the user can do, what data it receives, navigation.

**Output:** Three complete Kotlin files — `UiState.kt`, `ViewModel.kt`, `Screen.kt` — plus NavHost registration snippet and Gradle dependencies.

**Design principles enforced:** Single sealed `UiState`, `collectAsStateWithLifecycle`, Material 3 theming, accessible semantics, `@Preview` for light + dark.

---

#### NAVIGATOR — Android Compose Navigation Architect (`agents/android/compose-navigation/`)

**Use it for:** Generating or reviewing type-safe Navigation Compose routes, nested feature graphs, bottom navigation, deep links, authentication redirects, and back-stack behavior.

**Output:** Route types, graph-builder code, explicit back-stack rules, deep-link rules, navigation tests, and severity-ranked findings in review mode.

**Design principles enforced:** `@Serializable` routes on Navigation 2.8+, stable ID arguments, screen callbacks instead of passing `NavController`, saved tab state, and documented `popUpTo` behavior.

---

#### Android Compose UI Reviewer (`agents/android/compose-ui-reviewer/`)

**Use this instead of the Code Reviewer when:** The screen is slow to scroll, there's visual flickering, or you're seeing unexpected recompositions in React DevTools Profiler.

**Reviews:** `SimpleDateFormat` in `items { }`, missing `key` on `LazyColumn`, `remember` keys, `derivedStateOf` vs `remember`, state hoisting correctness, `LaunchedEffect` key correctness.

---

### iOS

#### iOS Crash Analyzer (`agents/ios/crash-analyzer/`)

**Requirement:** The crash report must be **symbolicated**. Unsymbolicated reports show hex addresses that cannot be analyzed. Symbolicate first in Xcode Organizer, or using `symbolicatecrash` in Terminal.

**Supported crashes:** `EXC_BAD_ACCESS` (SIGSEGV/SIGBUS), force-unwrap nil, `SIGABRT`, watchdog termination (0x8badf00d), Main Thread Checker violations, SwiftUI state crashes.

**Output:** Same 9-section format as the Android Crash Analyzer.

---

#### Swift Code Reviewer (`agents/ios/swift-reviewer/`)

**Set `SWIFT_VERSION: 6.0`** to enable strict concurrency checks (Sendable, actor isolation errors).

**Reviews:** `[weak self]` vs `[unowned self]` in escaping closures, `@Published` mutation off Main thread, force-unwrap removal, async/await migration candidates, `@StateObject` vs `@ObservedObject` correctness, protocol-based testability.

---

### Flutter

#### Flutter BLoC Feature Builder (`agents/flutter/bloc-feature-builder/`)

**Choose `PATTERN: cubit`** for 90% of features. Use `PATTERN: bloc` only when you need event history, event transformations (`throttle`/`debounce`), or event replay.

**What gets generated:** Domain entities, repository interface + implementation, Dio data source with `DioException` handling, `Either<Failure, T>` error propagation, Cubit or BLoC with sealed state classes, page with `BlocBuilder`, `bloc_test` stubs, `get_it` DI registration, `pubspec.yaml` additions.

---

#### Flutter Widget Generator (`agents/flutter/widget-generator/`)

**Be specific in `DESCRIPTION`.** "A list of orders" → mediocre output. "A paginated LazyColumn of order cards showing order ID, status badge (color-coded Delivered/Processing/Cancelled), total amount, and date" → excellent output.

**Guarantees:** Null-safe Dart 3.x, `const` constructors, `Theme.of(context)` for all colors/styles, `Semantics` for accessibility, `AnimationController` disposed in `dispose()`.

---

### React Native

#### RN Performance Optimizer (`agents/react-native/performance-optimizer/`)

**Set `ARCH: new`** for apps running React Native 0.74+ New Architecture (JSI/Fabric). Set `ARCH: old` for Bridge-based apps.

**Tip:** Include `PROFILER_DATA` (React DevTools or Flipper output) to rank findings by measured render time instead of heuristic estimates.

**Finds:** Inline functions/objects in JSX, missing `useCallback`/`useMemo`/`React.memo`, FlatList missing `keyExtractor`/`getItemLayout`, animations on JS thread, bridge calls in render paths.

---

### Unity

#### Unity Shader Generator (`agents/unity/shader-generator/`)

**Always specify `RENDER_PIPELINE`** — URP, HDRP, and Built-in use completely different include paths and APIs. A URP shader will not compile in a Built-in pipeline project.

**Set `TARGET_PLATFORM: mobile`** to enforce: ≤2 texture samples per fragment, `half` precision throughout, no dynamic branching.

**Output:** A complete `Shader "Custom/..."` file with `Properties` block, `SubShader`, vertex + fragment stages, and a Material Setup guide for the Inspector.

---

### Unreal Engine

#### Unreal Blueprint Advisor (`agents/unreal/blueprint-advisor/`)

**Describe the Blueprint in steps** — list what each event graph node does in plain English. The agent cannot read node graph images.

**Tick is the #1 issue.** Any logic in Event Tick that runs every frame for many actors is expensive. The agent flags this and provides timer-based and event-driven alternatives.

**C++ output:** The agent generates a complete `.h` + `.cpp` pair for the highest-priority migration candidates, using UE5 API conventions (`TObjectPtr`, `UPROPERTY`, `UFUNCTION`, `FTimerHandle`).

---

### Cross-Platform

#### Mobile Security Scanner (`agents/cross-platform/security-scanner/`)

**Use `SECURITY_FOCUS: all`** for a full OWASP scan. Use a specific focus (`secrets`, `storage`, `network`, `webview`, `permissions`, `crypto`) to narrow the scan to one area.

**Run on:** API client files, auth/session managers, any file that touches `SharedPreferences`, `UserDefaults`, `WebView`, or cryptographic operations.

**Rotate any secret found immediately** — assume it is already compromised if it was in version control history.

---

#### Accessibility Auditor (`agents/cross-platform/accessibility-auditor/`)

**Always test with real assistive technology** on a physical device — TalkBack (Android) and VoiceOver (iOS) — after applying fixes. Emulator behavior differs.

**Specify the exact platform:** `Android-Compose`, `Android-XML`, `iOS-SwiftUI`, `iOS-UIKit`, `Flutter`, or `React-Native`. The fixes differ significantly between frameworks.

For a reskin or theme migration, run `/accessibility-audit` with the supported themes, theme/token source, affected screens, and resolved foreground/background pairs. It maps by semantic role rather than old hex value, computes WCAG AA contrast for light and dark modes, and reports role collisions where one palette value was incorrectly reused for text, borders, fills, disabled content, or status states. Pair it with `/mobile-app-design` before implementation and `/mobile-mcp-qa` for device screenshots afterward.

```text
/accessibility-audit
PLATFORM: React Native
SUPPORTED_THEMES: light, dark
Audit the Settings reskin and token migration. Report failed pairs with their ratio,
required ratio, semantic role, theme/state, and recommended token.
```

---

## 7. How Skills Work

A skill is a focused prompt module — shorter than a full agent, covering one concern, composable with others.

### Using a skill standalone

```
# 1. Open the skill file
skills/ios/swift-review.md

# 2. Copy the ## Skill Prompt section

# 3. Paste it into any LLM session as the first message

# 4. Paste your code and ask for a review
```

### Composing multiple skills

```
[paste skills/ios/swift-review.md skill prompt]
[paste skills/ios/swiftui-state.md skill prompt]

Now review this SwiftUI ViewModel: [paste code]
```

The LLM applies both skill sets simultaneously — ARC + memory rules plus SwiftUI state rules.

### Skills vs. Agents

| | Skills | Agents |
|---|---|---|
| Output format | Flexible — whatever the LLM produces | Structured — typed sections, verdict |
| Setup | Paste one block | Paste system prompt + follow input format |
| Best for | Quick inline review, composing capabilities | Structured analysis, repeatable output, team workflows |

---

## 8. How Prompts Work

Prompts are the simplest resource type — a complete, ready-to-paste prompt with a `[PASTE YOUR CODE HERE]` slot.

```
# Example usage:
# 1. Open prompts/android/generate-unit-test.md
# 2. Copy the entire ## Prompt section
# 3. Replace [PASTE YOUR CLASS HERE] with your Kotlin class
# 4. Paste the whole thing into any LLM
```

Prompts are one-shot — they don't require a system prompt, don't require a structured input format, and don't produce a structured output format. Use them when you want a quick result without setup.

---

## 9. Device Proof Reports

Device Proof Reports turn Mobile MCP QA evidence into a durable `DEVICE_QA_REPORT.md` file. Use them after `/mobile-mcp-qa` when you need to prove that a mobile build was installed, launched, tested, screenshotted, and verified on a named device, emulator, or simulator.

### What it helps with

- PR handoff: reviewers can see exact screenshots, actions, assertions, and failures.
- Release gates: teams can verify launch, core flows, restart, rotation, and edge cases before store submission.
- Bug fixes: every PASS or FAIL references evidence instead of relying on memory.
- Mobile Harness: `DEVICE_QA_REPORT.md` can be attached to `MOBILE_HARNESS_REPORT.md`.
- Future AI sessions: Mobile Memory can preserve device, build, screenshots, result, and next action.

### When to run it

Run `/mobile-mcp-qa` first to interact with the app and capture screenshots. Then run `device-proof-report` to package the evidence into a structured report.

```text
/mobile-mcp-qa
PLATFORM: Android
APP_ID: com.example.invoice
BUILD_PATH: app/build/outputs/apk/debug/app-debug.apk
FLOW:
1. Launch app.
2. Create invoice.
3. Restart app.
4. Confirm invoice persists.

device-proof-report
Use the Mobile MCP evidence from this QA pass and produce DEVICE_QA_REPORT.md.
```

### What the report proves

`DEVICE_QA_REPORT.md` records:

- Device, OS version, orientation, app id, build, and commit
- Whether the build installed and launched
- Every action performed and the target used
- Assertions mapped to screenshot or UI evidence
- Screenshots and what each screenshot proves
- Crashes, logs, accessibility notes, and performance notes
- Issues found with severity, repro steps, and suggested fixes
- Pass/fail/blocked summary and next fixes

### Best practices

- Use stable screenshot filenames such as `01-home.png` and `04-after-restart.png`.
- Do not mark a result PASS unless it references evidence.
- For sensitive apps, use sandbox accounts and redact tokens, PII, payment data, and health data.
- For failed flows, include the exact repro step and expected behavior.
- After the report is created, save the result with `/mobile-memory-save`.

---

## 10. Mobile Flight Recorder

Mobile Flight Recorder is the end-of-session workflow for preserving project context across AI tools, teammates, and long-running mobile work. It creates or updates `MOBILE_AGENCY_CONTEXT.md`, a stable project flight recorder that sits beside `MOBILE_MEMORY.md`.

Run it at the end of every meaningful session, before switching tools, before tokens run out, after device QA, or before opening a PR.

```text
Run Mobile Flight Recorder. Update MOBILE_AGENCY_CONTEXT.md and MOBILE_MEMORY.md if useful. Capture decisions, files changed, tests run, known bugs, device setup, links, and exactly one Next Recommended Action. Do not include secrets.
```

### What it captures

- App goal, platform, stack, repo, and active branch
- Architecture and implemented features
- Current task, pending tasks, known bugs, and risks
- Test/build commands that actually ran
- Design source and Mobile MCP/device setup
- Agent findings, decisions, changed files, evidence, and links
- Exactly one next recommended action

### Resume prompt

Use this in any AI tool:

```text
Read MOBILE_AGENCY_CONTEXT.md and MOBILE_MEMORY.md if present. Continue from Next Recommended Action. Inspect changed files before editing and update the flight recorder before stopping.
```

### How it works with Mobile Memory and MRECALL

- Read `MOBILE_AGENCY_CONTEXT.md`, `MOBILE_MEMORY.md`, `MRECALL.md`, and `.mobile-ai-agents/memory/index.md` when present.
- Use `npx mobile-ai-agents memory capture` for decisions, findings, code state, and next actions when terminal access is available.
- Use `npx mobile-ai-agents memory checkpoint` or `/mobile-memory-save` to generate the compact `MOBILE_MEMORY.md` handoff.
- Use `MOBILE_AGENCY_CONTEXT.md` for the broader project state and `MOBILE_MEMORY.md` for compact session continuity.

See [Mobile Memory](mobile-memory.md) for the complete guide.

---

## 11. Input Format Reference

Most agents use a consistent key-value input format:

```
FIELD_NAME: value
MULTI_LINE_FIELD:
<content starts on the next line and can span many lines>
```

**Common fields:**

| Field | Used In | Notes |
|---|---|---|
| `PLATFORM` | Android, iOS agents | Always required |
| `KOTLIN_VERSION` | Android agents | Affects Kotlin 2.0 K2 compiler rules |
| `SWIFT_VERSION` | iOS agents | `6.0` enables strict concurrency |
| `COMPOSE_VERSION` | Android Compose agents | Set to `none` for View-based UI |
| `FILE_PATH` | All code review agents | Required — agent infers architectural layer from path |
| `CODE` / `CRASH_LOG` / `GIT_LOG` | Varies | The main content block; always last |
| `USER_ACTION` | Crash analyzers | Highly recommended — critical for lifecycle crashes |
| `RELATED_CODE` | Crash analyzers | Optional but significantly improves output |

---

## 12. Output Format Reference

### Code Review Agents (Android, iOS)

```
REVIEW SUMMARY
==============
File: <path>  Layer: <inferred layer>  Issues Found: N
Critical: N   Warning: N   Info: N

FINDINGS
--------
[CRITICAL] Line N — <title>
  Problem : <why this is wrong>
  Fix     : <corrected code snippet>

[WARNING] / [INFO] ...

OVERALL VERDICT: PASS / NEEDS WORK / REWRITE
```

### Crash Analyzer Agents (Android, iOS)

```
## Crash Summary
## Root Cause
## Why This Happens
## Risk Level
## Recommended Fix
## Updated Code
## Edge Cases
## Testing Checklist
## Prevention Tips
```

### Performance Optimizer (React Native)

```
PERFORMANCE AUDIT
=================
Issues Found: N   High: N   Medium: N   Low: N

[HIGH] <title>
  Impact      : <estimated re-renders or FPS impact>
  Problem     : <root cause>
  Refactored  : <corrected TypeScript>

ESTIMATED IMPROVEMENT
Before: N re-renders  After: N re-renders
```

### Generator Agents (Widget Generator, Screen Builder, Shader Generator, BLoC Feature Builder)

Each produces complete, compilable code organized by file with usage examples and notes.

### Accessibility Auditor

```
ACCESSIBILITY AUDIT
===================
Issues Found: N   Critical: N   High: N   Medium: N   Low: N

[CRITICAL] <title>
  Element  : <component>
  TalkBack/VoiceOver announces: <current>
  Should announce: <correct>
  WCAG     : <criterion>
  Fix      : <corrected code>

OVERALL VERDICT: PASS / NEEDS WORK / INACCESSIBLE
```

---

### Device Proof Report

```
# Device QA Report

## Summary
Result: PASS | FAIL | BLOCKED
Platform:
Device:
OS Version:
Orientation:
App ID:
Build:
Commit:
Flow:

## Build And Launch
| Check | Evidence | Result |
|---|---|---|

## Actions Performed
| Step | Action | Target | Evidence | Result |
|---|---|---|---|---|

## Assertions
| ID | Expected Behavior | Evidence | Result |
|---|---|---|---|

## Screenshots
| Screenshot | Screen | Proves |
|---|---|---|

## Issues Found
| ID | Severity | Screen | Issue | Repro Step | Suggested Fix |
|---|---|---|---|---|---|
```

---

## 13. Contributing a New Agent

### Before you start

1. Check `agents/` — make sure the agent doesn't already exist
2. Open a GitHub issue using the [New Agent template](../.github/ISSUE_TEMPLATE/new_agent.md)
3. Get a thumbs-up before building — avoid duplicate work

### File structure

Every new agent must have all four files:

```
agents/<platform>/<your-agent-name>/
├── README.md          ← Quick start, supported cases, related agents
├── agent.md           ← Full spec: purpose, input, output, system prompt
├── example-input.md   ← Real input with 2–3 variations
└── example-output.md  ← Verified output from the real input above
```

### Templates

```bash
cp templates/agent-template.md agents/<platform>/<name>/agent.md
```

### Quality bar

An agent is rejected if:
- `example-output.md` contains placeholder text like `<output here>` — it must be the real output from testing the agent
- The system prompt is over 600 tokens — too long for constrained sessions
- The output format is not deterministic — if two runs of the same input produce structurally different output, it's not consistent enough

An agent is accepted if:
- It solves a problem developers actually hit
- The input format is clear enough that a first-time user can fill it correctly
- The output is structured enough to be machine-parseable

### Testing your agent

1. Copy the system prompt into Claude Sonnet 4.6 or GPT-4o
2. Use your `example-input.md` as the input
3. Paste the output into `example-output.md`
4. Run it again with a different input to verify consistency

---

## 14. FAQ

**Q: Which LLM works best?**  
A: Claude Sonnet 4.6 and GPT-4o both produce high-quality structured output for all agents. Smaller models (GPT-4o-mini, Claude Haiku) work for simpler agents (prompts, skills) but may produce less consistent structured output for complex agents (BLoC Feature Builder, CI/CD Generator).

**Q: Can I use these agents with the API?**  
A: Yes. Copy the `## System Prompt` text as the `system` parameter in any OpenAI or Anthropic API call. See `docs/chatgpt-integration.md` for a working Python example.

**Q: My crash log isn't symbolicated — can the agent still help?**  
A: For Android: yes — logcat and Firebase Crashlytics exports are already symbolicated. For iOS: no — the iOS Crash Analyzer requires a symbolicated `.crash` file. Symbolicate in Xcode Organizer first.

**Q: Can I run an agent on multiple files at once?**  
A: Paste them sequentially with `--- FILE: path ---` separators. The agent will analyze each file. For cross-file architecture review, the `agents/android/code-reviewer/` agent can infer layer violations if you paste two related files and ask it to check the boundaries between them.

**Q: The agent output doesn't match the example-output.md exactly. Is that a problem?**  
A: No — LLMs are non-deterministic. The structure (section names, severity labels, format) should match. The specific findings and code snippets will vary based on what the model focuses on. If the structure is consistently wrong, open a bug report.

**Q: How do I add these to my team's workflow?**  
A: Three options — (1) clone the repo and open it in Cursor/Claude Code, (2) copy the Custom GPT instructions from `docs/chatgpt-integration.md` and share the GPT link with your team, (3) add the relevant agent system prompts to your team's `.cursorrules` or Copilot instructions file.

**Q: The agent missed a bug I know is there. What should I do?**  
A: Paste more context — include the full class, not a snippet. Paste related files. If the agent still misses it consistently, open a GitHub issue and we'll improve the system prompt.

**Q: Can I use these commercially?**  
A: Yes. The repo is MIT licensed — free to use, modify, and incorporate into commercial products. Attribution is appreciated but not required.

---

*Last updated: v1.0.25 — August 2026*
