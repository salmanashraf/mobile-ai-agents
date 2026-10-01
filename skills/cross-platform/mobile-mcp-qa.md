# Skill — /mobile-mcp-qa

**Platform:** Android / iOS / Flutter / React Native  
**Slash Command:** `/mobile-mcp-qa`  
**Composable With:** APPFORGE, AXIOM, SWIFT, DART, BRIDGE, CRASHER, PERF, Mobile Memory

---

## Purpose

Use Mobile MCP to run AI-assisted QA on a real device, emulator, or simulator. This skill turns a feature flow into a repeatable device test plan using screenshots, accessibility snapshots, element inspection, taps, typing, swipes, app install, app launch, and device orientation checks.

Mobile MCP is best used after implementation, during APPFORGE Stage 7 Full QA, after `/mobile-app-design` reskins, or before store submission.

---

## Prerequisites

For Android, use the Mobile AI Agents setup commands from the app project:

```bash
npx mobile-ai-agents doctor --platform android
npx mobile-ai-agents mcp setup --client <claude|cursor|windsurf|codex>
npx mobile-ai-agents mcp config init \
  --app-id com.example.app \
  --apk app/build/outputs/apk/debug/app-debug.apk \
  --flow "Launch app|Complete the primary flow|Verify success"
npx mobile-ai-agents mcp config validate
```

The setup command preserves existing client settings and is safe to repeat. See `docs/android-device-setup.md` for configuration fields, JSON output, and troubleshooting.

Install Mobile MCP in your AI tool:

```json
{
  "mcpServers": {
    "mobile-mcp": {
      "command": "npx",
      "args": ["-y", "@mobilenext/mobile-mcp@latest"]
    }
  }
}
```

Claude Code:

```bash
claude mcp add mobile-mcp -- npx -y @mobilenext/mobile-mcp@latest
```

Codex:

```bash
codex mcp add mobile-mcp npx "@mobilenext/mobile-mcp@latest"
```

You also need at least one available Android emulator/device or iOS simulator/device.

---

## Input Format

```text
COMMAND: /mobile-mcp-qa
PLATFORM: <Android | iOS | Flutter | React Native>
APP_ID: <Android package name or iOS bundle id>
BUILD_PATH: <optional apk/ipa/app path>
DEVICE: <optional target device name>
FLOW:
<numbered user flow to test>
EXPECTED:
<expected UI state, navigation, data, and analytics>
EDGE_CASES:
<offline, invalid input, rotation, restart, permissions, api errors>
```

### Reskin QA Input

Use this format when verifying a `/mobile-app-design` redesign or reskin:

```text
COMMAND: /mobile-mcp-qa
MODE: RESKIN_QA
PLATFORM: <Android | iOS | Flutter | React Native>
APP_ID: <Android package name or iOS bundle id>
BUILD_PATH: <optional apk/ipa/app path>
DEVICE: <optional target device name>
SUPPORTED_THEMES: <light | dark | light,dark | custom themes>
SCREEN_INVENTORY:
| Screen/State | Decision | Expected Change | Route/Tab |
|---|---|---|---|
| <screen + state> | REDESIGN | <layout/hierarchy/state change> | <route/tab> |
BASELINE_EVIDENCE:
<before screenshots, screenshot paths, or "capture before from current build">
EXPECTED_REDESIGN:
<approved reskin plan, navigation changes, theme changes, and state coverage>
REGRESSION_RISKS:
<tab reorder, renamed copy, deep links, dark mode, keyboard, safe area, analytics, etc.>
```

---

## Skill Prompt

