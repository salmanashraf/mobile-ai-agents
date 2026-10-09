# Skill — /prd-verification

**Platform:** Android / iOS / Flutter / React Native / Kotlin Multiplatform / Unity / Unreal  
**Slash Command:** `/prd-verification`  
**Composable With:** MOBILE-HARNESS, APPFORGE, Mobile Memory, `/mobile-mcp-qa`, `/clean-code-audit`, `/security-audit`, `/accessibility-audit`

---

## Purpose

Verify that an implemented app or feature matches the approved PRD, design plan, task acceptance criteria, tests, screenshots, and project memory.

Use this after implementation and before marking a task complete. This skill is evidence-based: it verifies against documents and artifacts, not conversation memory.

---

## Input Format

```text
COMMAND: /prd-verification
PLATFORM: <Android | iOS | Flutter | React Native | KMP | Unity | Unreal>
FEATURE_OR_SCOPE:
<feature name, task id, release scope, or app area>
DOCUMENTS:
<PRD.md, DESIGN.md, TASKS.md, DEPENDENCIES.md, ROADMAP.md, MOBILE_MEMORY.md excerpts or paths>
IMPLEMENTATION:
<changed files, relevant source code, repo tree, or diff>
EVIDENCE:
<test output, build output, screenshots, Mobile MCP QA report, logs, accessibility report, security report>
FIGMA_CONTRACT:
<optional docs/design-spec/<feature> with source criteria, questions, component specs and verification>
RESKIN_PLAN:
<optional /mobile-app-design plan with REDESIGN, RESTYLE, and LEAVE screen inventory rows>
RESKIN_QA:
<optional /mobile-mcp-qa Reskin QA report, before/after screenshots, state coverage, and theme evidence>
KNOWN_LIMITATIONS:
<optional explicit constraints, skipped checks, unavailable device, unavailable backend>
```

---

## Skill Prompt

