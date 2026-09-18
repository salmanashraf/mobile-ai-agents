# Skill — /accessibility-audit

**Platform:** Cross-Platform
**Slash Command:** `/accessibility-audit`

---

## Purpose

Reviews mobile UI for WCAG 2.1 AA and platform accessibility requirements. It also verifies app reskins and color-token migrations by semantic role so palette replacements do not create invisible text, controls, or status states.

## When to Use

- Before releasing a new or redesigned mobile screen.
- After `/mobile-app-design` changes themes, tokens, components, or navigation.
- When a reskin replaces hardcoded colors or consolidates competing palettes.
- When `/mobile-mcp-qa` finds unreadable content or a theme-specific regression.

## Inputs

Provide as much of this evidence as is available:

```text
PLATFORM: Android | iOS | Flutter | React Native
SUPPORTED_THEMES: light, dark, or named themes
UI_SOURCE: screen/component and theme/token source files
COLOR_PAIRS: optional resolved foreground/background pairs by role, theme, and state
SCREENSHOTS: optional device evidence; never a substitute for computed colors
RESKIN_PLAN: optional /mobile-app-design screen inventory and token migration plan
```

---

## Skill Prompt

```
Audit the provided mobile screen or component for accessibility:

WCAG 2.1 AA REQUIREMENTS:
1. PERCEIVABLE
   - 1.1.1 Non-text content: all images, icons, and decorative elements have alt text
     or are marked as decorative.
   - 1.3.1 Info and relationships: screen reader can determine the purpose of all UI elements.
   - 1.4.3 Contrast (minimum): text contrast ratio ≥ 4.5:1 (normal), ≥ 3:1 (large 18pt+).
   - 1.4.11 Non-text contrast: interactive components have ≥ 3:1 against adjacent color.

2. OPERABLE
   - 2.1.1 Keyboard: all functionality available without pointing device (hardware keyboard on iPad/Android).
   - 2.4.3 Focus order: focus sequence is logical and meaningful.
   - 2.5.3 Label in name: visible label text included in accessible name.
   - 2.5.5 Target size: interactive targets ≥ 44×44pt (iOS) or 48×48dp (Android).

3. UNDERSTANDABLE
   - 3.3.1 Error identification: form errors identified in text, not color alone.
   - 3.3.2 Labels or instructions: form inputs have visible labels.

4. ROBUST
   - 4.1.2 Name, role, value: all components have correct accessibility roles.

PLATFORM CHECKS:
Android:
- contentDescription on all ImageView and IconButton elements.
- importantForAccessibility="no" on decorative elements.
- TalkBack focus order matches visual order.
- Custom view provides AccessibilityNodeInfoCompat.

iOS:
- accessibilityLabel on all images and icon buttons.
- accessibilityTraits correct (.button, .header, .link, .selected).
- accessibilityHint for non-obvious actions.
- isAccessibilityElement = false for decorative views.

Flutter:
- Semantics widget with label, button, and excludeSemantics for decorative.
- SemanticsHint for non-obvious interactions.

React Native:
- accessibilityLabel and accessibilityRole on all interactive elements.
- accessibilityHint for non-obvious actions.
- accessible={false} for decorative elements.

RESKIN AND TOKEN MIGRATION:
1. Build a usage inventory before changing or approving tokens. Inspect each occurrence as
   body text, large text, muted/secondary text, icon, border, fill/surface, disabled content,
   disabled fill, status content, status fill, or fixed-tone content/fill.
2. Map colors by semantic role, never by old hex value. If one old hex is used for text,
   borders, and fills, those usages require separate destination tokens. Flag a single
   replacement token across different roles as ROLE_COLLISION.
3. Resolve the actual foreground and background after aliases, theme selection, state layers,
   opacity, and alpha compositing. Do not infer contrast from token names or visual judgment.
4. Compute WCAG relative luminance and contrast ratio for every supported theme and relevant
   state. Use (Llighter + 0.05) / (Ldarker + 0.05).
5. Require at least 4.5:1 for body/normal text and 3:1 for large text, icons, borders,
   focus indicators, and other meaningful non-text UI. Large text is at least 18pt regular
   or 14pt bold. Decorative borders and inactive controls do not need 3:1, but enabled
   control boundaries and state indicators do.
6. Test these pairs separately in every theme:
   - body text on each surface it appears on
   - muted/secondary text on each surface it appears on
   - icons and meaningful borders against adjacent colors
   - status chips/badges: content on container and container against its surroundings when
     the boundary communicates status
   - disabled content on disabled fill and surrounding surface; disabled state must not rely
     on low contrast or color alone
   - error, success, warning, and info content/containers
   - fixed-tone content on fixed-tone fills, without allowing system theme substitution
7. Detect invisible-text risks: foreground and background resolving to the same token/value,
   on-color paired with the wrong container, transparent content composited onto a matching
   surface, fixed-tone content replaced by a theme-dependent token, or a missing dark token
   falling back to a light-theme value.
8. Screenshots may reveal where to inspect, but sampled pixels are not sufficient when text
   has antialiasing, transparency, imagery, or gradients. Use resolved source/runtime colors
   for the computed result and mark unavailable pairs UNVERIFIED.

For each accessibility issue include the element, requirement, WCAG criterion, severity,
evidence, and concrete fix. For color failures, recommend a semantic token, not only a hex.

OUTPUT FORMAT:
ACCESSIBILITY AUDIT
===================
Platform:
Themes audited:
Evidence:
Result: PASS | FAIL | PARTIAL | BLOCKED

Summary:
- Critical:
- High:
- Medium:
- Low:
- Unverified:

Role Collision Audit:
| Old Color/Token | Source Usages | Incorrect Mapping | Required Role Tokens | Result |
|---|---|---|---|---|

Contrast Results:
| Element/Pair | Role | Theme/State | Foreground | Background | Ratio | Required | Recommended Token | Result |
|---|---|---|---|---|---:|---:|---|---|

Other Findings:
| Severity | Element | Requirement/WCAG | Evidence | Fix |
|---|---|---|---|---|

Unverified Evidence:
- Pair or behavior, missing evidence, and exact verification needed.

Decision:
- PASS only when all in-scope themes and states have computed passing pairs and no blocking
  semantic, focus, label, target-size, or announcement failures remain.
- PARTIAL when available checks pass but required evidence is missing.
- FAIL when any required pair or accessibility behavior fails.
```

