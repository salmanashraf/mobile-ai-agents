# Additional capabilities for a complete app

Mobile Harness coordinates mobile engineering. Some product requirements also
need a separate runtime, service, or infrastructure owner. Identify these during
discovery and keep their contracts in `DEPENDENCIES.md` and `TASKS.md`.

Optional tracks are not prerequisites for website inspection, API parity, or
MIRROR. Block only the task that depends on missing capabilities.

## Embedded AI

**Trigger:** End users need chat, document understanding, vision, classification,
or on-device inference inside the shipped app.

**Gap:** A coding assistant can write integration code, but the toolkit does not
provide an inference engine, model weights, production API access, or usage budget.

**Solution:** Evaluate a platform SDK or cloud service. Candidates include
Google ML Kit, Gemini Nano availability through supported Android APIs, Apple
Core ML, ExecuTorch, ONNX Runtime, and cloud APIs from OpenAI, Google, or Anthropic.
These are evaluation candidates, not bundled or validated integrations.

Ask what data leaves the device, offline requirements, supported devices,
latency, quality criteria, and budget. Define an inference boundary with input,
output, cancellation, errors, rate limits, and fallback behavior. Keep provider
secrets in a backend rather than a distributable mobile binary.

## Backend and cloud

**Trigger:** The app needs shared accounts, synchronized data, payments,
webhooks, push delivery, file processing, or server-side business rules.

**Gap:** Mobile agents do not provision production cloud resources or establish
database, authentication, billing, and operations ownership automatically.

**Solution:** Route to an existing backend team or a separately selected stack.
Node.js, FastAPI, PostgreSQL, Supabase, and AWS are possible choices, not defaults.
Reuse an existing API contract before proposing replacement infrastructure.

Ask about the existing backend, environments, auth, data ownership, API schema,
privacy constraints, and deployment owner. Request a versioned contract covering
endpoints, schemas, auth, errors, pagination, retries, and idempotency. Specify
test fixtures and integration acceptance criteria before mobile implementation.

## User-facing phone control

**Trigger:** The shipped product itself must navigate other apps on a user's
behalf, rather than simply test the app under development.

**Gap:** Mobile MCP QA is developer testing. A successful emulator test does not
establish a production phone assistant, cross-app permission model, or store eligibility.

**Solution:** Evaluate frameworks such as Minitap mobile-use or Mobile-Agent,
including platform restrictions, user consent, app-store policies, interruption,
device access, and execution bounds. See [the existing optional mobile-use
adapter](mobile-use.md) for its actual scope and verification limits.

Ask whose device and apps are controlled, what actions are allowed, and how the
user stops execution. Define a bounded prototype and independent outcome checks.
Do not treat app focus as isolation or a model's completion message as proof.

## Selection checks

Before choosing any candidate, consult current official documentation and its
license. Record the source URL, checked date, SDK/runtime version, supported OS
and device matrix, distribution rights, costs, data handling, and a small proof
of compatibility. Unknown fields stay unknown. Do not install SDKs, create paid
resources, or authenticate services solely because a candidate is listed here.

## Intake and handoff

APPFORGE and Mobile Harness should ask these three questions only when relevant:

1. Does the shipped app need AI features for its users?
2. Does it need a backend or cloud service that is not already available?
3. Does it need to control other apps as a product feature?

For each triggered track record:

```text
Capability: embedded AI | backend/cloud | product phone control
User outcome:
Existing system and owner:
Inputs and outputs:
Platform and privacy constraints:
Candidate and current primary sources:
Status: not-needed | evaluating | blocked | ready-for-integration
Dependent tasks:
Compatibility evidence:
Next action and owner:
```

Proceed with independent UI, domain logic, and contract-based fixtures while a
service is unavailable. Label fixture-backed behavior; verify real integration
and device behavior separately before reporting the dependent feature complete.

### Example: statement conversion app

A document-import app can build local selection, review, and export without a
cloud inference provider. If optional AI extraction is requested, record its
data-sharing decision and inference contract separately. An unavailable model
blocks AI extraction, not the entire local app. This is an illustrative planning
example, not a claim of a live provider test.

Related delivery issues: [embedded AI #74](https://github.com/salmanashraf/mobile-ai-agents/issues/74),
[backend handoff #75](https://github.com/salmanashraf/mobile-ai-agents/issues/75),
[phone-control evaluation #76](https://github.com/salmanashraf/mobile-ai-agents/issues/76).