```text
Run PRD verification for the provided mobile app or feature scope.

Your job is to decide whether the implementation matches the approved product documents and available evidence.

Read these inputs in order:

1. PRD.md or product requirements
2. TASKS.md acceptance criteria
3. DESIGN.md or design plan
4. /mobile-app-design reskin plan and screen inventory when provided
5. DEPENDENCIES.md and ROADMAP.md when provided
6. MOBILE_MEMORY.md or project context when provided
7. Relevant source code, diff, and file tree
8. Test/build output
9. Screenshots, videos, accessibility reports, security reports, or Mobile MCP QA reports
10. /mobile-mcp-qa Reskin QA report when provided

Verification rules:

- Verify against written artifacts, not memory.
- When FIGMA_CONTRACT is supplied, read its criteria, questions, component references, scope and verification. Run the installed Figma strict validator when available; otherwise report that check unverified. Trace each in-scope AC ID and source node to native implementation, behavior check and applicable screenshot evidence.
- A harvested source contract is not runtime proof. Pending/missing component results, blocked questions, partial scope or missing visual comparisons cannot pass the complete feature. Keep source verification separate from implementation verification.
- Record matched logical viewport, content/state, theme, fonts and any crop/resampling in Figma comparisons. Do not use an unexplained match percentage as proof.
- Every PASS or FAIL must cite a source and evidence.
- If a requirement exists in the PRD but no implementation evidence is provided, mark it UNKNOWN, not PASS.
- If implementation contradicts the PRD, mark FAIL.
- If behavior is inferred from code but not tested, mark PARTIAL and explain the missing proof.
- Separate confirmed gaps from assumptions.
- Do not expand scope beyond the approved PRD unless it creates release risk.
- Do not mark release-ready if critical requirements, security blockers, crash risks, or required tests are missing.
- For mobile reskins, compile/build/test success is not UI proof by itself.
- For mobile reskins, every required screen inventory row needs screenshot, video, or Mobile MCP evidence.
- Mark missing required reskin evidence as UNVERIFIED, or PARTIAL only when some states/themes are proven.
- Reject shallow rethemes: a REDESIGN screen fails when it only inherits token, color, font, spacing, or theme changes.

Check these areas:

1. FEATURE COVERAGE
- Core features listed in PRD.
- MVP vs future feature boundaries.
- Required user flows and edge cases.
- Offline, restart, error, loading, and empty states when specified.

2. ACCEPTANCE CRITERIA
- Every task acceptance criterion.
- QA checklist items.
- Functional requirements and non-functional requirements.
- Analytics, permissions, notifications, subscriptions, ads, or API behavior when specified.

3. DESIGN AND UI MATCH
- Screen list and navigation match the design plan.
- Layout, hierarchy, content, states, responsiveness, and accessibility evidence.
- Screenshot or Mobile MCP evidence when available.

4. MOBILE RESKIN VERIFICATION
Use this section when RESKIN_PLAN is provided or the scope mentions /mobile-app-design, reskin, redesign, tab reorder, navigation rename, visual refresh, or restyle.
- Read every screen inventory row and preserve its decision: REDESIGN, RESTYLE, or LEAVE.
- REDESIGN must show structural change: layout, hierarchy, grouping, density, information architecture, state layout, tab order, or interaction model.
- RESTYLE must include justification and must not be counted as structurally redesigned.
- LEAVE must be intentionally out of scope and should not be reported as a missed redesign unless the PRD required it.
- Compare before/after screenshots or Mobile MCP evidence for each required screen, state, orientation, and light/dark theme listed in the plan.
- If navigation changed, verify routes, deep links, selected tab state, back behavior, accessibility labels, tests, snapshots, and docs.
- If tabs or screens were renamed, verify user-facing copy changed consistently in UI, tests, screenshots, and docs.
- Use per-screen status values: PASS, FAIL, PARTIAL, or UNVERIFIED.

5. TEST AND DEVICE EVIDENCE
- Unit, integration, UI, golden/snapshot, E2E, and manual QA evidence.
- Build/install/launch proof.
- Device, emulator, simulator, or Mobile MCP proof when available.

6. SECURITY AND RELEASE BLOCKERS
- Security audit findings that affect release.
- Sensitive data, auth, storage, network, permissions, deep links, WebViews, logging, and payment/subscription behavior when relevant.
- Performance blockers that affect launch readiness.

7. CONTEXT CONTINUITY
- MOBILE_MEMORY.md or project context reflects the current state.
- Remaining gaps and next action are captured for future sessions.

Output exactly:

Table formatting rules:
- Output normal Markdown. Do not wrap the final report in a fenced code block.
- Keep every table cell short, ideally under 8 words.
- Do not put full paragraphs, logs, code blocks, screenshots, or multi-sentence explanations inside table cells.
- Put long evidence and reasoning in `Verification Details`.
- Use stable IDs (`PRD-001`, `PRD-002`) to connect summary rows to detail sections.

PRD MATCH REPORT
================
Platform:
Feature/Scope:
Result: PASS | FAIL | PARTIAL | BLOCKED
Documents Read:
Evidence Reviewed:

Executive Summary:
- <short status summary>

Feature Coverage:
| ID | Requirement | Source | Status | Evidence |
|---|---|---|---|---|

Acceptance Criteria Status:
| ID | Criteria | Source | Status | Evidence |
|---|---|---|---|---|

UI Match:
| Screen/State | Source | Status | Evidence |
|---|---|---|---|

Mobile Reskin Verification:
| Screen/State | Decision | Evidence | Status | Reason |
|---|---|---|---|---|

Test And Device Evidence:
| Check | Status | Evidence |
|---|---|---|

Security And Release Blockers:
| ID | Blocker | Source | Status | Action |
|---|---|---|---|---|

Verification Details:
### PRD-001 — <short title>
- Source:
- Evidence:
- Status:
- Confirmed gap:
- Assumption:
- Required fix:

Missing Requirements:
- <requirement or "None">

Confirmed Gaps:
- <gap or "None">

Assumptions:
- <assumption or "None">

Test Gaps:
- <gap or "None">

Release Readiness:
PASS only if all required PRD items and acceptance criteria are PASS, no critical UI/security/test gaps remain, required reskin evidence is PASS or risk-accepted, and unknowns are documented or risk-accepted.

Next Action:
1. <single highest priority action>
```

