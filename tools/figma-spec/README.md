# Portable Figma spec helpers

Install into your app/game repository with:

```sh
npx mobile-ai-agents figma tools init
```

Existing files are preserved. Helpers ship inside the npm package, so this command needs no separate GitHub download and does not modify MCP configuration. Python 3.10+ is required. Install optional dependencies in your project's environment:

```sh
python3 -m pip install -r tools/figma-spec/requirements.txt
```

JSON syntax in `.yml` files works without PyYAML; ordinary YAML requires PyYAML. Screenshot comparison requires Pillow and numpy. These helpers never authenticate or call MCP themselves.

## Extraction

`page_index.js`, `text_dump.js`, and `node_dump.js` are templates for an available `use_figma` tool. Load the vendor's prerequisite skill first. Replace `__PAGE_ID__`, `__NODE_IDS__`, and `__MAX_DEPTH__` with JSON literals, then pass the script as the tool's code. Do not execute these in Node: they depend on Figma's Plugin API. A page switch changes the active UI context but does not edit design nodes. Run page-scoped reads sequentially when they share an active page.

- Index pages, then inspect the requested scope; do not skip pages by naming convention.
- Dump requirements/copy including instance descendants. Text-root extraction is supported.
- Dump component values with sufficient depth. Numeric source values retain precision; human-readable hex accompanies source RGBA values. Mixed styles and depth-limited children remain incomplete, requiring further inspection.
- Variable bindings/IDs and explicit modes are retained. Resolve actual mode values with available variable tools; bindings alone are not resolved tokens.
- These scripts are not complete exports of every Plugin API property. Asset inventory does not export SVG/bitmap bytes. Record unsupported properties and obtain actual exports separately.
- Without `use_figma`, use standard design-context/metadata/variable/screenshot tools or supplied structured exports. Do not fabricate a compatible raw dump from generated CSS; record extraction limitations.

## Local commands

```sh
python3 tools/figma-spec/dump_to_yaml.py raw.json docs/design-spec/checkout/components --page Checkout --block C1 --url 'https://www.figma.com/design/your-file/Checkout'
python3 tools/figma-spec/crosscheck.py docs/design-spec/checkout fresh.json --write
python3 tools/figma-spec/validate_spec.py docs/design-spec/checkout --strict
python3 tools/figma-spec/compare_screens.py reference.png rendered.png --out diff.png --threshold 2 --tolerance 16 --json
```

Use fresh dumps covering **every** component; merge bounded batches into one `nodes` array (with unique IDs and capture timestamp). Cross-check fails on missing components, zero checks, changed frame sizes or nested positions. Top-level canvas placement is deliberately excluded; relative child placement is checked. A fresh dump with the same depth cannot prove omitted descendants were inspected. Strict validation rejects depth truncation, mixed text styles, unknown verification, incomplete scope and blocking questions.

Conversion emits JSON-compatible YAML, quotes ambiguous strings, uses safe filename slugs, and marks prior implementation evidence stale when the design fingerprint changes. Implementation tracking uses `files` and `tests`, independent of framework.

Image comparison checks RGBA differences. Sizes must match by default; `--resize` is an explicit opt-in only for a documented export-scale difference with matching aspect ratios. `--crop x,y,w,h` crops the candidate only and must remain inside its bounds. Keep raw references alongside the diff. Record threshold, tolerance, crop/resampling, theme, viewport, content and font setup. A low pixel-difference percentage is a numerical result, not proof of behavior or accessibility. No universal threshold guarantees design fidelity.

## Contract shape

Alongside generated `components/*.yml` and actual `screenshots/*.png`, write:

```yaml
# index.yml
schema_version: 1
figma:
  file_key: your-file-key
coverage: complete
pages:
  - file: pages/checkout.yml
```

```yaml
# pages/checkout.yml
sections:
  - blocks:
      - code: C1
        node_id: '1:2'
        title: Checkout
```

```yaml
# acceptance_criteria.yml
acceptance_criteria:
  - id: C1-AC1
    block: C1
    text: Submit remains disabled while saving.
    source: verbatim
    source_node_id: '1:3'
    source_text: Submit remains disabled while saving.
    components: [components/submit--1-2.yml]
    verify_by: native-ui-test
```

```yaml
# questions.yml
questions: []
```

Set each component's `verification.screenshot_capture` to `pass` only after capturing its real reference. `crosscheck.py --write` records the value check and capture timestamp. `--strict` verifies contract readiness; non-strict mode checks structural errors and prints pending verification warnings. Neither proves the implementation passed runtime checks. Keep tokens, strings, raw dumps and overall verification/drift reports per the harvest skill.

Adapted from the seller-app's Figma tools. Tested with local synthetic captures and mock Plugin API responses; live Figma reads and platform builds remain unverified.