```text
Run a Mobile MCP QA pass for the provided mobile app flow.

If MODE is RESKIN_QA, run the Reskin QA flow instead of ordinary flow QA.

STEP 1 — VERIFY SETUP
- List available devices.
- Select the requested device, or choose the first available emulator/simulator.
- If BUILD_PATH is provided, install the app.
- Launch APP_ID.
- Capture screen size and orientation.

STEP 2 — BASELINE SCREEN
- Take a screenshot.
- List elements on screen.
- Record the initial screen name and visible primary actions.
- If accessibility data is incomplete, fall back to screenshot-based coordinate reasoning.

STEP 3 — EXECUTE FLOW
For each user-flow step:
- Identify the target element.
- Prefer accessibility element interaction when available.
- Use coordinate tap only when element metadata is missing.
- Type text where required.
- Swipe only when the target is off-screen.
- Take a screenshot after every major state transition.

STEP 4 — VERIFY EXPECTED RESULT
Check:
- Correct screen reached
- Correct labels and values rendered
- Loading, empty, and error states behave as expected
- Navigation stack and back behavior work
- Keyboard behavior is sane
- Orientation does not break layout
- App restart preserves required state
- Offline/API error behavior is user-safe

RESKIN QA FLOW
Use this flow when MODE is RESKIN_QA or when the user provides a `/mobile-app-design` screen inventory.

STEP R1 — VERIFY RESKIN INPUTS
- Read SCREEN_INVENTORY and EXPECTED_REDESIGN.
- Preserve each inventory decision exactly: REDESIGN, RESTYLE, or LEAVE.
- Confirm SUPPORTED_THEMES. If the app supports light and dark, both are required.
- If baseline screenshots are missing and the current build is already the after build, mark before evidence as missing instead of inventing it.

STEP R2 — CAPTURE OR REGISTER BASELINE
- For each inventory row, attach the provided before screenshot or capture a before screenshot if the baseline build is available.
- Name evidence predictably: before-<theme>-<screen>-<state>.
- A screen/state without before evidence is still testable after the edit, but its before/after comparison status is UNVERIFIED.

STEP R3 — CAPTURE AFTER STATE
- Launch the after build.
- Visit every screen/state in SCREEN_INVENTORY.
- Capture after screenshots for every supported theme.
- For loading, empty, error, offline, permission-denied, and success states, use controlled test data, network toggles, permissions, or documented setup steps when available.
- Name evidence predictably: after-<theme>-<screen>-<state>.

STEP R4 — VERIFY STRUCTURAL CHANGE
For each inventory row:
- REDESIGN must show layout, hierarchy, grouping, density, information-priority, or state-layout changes. Token-only changes are FAIL.
- RESTYLE may show token/component updates only, but must have a justification.
- LEAVE should remain intentionally unchanged except for unavoidable global shell or token updates.
- Mark missing before or after screenshots as UNVERIFIED.

STEP R5 — VERIFY REGRESSIONS
Check:
- clipped or overlapping text
- safe areas, status bar, navigation bar, and notches
- keyboard avoidance
- minimum 44pt/48dp touch targets
- light/dark contrast and invisible text risk
- tab order, selected state, route names, deep links, and back behavior
- renamed screen/tab copy across labels, empty states, prompts, and accessibility text
- loading, empty, error, offline, disabled, permission-denied, and success states
- orientation when the app supports it

STEP R6 — REPORT RESKIN QA
Return:
MOBILE MCP RESKIN QA REPORT
===========================
Platform:
Device:
App:
Themes:
Result: PASS | FAIL | PARTIAL | BLOCKED

Screen Evidence:
| Screen/State | Decision | Theme | Before | After | Result |
|---|---|---|---|---|---|

Structural Verification:
| Screen/State | Decision | Expected Change | Observed Change | Result |
|---|---|---|---|---|

Regression Checks:
| Check | Screen/State | Result | Evidence |
|---|---|---|---|

Issues:
| Severity | Screen/State | Issue | Evidence | Fix |
|---|---|---|---|---|

Evidence For PRD Verification:
- <compact screenshot list and report summary that can be pasted into /prd-verification>

Recommended Next Action:
<single concrete fix or next test>

STEP 5 — REPORT ORDINARY FLOW QA
Return:
MOBILE MCP QA REPORT
====================
Platform:
Device:
App:
Flow:
Result: PASS | FAIL | BLOCKED

Steps Executed:
| Step | Action | Evidence | Result |
|---|---|---|---|

Issues:
| Severity | Screen | Issue | Repro Step | Fix |
|---|---|---|---|---|

Screenshots Captured:
- <screenshot name or description>

Accessibility Findings:
- <missing labels, small targets, focus issues>

Recommended Next Action:
<single concrete fix or next test>
```

### Reskin QA Example

#### Input