---

## Example

### Input

```text
COMMAND: /prd-verification
PLATFORM: Android
FEATURE_OR_SCOPE: Habit Pulse MVP
DOCUMENTS:
PRD.md:
- Users can view today's habits.
- Users can add a habit with a name.
- Users can mark a habit complete.
- Habits persist after app restart.
- MVP includes Home, Add Habit, History, and Settings screens.

TASKS.md:
- T1 Home list: default seeded habits visible.
- T2 Add habit: Save disabled until name is non-empty.
- T3 Persistence: saved habits survive restart.

DESIGN.md:
- Polished consumer direction.
- Four screens required: Home, Add Habit, History, Settings.
- Empty, populated, and validation states required.

IMPLEMENTATION:
- MainActivity.kt renders HomeScreen with two seeded habits.
- AddHabitDialog validates empty name and appends to in-memory list.
- No datastore, database, or preferences files.
- No HistoryScreen or SettingsScreen files.

EVIDENCE:
- Build PASS.
- Screenshot shows Home with two habits.
- Screenshot shows Add Habit dialog.
- No restart test output.
- No Mobile MCP report.
```

### Output

```text
PRD MATCH REPORT
================
Platform: Android
Feature/Scope: Habit Pulse MVP
Result: FAIL
Documents Read: PRD.md, TASKS.md, DESIGN.md
Evidence Reviewed: build output, screenshots, source notes

Executive Summary:
- MVP is not PRD-complete because persistence, History, Settings, and device proof are missing.

Feature Coverage:
| ID | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| PRD-001 | View today's habits | PRD.md | PASS | Home screenshot |
| PRD-002 | Add habit | PRD.md | PARTIAL | Dialog screenshot |
| PRD-003 | Mark complete | PRD.md | UNKNOWN | No interaction proof |
| PRD-004 | Persist after restart | PRD.md | FAIL | In-memory state |
| PRD-005 | Four MVP screens | DESIGN.md | FAIL | Two screens only |

Acceptance Criteria Status:
| ID | Criteria | Source | Status | Evidence |
|---|---|---|---|---|
| AC-001 | Seeded habits visible | TASKS.md T1 | PASS | Home screenshot |
| AC-002 | Save disabled empty | TASKS.md T2 | PARTIAL | Code notes |
| AC-003 | Survives restart | TASKS.md T3 | FAIL | No storage layer |

UI Match:
| Screen/State | Source | Status | Evidence |
|---|---|---|---|
| Home populated | DESIGN.md | PASS | Screenshot |
| Add validation | DESIGN.md | PARTIAL | Dialog screenshot |
| History screen | DESIGN.md | FAIL | Missing file |
| Settings screen | DESIGN.md | FAIL | Missing file |

Test And Device Evidence:
| Check | Status | Evidence |
|---|---|---|
| Build | PASS | Build output |
| Restart test | FAIL | No test |
| Device QA | UNKNOWN | No Mobile MCP report |

Security And Release Blockers:
| ID | Blocker | Source | Status | Action |
|---|---|---|---|---|
| REL-001 | Persistence missing | PRD.md | FAIL | Add storage |

Verification Details:
### PRD-004 — Habits do not persist after restart
- Source: PRD.md persistence requirement and TASKS.md T3.
- Evidence: Implementation uses in-memory list and no datastore, database, or preferences files are present.
- Status: FAIL.
- Confirmed gap: Saved habits are lost on app restart.
- Assumption: None.
- Required fix: Add local persistence and restart verification.

### PRD-005 — Required MVP screens are missing
- Source: DESIGN.md screen list.
- Evidence: No HistoryScreen or SettingsScreen implementation was provided.
- Status: FAIL.
- Confirmed gap: The delivered app has fewer screens than the approved MVP design.
- Assumption: None.
- Required fix: Implement History and Settings or update approved scope.

Missing Requirements:
- Habit persistence after restart.
- History screen.
- Settings screen.
- Device QA evidence.

Confirmed Gaps:
- Storage layer is missing.
- Two approved screens are missing.

Assumptions:
- Mark-complete behavior may exist, but no interaction evidence was provided.

Test Gaps:
- Restart persistence test.
- UI test for add habit validation.
- Mobile MCP device flow.

Release Readiness:
PASS only if all required PRD items and acceptance criteria are PASS, no critical UI/security/test gaps remain, and unknowns are documented or risk-accepted.

Next Action:
1. Implement persistence and restart verification before adding new scope.
```

