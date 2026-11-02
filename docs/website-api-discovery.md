# Website API discovery for mobile developers

Capture a website's HTTP requests and response shapes at each interaction, then hand the evidence to your AI coding agent. This is useful when a web/backend team has shipped a feature and Android, iOS, Flutter, React Native or Kotlin Multiplatform developers need to implement the same API flow.

The runnable command delivers **browser network evidence**, not generated mobile clients or verified mobile parity. Use the [web-network-to-mobile skill](../skills/cross-platform/web-network-to-mobile.md) for that handoff. Follow-up work is tracked in [#70–#72](https://github.com/salmanashraf/mobile-ai-agents/issues/70).

## Run from a checkout

Browser tooling is optional and is not installed with the toolkit. In a project with a package.json:

```bash
npm install --no-save playwright
npx playwright install chromium
```

From this repository, start the owned demo (terminal 1):

```bash
node cli/fixtures/network-demo.js /tmp/mobile-api-flow.json
```

Capture the demo (terminal 2):

```bash
node cli/index.js network capture \
  --url http://127.0.0.1:4173 \
  --flow /tmp/mobile-api-flow.json \
  --out /tmp/mobile-api-demo \
  --allow-writes
```

Use a new flow-file path and output directory on subsequent runs; existing outputs are never overwritten. Stop the demo with Ctrl+C. If using installed Google Chrome rather than Playwright Chromium, add `--channel chrome`. `--headed` shows the isolated browser. The module never connects to your personal browser profile.

Available starting in `mobile-ai-agents@1.0.39`. For your own authorized site, use `npx mobile-ai-agents@latest network capture --url URL --out NEW_DIRECTORY`. The owned fixture above runs from a checkout. Playwright must be installed in your project; the optional loader resolves it from the current working directory.

## Expected demo evidence

The fixture exercises six touchpoints:

| Touchpoint | Action | Expected product calls |
|---|---|---|
| T1 | Navigate | HTML document; no initial product API call |
| T2 | Load listings | `GET /api/items` |
| T3 | Open detail | `GET /api/detail` and `GET /api/options` |
| T4 | Validate empty title locally | None |
| T5 | Fill title | None |
| T6 | Save test listing | `POST /api/save` → 201 |

`capture.json` contains timestamped request IDs, touchpoint windows, methods, sanitized URLs and headers, status codes, observed body schemas, failures and redirect links. `report.md` provides a readable index. Body scalar values are omitted rather than guessed to be safe. For example, an email response field is represented as `{"type":"string"}`, not its actual value.

## Capture your own authorized test flow

Create a JSON array of bounded actions using stable CSS selectors:

```json
[
  { "action": "click", "selector": "[data-testid=load-listings]", "waitMs": 1000 },
  { "action": "fill", "selector": "input[name=title]", "value": "Test listing" },
  { "action": "click", "selector": "[data-testid=save]", "waitMs": 1500 }
]
```

```bash
node cli/index.js network capture \
  --url https://staging.example.com/listings \
  --allow-origin https://api.staging.example.com \
  --flow flow.json \
  --out ./api-capture-run-1
```

Initial navigation is always captured before the steps. Without `--flow`, only initial navigation is inspected. Additional allowed origins are comma-separated; all unlisted HTTP(S) origins are blocked, including third-party analytics. WebSocket connections are blocked and require a current Playwright version with `routeWebSocket` support. Same-origin analytics remain unclassified in the report. Route interception also disables HTTP cache and service workers are blocked so this is a controlled capture rather than faithful cache behavior. There is no crawler, manual interactive recorder, existing-session import, or automatic login bypass.

Only GET, HEAD and OPTIONS are allowed by default. `--allow-writes` enables other HTTP methods for the supplied flow; use it only for authorized test data and resettable environments. Read-like GraphQL POST requests also require it. An HTTP method alone cannot establish that an endpoint is safe; even GET can have side effects. The tool does not retry or replay failed writes.

## Evidence limits and privacy

- Attribution is by the active time window, not a causal dependency graph. A delayed request may appear under a later touchpoint. Choose waits appropriate to the test and inspect the timestamps.
- JSON and URL-encoded request shapes and JSON response shapes are sampled observations. Requiredness, enum ranges and all error responses cannot be inferred from a single run. GraphQL operation values, socket/SSE messages, multipart values and binary data are not recorded.
- Query values, URL credentials, fragments and non-content header values are removed/redacted. Numeric/opaque route segments are redacted. Readable path segments, origins, query keys and JSON property names remain; review them before sharing. This is not a guarantee of anonymous artifacts.
- No screenshot, DOM text, raw HAR, auth storage or body scalar values are written. Input flow files can contain sensitive test values; keep them local. Redirect links use captured request IDs. Auth presence is a hint from exposed header names, not a complete authentication contract.
- Fresh context, one page, 390×844 viewport; popups are closed. Default action timeout 10 seconds, navigation timeout 15 seconds, body-read timeout 5 seconds, at most 50 actions, 500 captured requests, 64 KiB body inspection, and depth/array sampling limits. Body transfer itself is not capped when content length is unavailable. Do not use large download/streaming flows.
- `captured` means scoped browser windows completed without recorded failures. HTTP errors, blocked requests, pending requests or unavailable JSON bodies yield `partial`; action/browser failures yield `failed`. Partial/failed runs return a nonzero exit code and retain evidence. Neither status proves mobile parity.

## Mobile integration handoff

Starting in v1.0.40, convert captures into a versioned handoff using `npx mobile-ai-agents@latest network contract --capture /tmp/mobile-api-demo/capture.json --out /tmp/mobile-api-contract-1`. HAR import and optional OpenAPI cross-checking are described in [the contract guide](api-contracts.md). The exporter runs offline without Playwright or device tooling.

Give your coding agent the report, the current app repository, and an explicit target:

```text
Use skills/cross-platform/web-network-to-mobile.md.
Read /tmp/mobile-api-demo/capture.json and report.md as observed browser evidence.
Map each touchpoint to the existing Flutter app's networking and UI architecture.
Cross-check the backend contract before resolving optional fields or auth.
Implement the scoped flow, then verify actual mobile requests and UI behavior.
Keep missing runtime evidence unverified.
```

Use the same process for Android, iOS, React Native and KMP; tooling and runtime proof are target-specific. Mobile MCP UI screenshots do not establish network parity. Use app-owned debug instrumentation or authorized server correlation for the network side.

## Maintainer decisions and validation

Issue [#69](https://github.com/salmanashraf/mobile-ai-agents/issues/69) uses an optional Playwright adapter, a fresh browser context and an owned demo instead of a default browser dependency. CLI command modules and fixtures are already inside the package's shipped `cli/` directory. This resolves the capture-specific adapter/demo choices from #63; the broader MIRROR design/build inventory remains separate. Reuse #54/#55 for device QA/demo and #57 for visual checks rather than duplicating them here.

Run deterministic checks with `npm test`. Browser tests skip when Playwright is absent; require real browser validation with:

```bash
NETWORK_BROWSER_TESTS=1 NETWORK_BROWSER_CHANNEL=chrome node --test test/network-capture.test.js
```

Remove `NETWORK_BROWSER_CHANNEL=chrome` to use installed Playwright Chromium. Browser tests use only a loopback fixture and cover observed shapes, zero/multiple calls, blocked writes/origins, HTTP/network failures and failed actions. They do not validate any mobile runtime.

Discoverability phrases used here describe the delivered behavior: **website API discovery**, **browser network capture**, **HTTP request and response analysis**, and **mobile API integration**. Search-volume and ranking data have not been measured; keywords do not guarantee Google/GitHub placement or virality.
