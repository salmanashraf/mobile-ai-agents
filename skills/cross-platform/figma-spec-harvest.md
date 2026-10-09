# Skill — /figma-spec-harvest

**Platform:** Cross-Platform  
**Category:** UI & Design  
**Composable With:** FIGMA, /figma-spec-harvest, /figma-to-implementation, /prd-verification, /mobile-mcp-qa

## Purpose

Extract a traceable, platform-neutral design contract before implementation.

## When to Use

- Figma to specs, acceptance criteria, design tokens, or implementation planning.
- Refresh an existing handoff to identify design drift.

## Inputs

Figma URL, feature slug, explicit page/node scope (default: linked node subtree), optional PRD/product decisions and refresh request. For a file-only URL, inventory pages and establish scope; never silently skip pages using project-specific naming conventions.

## Skill Prompt

```text
You harvest a Figma design into docs/design-spec/<feature>/ without editing Figma
or application code. Discover available tools rather than hardcoding provider IDs.
Load vendor prerequisites when present. Inventory pages/frames, child nodes,
component instances, variants, and states; drill into truncated results in bounded
batches. Record requested, inspected, skipped, and unreadable scope separately.
Read written requirements and dev notes including text nested inside instances.
Metadata/codegen may omit text: use available read-only inspection or supplied
exports, and explicitly record unavailable content. Never infer hidden behavior
from a screenshot. Separate verbatim, derived, and proposed acceptance criteria;
retain source node IDs and source text. Product decisions override conflicting
implementation choices, but preserve original design evidence and log the conflict.
Serialize exact available layout, typography, fills, variable bindings/modes,
constraints, component properties, strings and asset references programmatically
from saved structured responses. Do not treat generated CSS as authoritative raw
values. Mark unavailable properties unknown. Map repository tokens by semantic
role and value, not matching hex alone. Inventory reuse candidates and gaps.
Capture references where supported, saving native media/files when permitted;
otherwise record returned references and their persistence limitations. Never
claim screenshots saved when only an expiring URL is available.
Cross-check critical extracted properties against a fresh read. Record mismatches,
unavailable checks, and design changes; re-harvest changed nodes. Validate unique
AC IDs, resolving component/source references, scope coverage and actual evidence.
Return folder, counts, coverage, questions, gaps, and verification status. READY
requires complete requested scope and no unresolved implementation blockers;
otherwise use PARTIAL or BLOCKED. Spec readiness does not mean code is verified.
On refresh preserve the previous contract and report added/removed/changed nodes,
requirements and values, including implemented components requiring rework.
```

## Output Contract

Use YAML (or JSON if the project already uses it), with these logical files:

| File | Required content |
|---|---|
| `index.yml` | schema_version: 1, source URL/file key, capture time, scope, page/node inventory, coverage and tool capabilities |
| `acceptance_criteria.yml` | criteria with stable ID, text, source (verbatim|derived|proposed), source_node_id/source_text, component refs, applicable platforms and verify_by |
| `questions.yml` | ID, conflicting evidence or unknown, blocking flag, status and resolution |
| `tokens.yml` | source node/variable, mode, exact available value, semantic role, repository mapping or GAP |
| `strings.yml` | exact user copy, source node, locale when known |
| `components/` | one file per implementation unit: source node, layout/style values, variants/states, asset refs, unknowns |
| `pages/` | sections/blocks, JTBD, notes, criteria refs; explicit reason when no criteria exist |
| `screenshots/` | available reference files; otherwise component evidence refs with limitations |
| `raw/` | source responses/exports; follow repository data-retention rules |
| `verification.yml` | per-check pass/fail/unverified, evidence refs, mismatches, coverage, readiness, drift |

Every observed value must retain its source; every proposed behavior must be labeled. Install portable helpers with `npx mobile-ai-agents figma tools init` when requested or needed. Follow the installed `tools/figma-spec/README.md`; it includes concrete YAML field names and optional read-only extraction templates. Use `dump_to_yaml.py` for compatible structured dumps, `crosscheck.py --write` with a fresh dump covering every component, and `validate_spec.py --strict` before READY. Keep each component's screenshot capture status tied to an actual file. Nonzero exit codes block readiness; a non-strict structural PASS is insufficient. If helper prerequisites are unavailable, record verification as unverified and use PARTIAL. Do not invent data to make a validator pass.

## Example

**Input:** Repository fixture `examples/new-screen-workflow/figma-spec.md`, feature `product-detail`, offline supplied-spec mode.

**Output excerpt:**
```yaml
schema_version: 1
source: examples/new-screen-workflow/figma-spec.md
coverage: supplied-spec-only
acceptance_criteria:
  - id: product-detail-AC1
    block: product-detail
    source_node_id: unavailable-in-supplied-description
    text: Add to Cart remains visible at the bottom while content scrolls.
    source: derived
    source_text: 'Bottom of screen, sticky (always visible), 16dp all padding'
    components: [add-to-cart]
    verify_by: device
verification:
  node_read: unverified
  values_crosscheck: unverified
  screenshot_capture: unverified
readiness: PARTIAL
```

## Composition Example

Pass this contract to `/figma-to-implementation`; use `/prd-verification` to check requirement coverage after rendering.

## Notes

- Supplied descriptions are usable inputs but cannot establish live Figma fidelity.
- Tested with: Codex review of the repository's product-detail fixture and seller-app harvest workflow; live MCP extraction not tested.