---

## Mobile Reskin Example

Use this guidance when `/mobile-app-design` produced a reskin plan and `/mobile-mcp-qa` produced device evidence.

```text
FIGMA_CONTRACT:
<optional docs/design-spec/<feature> with source criteria, questions, component specs and verification>
RESKIN_PLAN:
- Home: REDESIGN. Replace feed cards with grouped Today, Progress, and Next Action sections.
- Profile: RESTYLE. Keep structure, update typography and spacing only.
- Billing: LEAVE. Out of scope for this release.

RESKIN_QA:
- Mobile MCP Reskin QA has before/after screenshots for Home light and dark.
- Profile screenshot exists only for light theme.
- No Billing screenshot because it is marked LEAVE.
```

Expected verification behavior:

```text
Mobile Reskin Verification:
| Screen/State | Decision | Evidence | Status | Reason |
|---|---|---|---|---|
| Home light/dark | REDESIGN | MCP screenshots | PASS | Structure changed |
| Profile light | RESTYLE | Screenshot | PARTIAL | Dark missing |
| Billing | LEAVE | Plan row | PASS | Out of scope |

Verification Details:
### UI-001 — Home redesign is proven
- Source: /mobile-app-design RESKIN_PLAN.
- Evidence: /mobile-mcp-qa before/after screenshots show new grouped sections.
- Status: PASS.
- Confirmed gap: None.
- Assumption: None.
- Required fix: None.

### UI-002 — Profile restyle has incomplete evidence
- Source: /mobile-app-design RESKIN_PLAN.
- Evidence: Only light theme screenshot was provided.
- Status: PARTIAL.
- Confirmed gap: Dark theme evidence is missing.
- Assumption: Profile was intentionally restyled, not redesigned.
- Required fix: Capture Profile dark theme screenshot or risk-accept the gap.
```

If Home only changed colors, fonts, or tokens, mark it FAIL because a REDESIGN requires structural proof.

---

## Composition Example

```text
Inside MOBILE-HARNESS:
1. Implement the current task.
2. Run tests and collect screenshots or Mobile MCP QA.
3. Run /prd-verification with PRD.md, DESIGN.md, TASKS.md, MOBILE_MEMORY.md, code diff, and evidence.
4. Mark the task complete only if /prd-verification returns PASS or accepted PARTIAL with documented exceptions.
5. Save the report summary into MOBILE_MEMORY.md.
```

```text
Inside APPFORGE:
Use /prd-verification during Stage 5 and Stage 7 to compare implementation output against the approved PRD, design plan, and task acceptance criteria before Play Store preparation.
```

---

## Notes

- This skill does not replace tests or device QA. It checks whether the available evidence proves the product requirements.
- UNKNOWN is safer than PASS when evidence is missing.
- PARTIAL is allowed only when implementation evidence exists but proof is incomplete.
