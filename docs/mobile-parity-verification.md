# Browser contract → real mobile network and UI verification

`network verify` compares a versioned browser API contract with evidence produced by an actual mobile runtime. It reports web capture, mobile network and mobile UI independently for every touchpoint. It never launches a device, intercepts traffic, replays requests or changes production TLS settings by itself.

**Availability:** included in `mobile-ai-agents@1.0.43` and newer. Contract export starts in 1.0.40 and existing-app handoffs in 1.0.42.

## Run the comparison

```bash
npx mobile-ai-agents@latest network verify \
  --contract /path/to/contract.json \
  --mobile /path/to/mobile-evidence.json \
  --out /tmp/mobile-parity-1
```

Every output directory must be new. The command reads local JSON only and writes private `parity.json` and `parity.md`. A mismatch exits nonzero. Missing visibility or runtime evidence returns `UNVERIFIED` without pretending it is a failure. `VERIFIED` requires every supplied touchpoint to pass browser capture, mobile network and mobile UI checks; all build checks and required scenarios must also pass.

The comparison checks HTTP method, path, query-key set, response status and request/response body shapes. Test origins and query values may vary. It does not silently normalize methods, paths, statuses or schema differences. Documented JSON pointers for `server-generated-id` and `server-timestamp` are retained in the report but are not used to hide structural mismatches.

A root `GET /` returning `text/html` can be marked `not-applicable` with `nativeDifference: "browser-document-shell"`. This is the only built-in native difference because a native app does not load the website document shell. API calls cannot use this exclusion.

## Mobile evidence envelope

Use app-owned debug instrumentation, authorized server correlation or a supported test capture tool. Keep raw tokens, cookies, personal data and body values out of the file. Preserve body types as shapes.

```json
{
  "evidenceVersion": "1.0.0",
  "capturedAt": "2026-11-19T00:00:00Z",
  "environment": "authorized-staging",
  "runtimeObserved": true,
  "target": {
    "platform": "ios",
    "runtime": "iOS Simulator 26.5",
    "buildId": "debug-abc123"
  },
  "touchpoints": [{
    "id": "T2",
    "networkVisibility": "observed",
    "ui": "pass",
    "requests": [{
      "id": "R2",
      "method": "GET",
      "url": "https://test.example/api/items?build=mobile",
      "status": 200,
      "request": { "state": "empty" },
      "response": {
        "state": "observed",
        "schema": {
          "type": "object",
          "properties": {
            "items": { "type": "array", "items": { "type": "object", "properties": {} } }
          }
        }
      }
    }]
  }],
  "scenarios": [
    { "name": "auth-expiry", "status": "pass", "evidence": "authorized test observed 401 and session-expired UI" },
    { "name": "invalid-input", "status": "pass", "evidence": "blank value rejected before transport" },
    { "name": "offline-failure", "status": "pass", "evidence": "transport failure reached error UI" },
    { "name": "duplicate-submission", "status": "pass", "evidence": "server observed one write" }
  ],
  "buildChecks": [{ "name": "ios-simulator-build", "status": "pass" }],
  "normalization": [{ "pointer": "/items/0/id", "reason": "server-generated-id" }]
}
```

Statuses are `pass`, `fail` or `unverified`. Network visibility is `observed`, `missing` or the narrowly documented browser-shell `not-applicable`. Scenario evidence text is hashed in the output report so arbitrary runtime text is not copied. The original evidence file remains the source. Unknown touchpoints, duplicate IDs, unsafe URLs, unbounded shapes and unsupported normalization reasons are rejected.

When a target runtime is unavailable, set `runtimeObserved` to `false`, use empty touchpoint/scenario arrays and include an unverified availability build check. The result stays `UNVERIFIED`. Do not reuse another platform's result.

## Runnable iOS simulator proof

The repository ships an owned fixture that establishes both sides of the comparison:

```bash
NODE_PATH=/path/to/playwright/node_modules \
  cli/fixtures/mobile-parity/run-ios-simulator.sh /tmp/mobile-parity-ios-1
```

It requires macOS, a booted iOS simulator, Xcode command-line tools and Playwright with Chrome. The script:

1. starts an owned local server;
2. captures a real Chrome click and exports its contract;
3. compiles and signs a small SwiftUI app for the booted simulator;
4. installs and launches the app against the same fixture;
5. records app-owned network/UI evidence for the list request, auth expiry, local invalid input, offline failure and duplicate-write prevention;
6. saves a simulator screenshot and runs `network verify`.

This fixture uses local HTTP only through an app-specific simulator setting. Do not copy that setting into production or weaken certificate pinning. Its result proves only the owned iOS fixture, simulator runtime and build shown in the report. Android, Flutter, React Native, KMP, physical devices and product applications remain unverified until separately run.

## Verification rules

- Compare equivalent fixtures, deployment identity and initial state. A screenshot proves UI state, not network parity.
- Preserve request IDs and touchpoint IDs from capture through app evidence. Report missing network visibility rather than inferring calls from UI success.
- Exercise auth expiry, invalid input, offline/failure and duplicate submission using authorized test data. Do not probe destructive production writes.
- Use current app debug instrumentation or supported capture/server correlation. Never disable production TLS or certificate pinning.
- Keep actual build checks in the evidence. Generated code, mocks and host-only tests cannot establish a mobile runtime result.
- Store screenshots and evidence outside source control unless they are sanitized, intentionally reviewed fixtures.

Implementation: [#72](https://github.com/salmanashraf/mobile-ai-agents/issues/72). The next target should reuse the same contract/evidence format and remain `UNVERIFIED` until its own device run passes.
