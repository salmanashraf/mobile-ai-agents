# Workflow — New Screen

**Type:** UI implementation
**Agents Used:** FIGMA, AXIOM / SWIFT / DART / BRIDGE, PERF
**Skills Used:** /grill-mobile, /compose-review or /swiftui-review or /flutter-review, /android-tdd or /ios-tdd

---

## When to Use

Implementing a new screen from a Figma or design spec. For a live Figma link, start with [Figma to code](figma-to-code.md): connect MCP, harvest source-traced criteria and references, then implement in the existing stack.

---

## Steps

```
1. DESIGN HANDOFF — FIGMA
   ↓ Translate Figma spec into component spec:
     - Layout dimensions and spacing
     - Typography tokens
     - Color tokens
     - States: default, loading, empty, error
     - Interactions and animations
   ↓ Output: detailed component spec for implementation.

2. ALIGNMENT — /grill-mobile (5 key questions for a screen)
   ↓ What data does this screen load? From where?
   ↓ What are the loading, empty, and error states?
   ↓ What happens on tapping each interactive element?
   ↓ Does this screen need to be deep-linkable?
   ↓ What accessibility requirements apply?

3. IMPLEMENTATION — AXIOM / SWIFT / DART / BRIDGE
   ↓ Data/domain layer first (repository, use case, ViewModel/state).
   ↓ UI scaffold: structure without real data.
   ↓ Wire up real data with loading + error states.
   ↓ Animations and interactions.

4. REVIEW — /compose-review or /swiftui-review or /flutter-review
   ↓ Recomposition / rebuild audit.
   ↓ Accessibility check (touch targets, content descriptions).

5. PERFORMANCE — PERF
   ↓ Is the screen 60fps on a mid-range device?
   ↓ Any list without virtualization?
   ↓ Any main thread work during transition?

6. TESTS
   ↓ UI test: happy path loads and displays data correctly.
   ↓ Unit test: ViewModel handles loading, success, and error states.
```

---

## Inputs

- Figma design file or detailed design description
- API contract for data this screen consumes
- Platform context (SDK version, design system in use)

---

## Outputs

- Integrated screen with recorded visual, accessibility and performance evidence; unrun checks remain unverified
- Unit test for ViewModel
- UI test for happy path
