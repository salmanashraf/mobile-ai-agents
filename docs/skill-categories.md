# Skill Categories

This document describes the taxonomy used across agents, skills, and prompts in this repository.

---

## Core Loop Taxonomy

Mobile AI Agents groups skills by the core loop they support:

| Core Loop | What It Covers |
|---|---|
| Planning | Discovery, PRD, roadmap, task breakdown |
| Architecture | Clean code, module boundaries, model separation |
| Development | Feature implementation, UI build, refactor, code review |
| Performance | Startup, ANR, memory, frame, battery, network, app size |
| Security | OWASP, secrets, auth, storage, deep links, WebView, permissions, release hardening |
| Testing | Unit tests, UI tests, accessibility, device QA, PRD verification |
| Release | CI/CD, signing, release notes, rollout, store checklist |
| Growth | ASO, store listing, screenshots, monetization |
| Maintenance | Crash triage, context memory, issue-to-agent, regression checks |

See [core-loops.md](core-loops.md) for the full product model.

---

## Categories

### Code Quality

Reviews, audits, and refactoring suggestions for mobile codebases.

**Platforms:** Android, iOS, Flutter, React Native  
**Examples:** Clean Architecture review, idiomatic language checks, dependency injection audit  
**Agents:** Android Code Reviewer, Swift Code Reviewer

---

### Performance & Optimization

Identifying and fixing performance bottlenecks — frame drops, excessive memory, slow builds, and over-the-wire inefficiency.

**Platforms:** All  
**Examples:** Re-render audit (RN), Compose recomposition, FlatList tuning, APK size reduction, GPU overdraw  
**Agents:** React Native Performance Optimizer

---

### UI & Design

Generating, reviewing, and improving UI code — widgets, components, layouts, animations.

**Platforms:** Flutter, Android (Compose), iOS (SwiftUI), React Native  
**Examples:** Widget generation, layout from description, Lovable/Stitch-style mobile screen design, full app reskins, tab reordering, animation code, dark mode audit  
**Agents:** Flutter Widget Generator, Unity Shader Generator  
**Skills:** `/mobile-app-design`

---

### Testing & Verification

Proving the app matches requirements through tests, device QA, accessibility checks, screenshots, and PRD evidence.

**Platforms:** All

**Examples:** PRD verification, Mobile MCP QA, transformed-file validation, accessibility checks, restart persistence tests

**Skills:** `/prd-verification`, `/mobile-mcp-qa`, `/file-output-qa`, `/accessibility-audit`

---

### Debugging & Crash Analysis

Parsing and explaining crash logs, stack traces, ANRs, and error states.

**Platforms:** Android, iOS  
**Examples:** NPE root cause, symbolicated iOS crash, ANR main thread analysis, OOM tracing  
**Agents:** Crash Log Analyzer  
**Skills:** Crash Analysis

---

### DevOps & Release

CI/CD, deployment pipelines, store submissions, and release management.

**Platforms:** All (Cross-Platform)  
**Examples:** GitHub Actions for Android, Fastlane iOS, release notes from git log, ASO copy  
**Agents:** CI/CD Pipeline Generator, Release Notes Generator, Store Listing Writer

---

### Game Development

Shader authoring, Blueprint logic, game object architecture, and game-specific performance.

**Platforms:** Unity, Unreal Engine  
**Examples:** HLSL/ShaderLab shader generation, Blueprint-to-C++ migration, tick optimization  
**Agents:** Unity Shader Generator, Unreal Blueprint Advisor

---

### Documentation

Auto-generating documentation from code — API docs, inline comments, README files, architecture decisions.

**Platforms:** All  
**Examples:** KDoc generation, Swift DocC comments, README from project structure  
*(Agents coming soon — contributions welcome)*

---

## Tagging Convention

Each agent and skill file uses the following frontmatter tags:

```
**Platform:** Android | iOS | Flutter | React Native | Unity | Unreal | Cross-Platform
**Category:** Code Quality | Performance | UI & Design | Testing | Debugging | DevOps | Game Dev | Documentation
**Complexity:** Low | Medium | High
```

**Complexity** guide:
- **Low** — input is simple (plain text, short code), output is focused (one type of result)
- **Medium** — input requires structured fields, output has multiple sections
- **High** — input is large or requires domain expertise to fill correctly, output has complex interdependent sections
