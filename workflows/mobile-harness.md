# Workflow — Mobile Harness

**Type:** Top-level mobile delivery orchestration  
**Agents Used:** MOBILE-HARNESS, APPFORGE, Mobile Memory, AXIOM / SWIFT / DART / BRIDGE, CRASHER, PERF, LAUNCHPAD, SCRIBE, PIPELINE
**Skills Used:** /mobile-app-design, /prd-verification, /mobile-mcp-qa, /accessibility-audit, /perf-audit, /mobile-memory-save, /release-prep, /store-listing

---

## When to Use

Use this workflow when a user wants one orchestrator that can manage the complete mobile app lifecycle: idea, planning, implementation, verification, multi-session memory, device QA, and launch preparation.

Use `BEGINNER_GUIDED` mode when the user is new to mobile development, has only a rough idea, or does not know which platform or stack to choose. Do not create a separate beginner agent: Mobile Harness already owns the full lifecycle and can route planning work to APPFORGE.

Use APPFORGE alone when the requested deliverable stops at discovery, PRD, design, tasks, or roadmap. Use Mobile Harness when the user wants the plan executed and proved on an emulator, simulator, or device.

This workflow is intentionally strict. It prevents the common AI failure mode of building code without proving it matches the product plan, design, and real-device behavior.

The goal is near-zero human effort. MOBILE-HARNESS should do routine product, engineering, QA, documentation, and release-prep work itself. The user should mainly provide the initial goal, approve major gates, and supply credentials or business decisions that cannot be inferred safely.

---

## Autonomy Contract

MOBILE-HARNESS is autonomous by default:

- Create missing docs instead of asking the user to write them.
- Choose practical MVP defaults when requirements are underspecified.
- Generate PRD, design plan, tasks, dependencies, roadmap, QA report, memory, and launch docs.
- Select the next safe task from `TASKS.md`.
- Implement one scoped task at a time.
- Run available tests, linters, builds, reviewers, and Mobile MCP QA.
- Compare behavior against `PRD.md` and UI against the design artifact.
- Fix failures that are inside the current task scope.
- Update `MOBILE_MEMORY.md` so work can resume days or weeks later.

Ask the user only for:

- Product or business decisions that change the MVP.
- Credentials, API keys, certificates, billing, or store account access.
- Paid, destructive, irreversible, or public release actions.
- Legal/privacy policy content that requires the owner.
- Approval before first implementation starts, unless the user has already approved the plan.
- External systems that are unavailable to the harness.

---

## Lifecycle Map

```text
PLAN -> DESIGN -> TASK -> IMPLEMENT -> VERIFY -> DEVICE PROOF -> MEMORY -> NEXT ACTION
```

The eight stages are deterministic. Full QA and launch preparation happen as tasks inside the same loop rather than bypassing it.

---

## Beginner-Guided Defaults

Ask only what cannot be discovered from the repository: app idea and audience, target platform, existing language experience, and delivery goal. `Not sure` is a valid answer.

Recommend one stack with a plain-language explanation and record the tradeoff:

| Need | Recommended Stack |
|---|---|
| Android only | Kotlin + Jetpack Compose |
| iPhone/iPad only | Swift + SwiftUI |
| Android + iOS with TypeScript/JavaScript experience | React Native + Expo + TypeScript |
| Android + iOS with highly consistent custom UI | Flutter + Dart |
| Existing app | Keep the existing stack |

Before implementation, create beginner-readable `PRD.md`, `DESIGN.md`, `TASKS.md`, `DEPENDENCIES.md`, `ROADMAP.md`, and `MOBILE_MEMORY.md`. Explain each document's purpose, keep tasks independently shippable, and give every task acceptance criteria plus a verification command.

At the end of every stage, state:

```text
What happened:
Why it matters:
Decision needed: None | <one explicit request>
What happens next:
```

Stop at these human gates:

- Approval of PRD, design, and task order before the first implementation.
- Product choices that materially change the MVP.
- Credentials, keys, certificates, account access, or private data.
- Destructive operations, irreversible migrations, or deletion of user data/work.
- Paid services, purchases, billing changes, or cost-incurring usage.
- Public deployment, store submission, production rollout, or release approval.

---

## Delivery Profiles

Pick a delivery profile before APPFORGE creates PRD, design, and tasks.

