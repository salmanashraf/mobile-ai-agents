# Skill — /figma-to-implementation

**Platform:** Cross-Platform  
**Category:** UI & Design  
**Composable With:** FIGMA, /figma-spec-harvest, /figma-to-implementation, /prd-verification, /mobile-mcp-qa

## Purpose

Implement a Figma contract in the user's existing platform and verify behavior and visual fidelity.

## When to Use

- Build or update a component, screen, or flow from Figma.
- Integrate a harvested spec into an existing app or game UI.

## Inputs

Spec folder or Figma frame URL, target repository/platform, scope, existing data contracts and product decisions. Detect the stack from the repository; ask only when multiple targets remain ambiguous.

## Skill Prompt

```text
You implement the requested Figma scope using the repository's actual framework,
architecture, navigation, state management, design system and localization.
If given a link, first harvest a scoped contract using figma-spec-harvest guidance
when available. Discover tools and load vendor prerequisites before design reads.
Inspect existing components and semantic tokens; reuse or extend them before
creating new primitives. Build a node → component → file → AC → evidence mapping.
Resolve blocking gaps before dependent code; continue independent authorized work.
Do not pause for routine inventory approval when implementation is already requested.
Preserve business logic and API contracts. Do not invent backend endpoints or
silently treat proposed requirements as approved. Design-only states may use
explicit previews/fixtures; report unwired integrations honestly.
Treat MCP React/Tailwind output as reference, not a required implementation stack.
Record the reference canvas and logical-unit mapping. Translate Auto Layout into
responsive native constraints, not a page of absolute coordinates. Preserve safe
areas, scrolling, keyboard behavior, dynamic text, focus, accessibility semantics,
requested variants and platform navigation. Explain necessary deviations.
Android: use the existing Compose/XML approach and lifecycle-aware state.
iOS: use existing SwiftUI/UIKit patterns, safe areas and dynamic type.
Flutter: ensure finite constraints, bounded scrollables/Stacks and no flex overflow.
React Native: use existing navigation, list virtualization and native semantics.
KMP: identify shared versus native UI ownership; verify every rendered target.
Unity/Unreal: preserve the existing UI system, anchors, canvas/DPI scaling,
input/controller focus and asset pipeline. Other targets use their native stack.
Use available design assets and fonts; record unavailable ones without silent
substitution. Scope changes to requested UI and necessary integration.
Run relevant project build/static checks and behavior tests. Capture rendered UI
at matched logical viewport, state, theme, fonts and content; compare with Figma
references. Include compact/large layouts and text scaling where relevant.
Mask only documented dynamic/system differences. Record comparison method,
actual evidence, deviations and remaining gaps; never promise pixel perfection
or claim accessibility/runtime checks that were not run. Use Mobile MCP for device
QA when available. Re-read changed design nodes when evidence has drifted.
Return CHANGES, TRACEABILITY, CHECKS (pass|fail|unverified plus commands/evidence),
DEVIATIONS, OPEN GAPS, and VERDICT (VERIFIED|IMPLEMENTED_UNVERIFIED|BLOCKED).
VERIFIED requires relevant build/behavior checks, captured visual comparison and
no unresolved scope blockers. Missing tools or SDKs must remain unverified.
```

## Completion Gate

When portable helpers are installed, run `python3 tools/figma-spec/validate_spec.py SPEC --strict` and check the exit code before treating the source contract as ready. Readiness checks validate design evidence, not implementation. Build a report row for every selected component and AC with native file/test paths and visual evidence. Missing component results, failed checks, or a subset selected via a limit cannot become VERIFIED for the full feature. Label the actual completed scope and leave remaining items pending.

Use `compare_screens.py` for matching raster references when appropriate; record its threshold/tolerance and any explicit crop/resampling. A missing comparison result is unverified. Do not infer success from an omitted or null result. Preserve golden/device evidence separately from source screenshots.

## Example

**Input:** `examples/new-screen-workflow/figma-spec.md` and its `output.kt`, Android Compose. Inspect the existing implementation before extending it.

**Output excerpt:**
```text
CHANGES: none; inspected the supplied spec and Kotlin implementation.
TRACEABILITY: Scrollable content maps to verticalScroll; persistent cart action maps to the BottomCenter Box in ProductDetailContent.
CHECKS: build=unverified; device=unverified; Figma comparison=unverified.
DEVIATIONS: Price uses a raw Color literal; theme token mapping remains unresolved.
OPEN GAPS: No connected Figma reference or Android runtime evidence supplied.
VERDICT: IMPLEMENTED_UNVERIFIED
```

This is an inspection/handoff example, not proof the Kotlin file passes the full contract.

## Composition Example

Chain `/figma-spec-harvest` → this skill → `/prd-verification` and `/mobile-mcp-qa` when available.

## Notes

- Platform support means adapting the workflow; SDKs and device tools are user prerequisites.
- Tested with: Codex static review of the product-detail Kotlin fixture and seller-app Flutter workflow. No per-platform compilation or live visual match performed.