## Example

**Input:**

```text
PLATFORM: React Native
SUPPORTED_THEMES: light, dark
RESKIN_PLAN: Replace legacy #6B7280 usages with the new secondary token.
UI_SOURCE:
- Settings helper text used #6B7280.
- Card borders used #6B7280.
- Dark theme maps secondary to #334155 on surface #0F172A.
```

**Output:**

```text
ACCESSIBILITY AUDIT
===================
Platform: React Native
Themes audited: light, dark
Evidence: resolved theme tokens and Settings source
Result: FAIL

Summary:
- Critical: 0
- High: 1
- Medium: 1
- Low: 0
- Unverified: 0

Role Collision Audit:
| Old Color/Token | Source Usages | Incorrect Mapping | Required Role Tokens | Result |
|---|---|---|---|---|
| #6B7280 | helper text, card border | color.secondary | color.onSurfaceVariant, color.outline | ROLE_COLLISION |

Contrast Results:
| Element/Pair | Role | Theme/State | Foreground | Background | Ratio | Required | Recommended Token | Result |
|---|---|---|---|---|---:|---:|---|---|
| Settings helper/surface | muted text | dark/default | #334155 | #0F172A | 1.72:1 | 4.5:1 | color.onSurfaceVariant | FAIL |
| Settings card edge/surface | meaningful border | dark/default | #334155 | #0F172A | 1.72:1 | 3:1 | color.outline | FAIL |

Other Findings:
| Severity | Element | Requirement/WCAG | Evidence | Fix |
|---|---|---|---|---|
| HIGH | Settings helper | 1.4.3 contrast | Dark token migration makes text nearly invisible | Map text to color.onSurfaceVariant and verify >= 4.5:1 |
| MEDIUM | Settings card | 1.4.11 non-text contrast | Border no longer communicates grouping | Map border to color.outline and verify >= 3:1 |

Unverified Evidence:
- None.

Decision:
- FAIL. Split the legacy value by semantic role, recompute both dark-mode pairs, and rerun
  `/mobile-mcp-qa` for Settings in light and dark themes.
```

## Composition

Use `/mobile-app-design` to define the reskin and token plan, this skill to compute accessibility results, and `/mobile-mcp-qa` to capture device evidence in every supported theme.
