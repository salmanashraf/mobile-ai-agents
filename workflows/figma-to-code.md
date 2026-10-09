# Workflow — Figma to Specs to Implementation

**Type:** Design handoff and native UI delivery  
**Agents Used:** FIGMA  
**Skills Used:** /figma-mcp-setup, /figma-spec-harvest, /figma-to-implementation, /prd-verification, /mobile-mcp-qa (when available)

## When to Use

A user wants a Figma component, screen, or flow extracted and built in an app, game, or other repository platform.

## Inputs

Frame/file URL, scope, target repository/platform, feature name, and known product/data contracts. Default to the linked subtree and detect the repository stack.

## Steps

1. **Connect:** Use `/figma-mcp-setup` if needed. Authenticate and verify a read of the actual node and reference capture. Setup guide: https://github.com/salmanashraf/mobile-ai-agents/blob/main/docs/figma-mcp.md
2. **Harvest:** Use `/figma-spec-harvest`. Save requirements, component properties, tokens, strings, assets, source IDs, screenshots and coverage into `docs/design-spec/<feature>/`. Record unknowns and contradictions. Install portable helpers with `npx mobile-ai-agents figma tools init` when needed; read `tools/figma-spec/README.md`. Cross-check every component against a fresh dump and run strict validation. Stop dependent implementation on failed or unverified required checks.
3. **Map:** FIGMA maps source nodes and AC IDs to existing native components/tokens, proposed changes, target files and verification methods. Resolve product blockers before dependent changes; proceed within authorized scope. Any selected component subset or run limit is partial feature scope and must be reported that way.
4. **Implement:** Use `/figma-to-implementation`. Integrate layouts, state and actions into the existing app. Avoid introducing a new stack from generated web snippets.
5. **Verify:** Run relevant build/static/behavior checks. Use `/prd-verification` against the saved contract. Compare runtime screenshots with references at matched viewport, theme and state; use `/mobile-mcp-qa` for supported device targets. Record actual evidence and deviations.
6. **Report:** Return contract path, changed files, node/AC traceability, check results, visual evidence and unresolved gaps. Use VERIFIED only when the requested implementation and relevant checks are complete; otherwise IMPLEMENTED_UNVERIFIED or BLOCKED. Require a result for every selected component and evidence for every required AC; missing/failed/null results cannot count as success.

## Outputs

A traceable spec, integrated native UI, and an evidence-backed delivery report. A specs-only request ends after harvest; it does not authorize app edits. A disconnected tool or missing SDK is reported as unverified rather than fabricated success.
