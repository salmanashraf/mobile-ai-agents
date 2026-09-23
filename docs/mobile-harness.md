# Mobile Harness

Mobile Harness is the top-level orchestrator for Mobile AI Agents. It can start from a rough idea or an existing codebase, then coordinate planning, implementation, tests, UI verification, device QA, memory, and launch preparation.

Use it when you want one AI system to manage the full mobile delivery loop with as little human effort as safely possible, while still using specialized agents and skills underneath.

Choose `BEGINNER_GUIDED` mode if you have only an app idea, do not know the right mobile stack, or want each checkpoint explained in plain language. It uses the same rigorous build and QA gates as the standard harness.

Use APPFORGE alone when you only want planning documents. Use Mobile Harness when you want the plan implemented, verified, tested on a device, saved to memory, and continued task by task.

---

## Mental Model

```text
MOBILE-HARNESS
├── APPFORGE      → idea, PRD, design, tasks, roadmap
├── Mobile Memory → long-term memory across days/weeks
├── AXIOM/SWIFT/DART/BRIDGE → platform code review
├── /mobile-app-design → screens, navigation, redesigns, and reskins
├── /mobile-mcp-qa → emulator/device UI verification
├── /accessibility-audit → accessibility verification
├── /perf-audit or PERF → performance verification
├── CRASHER       → crash/debug investigation
├── LAUNCHPAD     → Play Store listing
├── SCRIBE        → release notes
└── PIPELINE      → CI/CD and build/release automation
```

APPFORGE plans. Mobile Memory remembers. Mobile Harness orchestrates execution and evidence.
Mobile Flight Recorder records the end-of-session handoff so another session can resume from the exact next action.

The fixed loop is:

```text
PLAN -> DESIGN -> TASK -> IMPLEMENT -> VERIFY -> DEVICE PROOF -> MEMORY -> NEXT ACTION
```

---

## Beginner-Guided Start

Mobile Harness asks four simple questions: what the app does and who it serves, whether it targets Android/iPhone/both, which languages you know, and whether you want a learning prototype, polished demo, or production app. It inspects an existing project before recommending a stack.

For a new project, its defaults are native Compose for Android, native SwiftUI for Apple platforms, React Native with Expo for cross-platform TypeScript developers, and Flutter for teams that accept Dart and prioritize consistent custom UI. The recommendation includes reasons and tradeoffs; it is not treated as universally correct.

Before coding it creates:

- `PRD.md` for the user problem and requirements.
- `DESIGN.md` for screens, states, navigation, accessibility, and screenshot proof.
- `TASKS.md` for small independently verifiable work items.
- `DEPENDENCIES.md` for tools, services, keys, and setup.
- `ROADMAP.md` for milestones and deferred scope.
- `MOBILE_MEMORY.md` for decisions, progress, blockers, and the next action.

It stops for approval before the first code change and before credentials, destructive actions, paid services, irreversible migrations, public deployment, or store release.

```text
Use MOBILE-HARNESS in BEGINNER_GUIDED mode.
App idea: A simple meal planner for busy parents.
Target platform: Not sure.
Experience: I know basic TypeScript and this is my first mobile app.
Goal: A polished demo.

Recommend the stack, explain why, create the planning documents, and stop for approval before coding.
```

---

## Autonomy Contract

Mobile Harness should do the work, not assign work back to the user.

It should autonomously:

- Create missing `PRD.md`, `DESIGN.md`, `TASKS.md`, `DEPENDENCIES.md`, `ROADMAP.md`, `MOBILE_MEMORY.md`, QA reports, and launch docs.
- Pick practical MVP defaults when the user gives a rough idea.
- Implement one approved task at a time.
- Run tests, builds, platform review, PRD checks, UI checks, and Mobile MCP QA when available.
- Fix failures inside the current task scope.
- Preserve context so the project can continue across days or weeks.

It should ask the user only for decisions or access it cannot safely infer:

