# Browser evidence → mobile API handoff contracts

The `network contract` command converts captured website traffic into a versioned, traceable mobile handoff. It runs locally without Playwright, a device or a model provider. It never sends requests to the captured site, replays API calls, or generates mobile clients.

**Availability:** Included in `mobile-ai-agents@1.0.40` and newer. This follows the [v1.0.39 capture feature](website-api-discovery.md). Implementation is tracked in [#70](https://github.com/salmanashraf/mobile-ai-agents/issues/70).

## From the owned demo or an authorized capture

Run the [capture quickstart](website-api-discovery.md) to obtain `capture.json`, then:

```bash
npx mobile-ai-agents@latest network contract \
  --capture /tmp/mobile-api-demo/capture.json \
  --out /tmp/mobile-api-contract-1
```

Optionally compare against a local OpenAPI 3.0/3.1 **JSON** document:

```bash
npx mobile-ai-agents@latest network contract \
  --capture /tmp/mobile-api-demo/capture.json \
  --openapi /path/to/openapi.json \
  --out /tmp/mobile-api-contract-2
```

The output contains `contract.json` and `contract.md`. Every output directory must be new; the parent must exist. Files have owner-only permissions where supported. Inputs are limited to 10 MiB, 500 requests, 100 touchpoints, and bounded schema depth/property/item sampling. Unsupported versions or inconsistent request/touchpoint references fail before output is written. A successful command means **export completed**, not schema conformance of the API or verified mobile behavior.

## From a HAR export

```bash
npx mobile-ai-agents@latest network contract \
  --har /path/to/session.har \
  --out /tmp/mobile-api-har-contract-1
```

The importer reads the common HAR `log.entries` transaction layout, header lists, request postData and response content (including base64 JSON). Request cookies, raw values, file names and response strings are not copied into the output. Missing response content remains unavailable. Multipart parameter names/types are preserved when supplied; raw multipart parsing and upload-stage reconstruction are not attempted.

HAR does not reliably identify UI actions. All imported transactions belong to an explicitly **unattributed** `T0` touchpoint; neither HAR `pageref` nor request order is treated as a tap/click. Use captured touchpoint evidence when action provenance matters. This importer is a subset reader, not a complete HAR validator.

## What the contract says

| Evidence | Meaning |
|---|---|
| `observed` | Type, status, field presence or header name recorded in supplied traffic |
| `documented` | Selected OpenAPI fields, kept alongside observations |
| `inferred` | Auth/pagination candidates requiring confirmation, never established semantics |

`contractVersion` is `1.0.0`. The [JSON Schema](../cli/schemas/api-contract.schema.json) describes the output format. Runtime checks additionally enforce unique IDs and complete request-to-touchpoint mappings. Source hashes support correlation; they do not anonymize inputs or prove that two captures represent the same deployment.

The contract links touchpoint IDs → ordered request IDs → request/response shapes and status → capture action outcome. Existing capture IDs are retained; HAR request IDs derive from entry order. A completed browser action is not proof of its business outcome. Redirect references are observed links; all other causal dependencies remain unverified.

- Presence of a JSON field does not make it required. Seeing `null` records one observed type, not all permitted nullability. A sample number may be integer or fractional; values are omitted, so the comparison does not guess.
- Enum values, units, pagination behavior and complete error coverage cannot be established from a single sample. Recognized pagination query names are unconfirmed candidates. An explicit OpenAPI `x-unit` is retained as documented metadata, not inferred from values.
- Cookie/CSRF headers and BFF-like paths flag a mobile-auth handoff. The exporter never converts a captured browser session into mobile credentials or invents a supported mobile endpoint.
- GraphQL-shaped fields flag an unconfirmed protocol candidate, including an `errors` field in a 200 response. Operation values and GraphQL semantics remain unavailable. Multipart upload stages and socket/SSE frames need additional evidence.
- Partial/failed captures stay marked in the source metadata. Missing/omitted bodies and unknown status codes produce findings. No evidence gap becomes a pass.

## OpenAPI comparison limits

This is a focused cross-check, not a full OpenAPI validator or client generator. It matches HTTP methods and paths with server prefixes, local path parameters, literal-path precedence and non-variable server origins. Ambiguous routes are reported. Relative/default servers use the observed origin; server variables, external references and YAML inputs are not resolved.

Local JSON Pointer references, basic types, nullability, array item observations, required object fields and required query/header presence are compared. Documented enum counts, selected formats and explicit units can be retained, but enum/example/default/description values are omitted. Composition, numeric constraints, contextual read/write rules, complex parameter serialization and other unimplemented validation remain unverified. Unresolved refs and complex schema constraints produce findings. An unmatched response status or media type is surfaced rather than silently assigned a different contract.

Observed facts are not overwritten by documentation. If the response contains a number where documentation says string, both sources remain present and the discrepancy is reported. Confirm whether the API, documentation or sample context needs correction before mobile implementation.

## Privacy and mobile handoff

The exporter reconstructs an allowlisted shape vocabulary even when supplied capture JSON claims to be sanitized. It removes body scalar values, arbitrary metadata, header/query values and examples. It retains structural identifiers, origins, readable route segments, field names and selected documented metadata; review these before sharing. Keep raw HAR and private OpenAPI/backend files local. This is not a guarantee of anonymous output.

Pass the exported contract to [web-network-to-mobile](../skills/cross-platform/web-network-to-mobile.md), resolve findings against the supported backend contract, and implement in the app's existing stack. [#71](https://github.com/salmanashraf/mobile-ai-agents/issues/71) handles platform-preserving implementation; [#72](https://github.com/salmanashraf/mobile-ai-agents/issues/72) handles actual mobile network/UI parity. Every export remains `needs-review` with `mobileVerification: unverified`.

## Validation

`node --test test/api-contract.test.js` covers provenance, nullable/required-field conflicts, local refs, ambiguous/unsupported documentation, GraphQL errors, multipart metadata, missing HAR bodies, redaction, invalid mappings and CLI output behavior. The real-browser capture regression also exports the owned demo into a contract. No third-party production site or mobile app is contacted by contract processing.

Reference formats: [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0.html) and the historical [HAR layout](https://webperfwg.org/specs/HAR/Overview.html). The HAR document is an abandoned historical draft, not presented here as a current W3C standard.
