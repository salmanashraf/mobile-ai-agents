# Changelog

All notable changes to **Mobile Dev Skill Agents** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- `mobile-flight-recorder` workflow for end-of-session handoffs, including `MOBILE_AGENCY_CONTEXT.md` schema, MRECALL/Mobile Memory integration, tool-agnostic resume prompt, docs, and wiki guidance.
- `device-proof-report` workflow announcement and wiki guidance so users know how to turn Mobile MCP screenshots, actions, assertions, logs, and accessibility notes into `DEVICE_QA_REPORT.md`.
- Performance Loop guide for startup, ANR, memory leaks, frame drops, battery, network, app size, slow screens, and regression monitoring, including a deterministic `PERFORMANCE_AUDIT_REPORT.md` format.

### Changed

- Prerelease package versions now publish to the npm `prerelease` dist-tag instead of `latest`.

## [1.0.35] — 2026-09-23

### Changed

- Mobile Harness now includes a `BEGINNER_GUIDED` mode with stack recommendations, beginner-readable planning artifacts, a deterministic eight-stage development loop, plain-language checkpoints, and explicit human stop gates.

## [1.0.34] — 2026-09-18

### Changed

- Expanded `/accessibility-audit` with semantic role-based color-token migration, computed WCAG AA checks across every supported theme and state, invisible-text detection, role-collision reporting, and a dark-mode reskin regression example.

---

## [1.0.0] — 2026-05-29

### First public release

#### Agents (16)

**Android**
- `android-crash-analyzer` — 9-section crash report for Android logs, ANR traces, Firebase Crashlytics, and LeakCanary output
- `code-reviewer` — Kotlin/Compose code review across Clean Architecture, coroutines, DI, and testability
- `compose-screen-builder` — generates a complete Compose screen (ViewModel + StateFlow + Material 3 + Navigation) from a plain-English description
- `compose-ui-reviewer` — Compose-specific review: recomposition scope, `remember`/`derivedStateOf`, `LazyColumn` keys, side effects

**iOS**
- `crash-analyzer` — 9-section crash report for symbolicated iOS `.crash` files (EXC_BAD_ACCESS, force-unwrap, watchdog)
- `swift-reviewer` — Swift/SwiftUI review across ARC, `@MainActor`, async/await, force-unwrap, testability

**Flutter**
- `widget-generator` — generates production Dart widgets from plain-English descriptions
- `bloc-feature-builder` — generates a complete Clean Architecture feature layer: Cubit/BLoC, Repository, Dio, Equatable, test stubs

**React Native**
- `performance-optimizer` — ranks re-render bottlenecks, FlatList issues, and bridge overhead with corrected TypeScript

**Unity**
- `shader-generator` — generates complete `.shader` files (URP / HDRP / Built-in) from visual descriptions

**Unreal Engine**
- `blueprint-advisor` — Blueprint logic analysis with Tick audit, C++ migration candidates, and generated C++ code

**Cross-Platform**
- `accessibility-auditor` — WCAG 2.2 audit across Compose, SwiftUI, Flutter, and React Native
- `ci-cd-generator` — GitHub Actions / Bitrise / Fastlane configs with signing, caching, and secrets reference
- `release-notes-generator` — converts `git log` output into App Store copy, developer changelog, and QA regression notes
- `security-scanner` — OWASP Mobile Top 10 audit with exploitation scenarios and concrete fixes
- `store-listing-writer` — ASO-optimized App Store and Play Store listings with keyword density analysis

#### Skills (14)

- `skills/android/code-review.md` — coroutines, Clean Architecture, Compose
- `skills/ios/swift-review.md` — ARC, retain cycles, `[weak self]`, force-unwrap
- `skills/ios/swiftui-state.md` — `@State`/`@StateObject`/`@ObservedObject` selection
- `skills/ios/networking.md` — URLSession, async/await, HTTP status, certificate pinning
- `skills/ios/unit-testing.md` — Swift Testing vs XCTest, async tests, mocking
- `skills/ios/performance.md` — main thread, Core Data N+1, image decoding
- `skills/ios/data-persistence.md` — UserDefaults vs Keychain vs Core Data vs SwiftData
- `skills/flutter/widget-gen.md` — null-safety, const, theming, accessibility
- `skills/react-native/performance.md` — `useCallback`, `useMemo`, FlatList, animation thread
- `skills/react-native/bridge-audit.md` — bridge calls, synchronous native, JSI migration
- `skills/unity/shader-review.md` — mobile shader budget, half precision, pipeline correctness
- `skills/shared/crash-analysis.md` — crash triage across Android and iOS
- `skills/shared/accessibility-audit.md` — WCAG 2.2 mobile checklist
- `skills/shared/security-scan.md` — OWASP Mobile Top 10 checklist

#### Prompts (22)

Android (5), iOS (4), Flutter (4), React Native (4), Game Dev (5).  
See [`prompts/`](prompts/) for the full list.

#### Tool Integrations

- `.cursorrules` — Cursor AI auto-loads agent index and platform rules
- `CLAUDE.md` — Claude Code auto-loads on repo open
- `.github/copilot-instructions.md` — GitHub Copilot loads via `@workspace`
- `docs/chatgpt-integration.md` — Custom GPT system prompt + Assistants API guide
- `docs/cursor-integration.md` — Cursor Chat and Composer workflows
- `docs/vscode-copilot-integration.md` — Copilot Chat and Copilot Edits guide

#### Documentation

- `docs/wiki.md` — comprehensive reference (agent routing, tool guides, platform tips, FAQ)
- `docs/getting-started.md` — first-time user guide
- `docs/agent-guide.md` — agent anatomy and output format reference
- `docs/releases/release-v1.0.0.md` — full release notes with metrics

---

## Future

### Planned for v1.1.0

- `agents/android/apk-size-analyzer/` — APK/AAB size reduction analysis
- `agents/flutter/state-advisor/` — state management approach advisor
- `agents/cross-platform/feature-reviewer/` — multi-file Clean Architecture review
- `skills/unreal/blueprint-review.md` — Blueprint analysis skill module
- `docs/windsurf-integration.md` — Windsurf IDE integration guide

---

[1.0.0]: https://github.com/salmanashraf/mobile-dev-skills/releases/tag/v1.0.0