| Profile | Use When | Minimum Bar |
|---|---|---|
| Smallest MVP | Fastest useful app or proof of concept. | Core flow works, tests pass, minimal UI, no avoidable scope. |
| Demo-grade MVP | Video, social demo, investor demo, launch article, or Loop Engineering showcase. | 4+ visible screens/states, seeded sample data, polished UI, screenshot plan, device evidence. |
| Production-ready MVP | Release candidate or serious dogfooding build. | Demo-grade scope plus stricter accessibility, performance, security, crash, privacy, release, and store gates. |

Demo-grade MVP exists to prevent the loop from producing a technically correct but boring app. It should be the default whenever the user says they want to create a video or market the repo.

For Demo-grade MVP, APPFORGE and MOBILE-HARNESS must include:

- A visually strong first launch with sample data or guided empty state.
- At least 4 visible screens/states unless the user approves fewer.
- Dashboard or summary surface where the domain supports it.
- Detail, history, insights, settings, or progress surface where useful.
- Add/edit/delete or equivalent primary interaction.
- Empty, populated, error/validation, and confirmation states when applicable.
- Screenshot plan and recording script.
- UI polish pass before marking the build complete.

---

## Design Direction

Ask for design direction before creating product artifacts:

```text
What design direction should this app use?
A. Clean utility — simple, quiet, task-focused
B. Polished consumer — friendly, modern, app-store ready
C. Playful gamified — colorful, streaks, rewards, motion
D. Premium wellness — calm, spacious, refined
E. Dense dashboard — data-first, productivity-focused
F. Enterprise/admin — structured, compact, operational
G. Custom reference — describe or link the style
```

If the user does not choose, infer the best direction from the app category and delivery profile, then document the assumption in `DESIGN.md`. For Demo-grade MVP, do not default to a plain stock UI unless the user specifically asks for a clean utility style.

`DESIGN.md` must include:

- Design direction and rationale.
- Target audience and emotional tone.
- Visual hierarchy and first-screen goal.
- Color, typography, spacing, iconography, and component style.
- Empty, populated, validation/error, loading, confirmation, and success states when applicable.
- Screenshot and recording plan.

---

## Source of Truth

| Artifact | Required | Owner | Purpose |
|---|---|---|---|
| `MOBILE_MEMORY.md` | Required for multi-session work | Mobile Memory | Context, decisions, current task, next action |
| `PRD.md` | Required before implementation | APPFORGE | Product behavior and requirements |
| Design plan / `DESIGN.md` | Required before UI implementation | APPFORGE | Visual target and UI states |
| `TASKS.md` | Required before implementation | APPFORGE | Task scope and acceptance criteria |
| `DEPENDENCIES.md` | Required before implementation | APPFORGE / PIPELINE | Libraries, APIs, env vars, build constraints |
| `ROADMAP.md` | Recommended | APPFORGE | Milestones and sequencing |
| `MOBILE_HARNESS_REPORT.md` | Required after each cycle | MOBILE-HARNESS | Evidence and pass/fail state |

If any required artifact is missing, MOBILE-HARNESS creates or updates it through APPFORGE before coding.

---

## Stage 1 — Start or Restore

Ask whether this is:

- New app idea
- Existing codebase
- Existing feature in progress
- QA-only pass
- Launch preparation

Ask for delivery profile:

```text
Do you want:
A. Smallest MVP — fastest usable version
B. Demo-grade MVP — polished, video-ready, seeded, and visually complete
C. Production-ready MVP — release-gated with broader hardening
```

If the user already says "demo", "video", "viral", "marketing", or "showcase", choose Demo-grade MVP and document that assumption.

Ask for design direction using the options in the Design Direction section. If the prompt already gives a clear visual reference or audience tone, document the inferred direction and continue.

Then load `MOBILE_MEMORY.md` if present. If no memory file exists and the work is more than a short one-off, create one.

If the user already gave enough context to infer the mode, do not stop for this question. Pick the mode, document the assumption in `MOBILE_MEMORY.md`, and continue.

---

## Stage 2 — Product Planning

If product artifacts are missing, run APPFORGE internally:

1. Discovery
2. `PRD.md`
3. Design plan
4. `TASKS.md`
5. `DEPENDENCIES.md`
6. `ROADMAP.md`