- Business decisions, monetization choices, launch date changes, and MVP scope changes.
- API keys, certificates, app store access, billing, and credentials.
- Paid actions, destructive actions, public releases, and legal/privacy policy ownership.
- Approval before code implementation starts, unless the user has already approved autonomous execution.

---

## Source of Truth

Mobile Harness verifies against docs, not memory:

| Artifact | Required | Used For |
|---|---|---|
| `MOBILE_MEMORY.md` | Required for multi-session work | Current context, decisions, next action |
| `PRD.md` | Required before implementation | Behavior and requirements |
| `DESIGN.md` or design plan | Required before UI work | Layout, states, visual target |
| `TASKS.md` | Required before implementation | Task scope and acceptance criteria |
| `DEPENDENCIES.md` | Required before implementation | Libraries, APIs, env vars |
| `ROADMAP.md` | Required for idea-to-app work | Milestones, sequence, deferred scope, release checkpoints |
| `MOBILE_HARNESS_REPORT.md` | Required after each cycle | Evidence and pass/fail state |

If these docs are missing, Mobile Harness routes to APPFORGE first.

---

## Basic Prompts

Start a new app:

```text
Use MOBILE-HARNESS.
Start from a new app idea and orchestrate APPFORGE, Mobile Memory, implementation, QA, and launch prep.
```

Resume a long-running project:

```text
Use MOBILE-HARNESS.
Read MOBILE_MEMORY.md, PRD.md, DESIGN.md, TASKS.md, and DEPENDENCIES.md.
Continue from NEXT ACTION.
```

Run one approved task:

```text
@MOBILE-HARNESS
MODE: FEATURE_EXECUTION
PLATFORM: Android
STACK: Kotlin, Compose, Hilt, Room
TASK: Implement TASKS.md Task 4, invoice creation form.
TEST_COMMAND: ./gradlew testDebugUnitTest
APP_ID: com.example.invoice
DONE_CRITERIA:
- User can enter client, amount, due date, notes.
- Save button disabled until required fields are valid.
- Saved invoice appears on dashboard after app restart.
- UI matches design within 90%.
```

---

## Report Format

Every run produces:

```text
MOBILE HARNESS REPORT
=====================
Platform:
Task:
Status: PASS | FAIL | BLOCKED
Mode:
Current Loop Stage:
Beginner Checkpoint:
Artifacts Read:
Orchestration State:
Implementation Summary:
Code Review:
Tests:
PRD Verification:
UI Match:
Mobile MCP QA:
Acceptance Criteria:
Memory Update:
Remaining Issues:
NEXT ACTION:
```

---

## Pass Criteria

A task is done only when:

- Acceptance criteria pass
- Tests pass, or skipped tests are explicitly justified
- PRD verification passes with source references
- `/prd-verification` proves implementation, UI evidence, tests, and reports match `PRD.md`, `DESIGN.md`, and `TASKS.md`
- UI match reaches the agreed threshold, default 90%
- Mobile MCP QA passes, or device QA is explicitly unavailable
- No CRITICAL platform-review findings remain
- `MOBILE_MEMORY.md` is updated
- The report contains one concrete `NEXT ACTION`

---

## Video Demo Script

1. Show `MOBILE-HARNESS` in the README.
2. Start with: `Use MOBILE-HARNESS. Build this app idea end to end with autonomous execution.`
3. Show the harness creating or loading `MOBILE_MEMORY.md`.
4. Show it creating `PRD.md`, `DESIGN.md`, `TASKS.md`, and `DEPENDENCIES.md` instead of asking the user to write them.
5. Approve the plan once.
6. Show the harness selecting one task.
7. Show the harness reading artifacts before editing.
8. Show one small code change.
9. Show tests running.
10. Show PRD verification and UI match review.
11. Show `/mobile-mcp-qa` device flow.
12. End on `MOBILE HARNESS REPORT` and updated `MOBILE_MEMORY.md`.
