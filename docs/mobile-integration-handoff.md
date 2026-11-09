# Website API contract → existing mobile app implementation

`network handoff` (starting in v1.0.42) turns the [API contract](api-contracts.md) into scoped implementation tasks. It preserves the app's existing stack by requiring reviewed source-file mappings instead of generating a replacement networking layer. It reads local inputs only, never replays requests and never changes the target app.

## Run

```bash
npx mobile-ai-agents@latest network handoff \
  --contract /tmp/mobile-api-contract-1/contract.json \
  --mapping mapping.json --repo /path/to/mobile-app \
  --out /tmp/mobile-handoff-1
```

Every output directory must be new, with an existing parent. Inputs use the contract command's 10 MiB limit. Scanning skips dependency/build folders and symlinks, stops after 20,000 entries and eight directory levels, and reads only supported marker files. Choose a focused app root. Detection is a hint; nested Android modules inside Flutter or RN projects can also produce Android markers. The selected platform must have a marker; `other` always requires a tooling review.

Supply mappings for the actual touchpoint IDs in your contract. This example shows a reviewed Android mapping; replace paths with **existing files in your app**, not invented scaffolding:

```json
{
  "version": 1,
  "platform": "android",
  "touchpoints": [{
    "id": "T1",
    "files": {
      "network": {"path": "app/src/main/java/com/example/data/ItemsApi.kt", "ownership": "native"},
      "auth": {"path": "app/src/main/java/com/example/data/Session.kt", "ownership": "native"},
      "domain": {"path": "app/src/main/java/com/example/domain/Item.kt", "ownership": "native"},
      "state": {"path": "app/src/main/java/com/example/ui/ItemsViewModel.kt", "ownership": "native"},
      "navigation": {"path": "app/src/main/java/com/example/ui/Navigation.kt", "ownership": "native"}
    },
    "requests": [{
      "id": "R1",
      "nativeEndpoint": "supported",
      "nativeAuth": "supported",
      "evidence": "docs/native-api-review.md",
      "findingsReviewed": true
    }]
  }]
}
```

`platform`: `android`, `ios`, `flutter`, `rn`, `kmp`, or `other`. File ownership is `native` or `shared`. Multiple roles may map to one existing file when that matches the real app. Evidence is a local review file, not a remote URL. Keep it free of secrets. Paths must resolve inside the repository; missing files, escapes and external symlinks are rejected. No source text, credentials or captured header values are copied to the report. Paths and hashes are still project metadata: review before sharing.

Record native endpoint and auth support based on backend/mobile documentation and the existing client. `nativeEndpoint` is `supported` or `gap`; `nativeAuth` is `supported`, `not-required` or `gap`. Review evidence should identify the supported native route/auth flow, DTO/domain ownership, schema conflicts, business-call grouping and justified native differences. `findingsReviewed` is a human assertion that findings were reviewed, **not proof that discrepancies are resolved**. Do not set it merely to make a task ready. Contract findings remain authoritative until separately resolved.

Missing role mappings, missing request reviews, auth/endpoint gaps, incomplete captures, unattributed HAR actions or unreviewed contract findings block dependent tasks. No-network touchpoints still get tasks and ownership mappings. Output consists of private `handoff.json` and `handoff.md` with stable touchpoint/request IDs, existing files, gaps, steps and acceptance criteria. `ready-for-review` means there is enough supplied mapping to review a task; it never means implementation or mobile verification passed. Unresolved global findings conservatively block all tasks.

## Platform ownership

| Target | Preserve and map | Runtime status for this feature |
|---|---|---|
| Android | Current Kotlin/Java HTTP client, session, DTO/domain, ViewModel and navigation | Unverified |
| iOS | Current Swift/ObjC session/client, models, state and navigation | Unverified |
| Flutter | Current Dart client, repositories, state and router | Unverified |
| React Native | Current JS/TS client, auth, models, hooks/store and navigation | Reference source and Node HTTP tests; device UI unverified |
| KMP | Existing shared client/domain ownership separately from target auth/UI/navigation | Unverified |
| Other | Reviewed existing toolchain and equivalent boundaries | Unverified; explicit review required |

The CLI does not parse every language, infer architecture from filenames, create universal SDKs, or copy browser headers, analytics, preflight calls and duplicate fetches into a client. Review business-call selection and causal dependencies before wiring code. Independent tasks can proceed while dependent tasks remain blocked.

## Runnable reference: list → detail → validate → save

The packaged [reference files](../cli/fixtures/mobile-handoff/App.jsx) contain a React Native screen, injected-transport client and cancellable state model. They target the repository's owned [HTTP demo](../cli/fixtures/network-demo.js), not a production API. The screen can be mounted inside an existing React Native test project:

1. Start the owned server from this repository: `node cli/fixtures/network-demo.js /tmp/mobile-demo-flow.json` (new flow-file path).
2. Copy `cli/fixtures/mobile-handoff/` into that project's source tree. Import `ReferenceFlow` from `App.jsx` and mount `<ReferenceFlow baseUrl="http://YOUR_TEST_HOST:4173" />` in the existing app. Android emulators normally reach their host using `10.0.2.2`; use a reachable host for your actual target. Configure local HTTP only in the existing debug/test configuration. Do not weaken production TLS or certificate pinning.
3. Tap Load listings, Open detail, enter a title, Save test listing, and Cancel during an outstanding operation. Connect independent device and network evidence to the same touchpoint IDs before claiming parity.

The client issues GET `/api/items`; parallel GET `/api/detail` and `/api/options`; and a single POST `/api/save` with JSON `{title}`. Empty titles are rejected before transport. The browser demo's incidental password field and demonstration bearer token are not native requirements; the owned server accepts the title without them. This is a documented fixture difference, not a strategy for bypassing real auth.

The client accepts the existing app transport for integration. It does not implement token storage or refresh: 401 produces `auth-expired` for the app's established session policy. HTTP 422 produces `validation`; other HTTP failures and network failures stay errors. The model prevents duplicate submissions, makes **no automatic retries**, forwards cancellation via AbortSignal and suppresses late results after cancellation/unmount. The screen is deliberately separate from production navigation and auth ownership.

Uploads are not present in this fixture and remain **not applicable**, rather than tested. If a reference contains uploads, map initialization, signed URL, transfer, completion, progress, cancellation and safe retry/idempotency policy before dependent implementation. Production refresh, upload, retry semantics and platform-specific transport cancellation need their own evidence.

## Reproducible checks and remaining verification

```bash
node --test test/mobile-handoff.test.js
npm test
```

The HTTP tests use a real local server and exercise the same client used by the reference screen. They check list/detail/save, local validation, auth expiry, server validation, cancellation, duplicate prevention and no write retries. Mapping tests cover ownership, KMP boundaries, missing evidence, path containment and output preservation. They do **not** mount a mobile UI, run Metro, build a native binary or establish browser/mobile device parity. The reference is runnable source for an existing React Native test app; no native test harness or dependency installation is bundled.

Continue with [#72](https://github.com/salmanashraf/mobile-ai-agents/issues/72) for actual mobile network/UI parity, reusing Mobile MCP/device QA work in #54/#55. Run relevant build/contract checks, then capture actual mobile requests/responses and UI on each requested target. Use equivalent fixtures/environment/accounts. Screenshots alone do not prove network parity. Implementation source, mocked responses and Node HTTP tests must never be reported as a verified mobile runtime.

Implementation: [#71](https://github.com/salmanashraf/mobile-ai-agents/issues/71). Follow [web-network-to-mobile](../skills/cross-platform/web-network-to-mobile.md) and PRD verification before declaring the user flow complete.