Do not implement until the user approves these artifacts.

Do not ask the user to draft these files. MOBILE-HARNESS owns the first complete version and asks for approval or corrections.

---

## Stage 3 — One-Task Implementation Loop

For each task:

1. Read `MOBILE_MEMORY.md`.
2. Read `PRD.md`.
3. Read design plan.
4. Read `TASKS.md`.
5. Read `DEPENDENCIES.md`.
6. Select exactly one task.
7. Select the narrowest specialist agent or skill and record why it fits the task.
8. Use `/mobile-app-design` first when the task creates or changes screens, navigation, visual identity, or a reskin; then implement only that task.
9. Run platform reviewer.
10. Run the configured build, lint/static-analysis, and test commands. Discover safe platform defaults when commands are missing and record any unavailable check.
11. Verify behavior against `PRD.md`.
12. Verify UI against design.
13. Run `/mobile-mcp-qa` if device automation is available.
14. Produce `DEVICE_QA_REPORT.md` with the `device-proof-report` workflow when screenshots or device proof are required.
15. Write `MOBILE_HARNESS_REPORT.md`.
16. Update `MOBILE_MEMORY.md`.
17. At session end, run `mobile-flight-recorder` to preserve changed files, commands, evidence, blockers, and the next action.

After a task passes, continue to the next safe task automatically when the user has approved autonomous execution for the project. Stop only at human gates defined in the Autonomy Contract.

---

## Stage 4 — PRD Verification

Every acceptance criterion must reference a source:

```markdown
| Criteria | Source | Result | Evidence |
|---|---|---|---|
| Save button disabled until form is valid | PRD.md > Functional Requirements > Invoice Form | PASS | Unit test + screenshot |
```

Never verify against memory or assumptions.

Run `/prd-verification` with `PRD.md`, `DESIGN.md`, `TASKS.md`, `DEPENDENCIES.md`, `MOBILE_MEMORY.md`, changed files, test output, screenshots, and Mobile MCP reports when available. Treat UNKNOWN as not done unless the user explicitly risk-accepts the missing evidence.

---

## Stage 5 — UI Match Review

Compare implementation against the approved design artifact:

- Layout
- Spacing
- Typography
- Colors
- Components
- Responsiveness
- Empty/loading/error states
- Accessibility

Default pass threshold: 90%.

---

## Stage 6 — Mobile MCP QA

Run `/mobile-mcp-qa` when a device, emulator, or simulator is available.

Capture:

- Device name
- App id
- Screen size
- Screenshots
- Element list
- User flow results
- Edge cases
- Accessibility issues
- Restart/rotation results

If Mobile MCP is unavailable, mark this stage `SKIPPED` and provide manual QA steps.

---

## Stage 7 — Full QA and Launch Prep

After task loop completion:

- Run `/accessibility-audit`
- Run PERF or `/perf-audit`
- Run CRASHER if crash logs appear
- Run LAUNCHPAD or `/store-listing`
- Run SCRIBE for release notes
- Run PIPELINE if build/release automation is missing
- Run `/release-prep`

---

## Pass Criteria

A task can be marked done only when:

- Acceptance criteria pass
- Tests pass or accepted skip is documented
- PRD verification passes
- UI match is at or above threshold
- Mobile MCP QA passes or accepted skip is documented
- No CRITICAL platform-review findings remain
- `MOBILE_MEMORY.md` is updated
- NEXT ACTION is either the next task or a concrete fix

---

## Handoff Prompts

Start from scratch:

```text
Use MOBILE-HARNESS. Start from a new app idea and orchestrate APPFORGE, Mobile Memory, implementation, QA, and launch prep.
```

Beginner-guided start:

```text
Use MOBILE-HARNESS in BEGINNER_GUIDED mode. I have an app idea but need help choosing the platform and stack. Explain each checkpoint in plain language, create the planning documents, and stop for approval before the first code change.
```

Resume multi-day feature:

```text
Use MOBILE-HARNESS. Read MOBILE_MEMORY.md, PRD.md, DESIGN.md, TASKS.md, and DEPENDENCIES.md. Continue from NEXT ACTION.
```

QA-only:

```text
Use MOBILE-HARNESS in QA_ONLY mode. Run /mobile-mcp-qa against this app flow and produce MOBILE_HARNESS_REPORT.md.
```
