# Core Loops and Platform Plugins

Mobile AI Agents is organized as a mobile engineering system, not a prompt list.

The simple model:

```text
Mobile AI Agents

Core Loops
- Planning
- Architecture
- Development
- Performance
- Security
- Testing
- Release
- Growth
- Maintenance

Platform Plugins
- Android
- iOS
- Flutter
- React Native
- Kotlin Multiplatform
- Unity
- Unreal
```

Core loops describe the repeatable work every mobile team has to do. Platform plugins add the exact Android, iOS, Flutter, React Native, Kotlin Multiplatform, Unity, or Unreal expertise needed for that loop.

## Why This Matters

Most AI coding resources start with prompts. Mobile teams start with outcomes:

- What are we building?
- Is the architecture same?
- Does it perform on real devices?
- Is it secure enough to ship?
- Does the UI match the design?
- Did tests and device QA prove it works?
- Can another session continue the work later?

Mobile AI Agents turns those questions into loops that can be run, audited, and repeated.

## Loop Engineering

Loop Engineering means defining the goal once, then letting the system move through the next engineering steps with evidence:

```text
Goal
-> Plan
-> Build
-> Audit
-> Test
-> Verify on device
-> Report
-> Save context
-> Continue
```

The user should not have to manually prompt every stage. The system should stop only for product decisions, credentials, destructive actions, paid services, legal/store ownership, release approval, or blockers it cannot safely resolve.

## Core Loops

| Loop | Purpose | Agents and Skills |
|---|---|---|
| Planning | Turn rough ideas into PRDs, roadmaps, and task slices. | `@APPFORGE`, `/grill-mobile`, `/feature-slice` |
| Architecture | Review system design, module boundaries, model separation, and clean code. | `@AXIOM`, `/clean-code-audit`, platform reviewers |
| Development | Implement one feature slice at a time and keep code scoped. | `@MOBILE-HARNESS`, `@FIGMA`, `/mobile-app-design`, screen builders, code reviewers |
| Performance | Find and fix startup, ANR, memory, frame, battery, network, and size issues. | `@PERF`, `@FREEZE`, `@RETAINER`, `/perf-audit`, `/anr-investigation`, [Performance Loop](performance-loop.md) |
| Security | Audit OWASP risks, secrets, auth, storage, deep links, WebViews, permissions, logs, and release hardening. | `@SENTINEL`, `security-scanner`, `/security-audit`, `/security-scan` |
| Testing | Add unit/UI tests, run device QA, check accessibility, and verify PRD/design match. | TDD skills, `/prd-verification`, `/mobile-mcp-qa`, `/accessibility-audit` |
| Release | Prepare CI/CD, signing, release notes, rollout, and store submission. | `@PIPELINE`, `@SCRIBE`, `/release-prep` |
| Growth | Improve store listing, ASO, screenshots, conversion, and monetization copy. | `@LAUNCHPAD`, `/store-listing` |
| Maintenance | Triage crashes, preserve context, plan issue work, and prevent regressions. | `@CRASHER`, Mobile Memory, Mobile Flight Recorder, crash triage, issue-to-agent workflow |

## Platform Plugins

| Plugin | Current Coverage |
|---|---|
| Android | Kotlin, Java, Compose, Navigation, ANR, memory leaks, crash analysis, TDD, performance, security, release |
| iOS | Swift, SwiftUI, concurrency, networking, persistence, performance, testing, crash analysis |
| Flutter | Dart, widgets, Bloc feature building, review, TDD, modernization |
| React Native | Bridge performance, New Architecture, Expo optimization, review, TDD |
| Kotlin Multiplatform | Target platform plugin for shared Kotlin architecture, model boundaries, persistence, and API strategy |
| Unity | C#, shaders, frame budget, test loop, game performance |
| Unreal | Blueprint advice, C++ migration, performance, game architecture |

## How To Choose

Choose by stage first:

| If You Need To... | Start With |
|---|---|
| Figure out what to build | Planning |
| Decide how the app should be structured | Architecture |
| Build a feature | Development |
| Fix slowness, jank, ANRs, memory leaks, or app size | Performance |
| Prepare for production risk review | Security |
| Prove the app works | Testing |
| Ship to stores | Release |
| Improve downloads or conversion | Growth |
| Resume work later or handle production issues | Maintenance |

Then choose the platform plugin that matches the app.

Example:

```text
Problem: Android app freezes during startup
Loop: Performance
Plugin: Android
Agents/skills: @FREEZE, @PERF, /anr-investigation
Evidence: Play Console ANR trace, startup code, device reproduction
Output: root cause, fix, verification plan, regression check
```

Full Performance Loop guide: [performance-loop.md](performance-loop.md)

## Marketing Position

Use this sentence when explaining the repo:

> Mobile AI Agents gives every mobile team a repeatable loop for planning, building, auditing, testing, releasing, and maintaining apps, with security and performance checks built in.

Short version:

```text
Core Loops: Plan -> Build -> Audit -> Test -> Release -> Monitor
Platform Plugins: Android · iOS · Flutter · React Native · Kotlin Multiplatform · Unity · Unreal
```

## Current Gaps

For conditional embedded AI, backend/cloud, or user-facing phone control, see
[Additional capabilities and intake handoffs](additional-capabilities.md).

The model is intentionally ahead of the full implementation. The strongest next builds are:

- Loop Engineering automation to reduce manual prompting
- `/prd-verification` rollout into Mobile Harness and APPFORGE evidence gates
- Device Proof Reports
- dedicated Security Audit Loop reports
- Kotlin Multiplatform plugin assets