```text
COMMAND: /mobile-mcp-qa
MODE: RESKIN_QA
PLATFORM: React Native
APP_ID: com.example.habits
SUPPORTED_THEMES: light,dark
SCREEN_INVENTORY:
| Screen/State | Decision | Expected Change | Route/Tab |
|---|---|---|---|
| Today/populated | REDESIGN | grouped morning/afternoon/evening sections | Today |
| Today/empty | REDESIGN | coaching empty state with primary action | Today |
| Insights/populated | REDESIGN | KPI strip + weekly chart + compact history | Insights |
| Settings/default | RESTYLE | tokenized surfaces and clearer typography | Settings |
BASELINE_EVIDENCE:
before-light-today-populated.png, before-dark-today-populated.png,
before-light-insights-populated.png, before-dark-insights-populated.png
EXPECTED_REDESIGN:
Tabs reordered to Today, Insights, Coach, Settings. Today and Insights require structural layout changes. Settings is restyle only.
REGRESSION_RISKS:
dark mode contrast, renamed Strategy copy, tab selected state, safe areas
```

#### Output

```text
MOBILE MCP RESKIN QA REPORT
===========================
Platform: React Native
Device: iPhone 15 Simulator
App: com.example.habits
Themes: light, dark
Result: FAIL

Screen Evidence:
| Screen/State | Decision | Theme | Before | After | Result |
|---|---|---|---|---|---|
| Today/populated | REDESIGN | light | before-light-today | after-light-today | PASS |
| Today/populated | REDESIGN | dark | before-dark-today | after-dark-today | PASS |
| Insights/populated | REDESIGN | light | before-light-insights | after-light-insights | PASS |
| Insights/populated | REDESIGN | dark | before-dark-insights | after-dark-insights | FAIL |
| Settings/default | RESTYLE | dark | missing | after-dark-settings | UNVERIFIED |

Structural Verification:
| Screen/State | Decision | Expected Change | Observed Change | Result |
|---|---|---|---|---|
| Today/populated | REDESIGN | grouped sections | sections visible | PASS |
| Insights/populated | REDESIGN | KPI + chart + history | chart clipped in dark | FAIL |
| Settings/default | RESTYLE | token updates | no before evidence | UNVERIFIED |

Regression Checks:
| Check | Screen/State | Result | Evidence |
|---|---|---|---|
| Dark contrast | Insights | FAIL | chart label unreadable |
| Tab selected state | All tabs | PASS | selected indicator moves |
| Renamed copy | Today | PASS | no stale Strategy copy |

Issues:
| Severity | Screen/State | Issue | Evidence | Fix |
|---|---|---|---|---|
| WARNING | Insights/dark | Chart label has low contrast | after-dark-insights | Use onSurface token |
| INFO | Settings/default | Missing baseline | after-dark-settings | Capture before image next run |

Evidence For PRD Verification:
- Today populated: light/dark before-after PASS.
- Insights dark: FAIL due chart contrast.
- Settings: UNVERIFIED because baseline missing.

Recommended Next Action:
Fix Insights dark chart label contrast and rerun Reskin QA for Insights and Settings.
```

---

## Example

### Input

```text
COMMAND: /mobile-mcp-qa
PLATFORM: Android
APP_ID: com.example.invoice
FLOW:
1. Launch app.
2. Tap Add Invoice.
3. Enter client "Acme Studio".
4. Enter amount "450".
5. Set due date tomorrow.
6. Save invoice.
7. Confirm invoice appears on dashboard.
EXPECTED:
Dashboard shows Acme Studio, $450, due tomorrow, status Unpaid.
EDGE_CASES:
Rotate on dashboard, restart app, verify invoice persists.
```

### Output

```text
MOBILE MCP QA REPORT
====================
Platform: Android
Device: Pixel_7_API_35
App: com.example.invoice
Flow: Create invoice and verify dashboard persistence
Result: FAIL

Steps Executed:
| Step | Action | Evidence | Result |
|---|---|---|---|
| 1 | Launched app | Home screenshot shows empty dashboard | PASS |
| 2 | Tapped Add Invoice | Add Invoice screen visible | PASS |
| 3 | Entered client and amount | Form fields populated | PASS |
| 4 | Saved invoice | Returned to dashboard | PASS |
| 5 | Restarted app | Dashboard empty after relaunch | FAIL |

Issues:
| Severity | Screen | Issue | Repro Step | Fix |
|---|---|---|---|---|
| CRITICAL | Dashboard | Invoice is not persisted after app restart | Save invoice, terminate app, relaunch | Verify Room insert is awaited before navigation |

Screenshots Captured:
- home-empty-initial
- add-invoice-filled
- dashboard-after-save
- dashboard-after-restart

Accessibility Findings:
- Add Invoice button has label.
- Amount field missing content description for currency expectation.

Recommended Next Action:
Fix invoice persistence by awaiting InvoiceDao.insert() before navigating back to Dashboard, then rerun the restart persistence flow.
```
