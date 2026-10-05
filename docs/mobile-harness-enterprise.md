# Mobile Harness Enterprise Contract

Mobile Harness can operate as a lightweight solo-developer loop or as a governed execution system for larger engineering organizations. The enterprise contract adds reproducibility, policy-controlled gates, ownership, traceable exceptions, rollback planning, and machine-readable evidence without changing the one-task-at-a-time delivery model.

## What The Contract Solves

Large teams need more than a narrative that says tests passed. They need to know:

- which repository state and approved task a run started from
- what files the agent was allowed to change
- why the change was classified as low, medium, high, or regulated risk
- which gates were required by policy and who owns them
- which command, screenshot, review, or approval proves each claim
- whether an exception was authorized and when it expires
- how to recover if a high-risk change fails
- how CI can consume the final result without parsing Markdown

## Contract Files

| File | Purpose |
|---|---|
| `HARNESS_POLICY.json` | Repository policy: risk rules, gates, ownership, commands, protected paths, evidence retention, and exceptions |
| `templates/mobile-harness-policy.schema.json` | Versioned policy schema |
| `templates/mobile-harness-result.schema.json` | Versioned machine-readable result schema |
| `templates/mobile-harness-evidence.schema.json` | Versioned evidence-manifest schema |
| `templates/mobile-harness-result.example.json` | Example CI result that references evidence IDs |
| `templates/mobile-harness-evidence.example.json` | Example hashed evidence manifest |
| `MOBILE_HARNESS_REPORT.md` | Human-readable result and next action |
| `.mobile-ai-agents/harness/runs/<runId>/result.json` | CI/audit result for one run |
| `.mobile-ai-agents/harness/runs/<runId>/evidence.json` | Append-only evidence index with SHA-256 hashes |

Initialize a policy from any app project:

```bash
npx mobile-ai-agents harness policy init --profile enterprise
npx mobile-ai-agents harness policy validate
```

The initializer is idempotent and will not replace a customized policy unless `--force` is explicit. Use `--profile startup`, `team`, `enterprise`, or `regulated`, then customize owners, commands, protected paths, retention, and risk rules before enabling required approvals.

Initialization also installs the policy, result, and evidence schemas under `.mobile-ai-agents/harness/schemas/`. `HARNESS_POLICY.json` references the local policy schema so validation works offline and uses the same contract in editors and CI.

## Run Lifecycle

```text
PREFLIGHT
  -> identify baseline commit and dirty state
  -> create immutable runId and run directory
  -> load policy and classify risk
  -> approve scope, protected paths, and change budget
PLAN / DESIGN / TASK
IMPLEMENT ONE TASK
VERIFY REQUIRED GATES
  -> hash evidence and reference artifact IDs
  -> compare actual changes to approved scope
  -> verify rollback for high/regulated work
RESULT
  -> MOBILE_HARNESS_REPORT.md
  -> result.json
  -> evidence.json
CHECKPOINT / NEXT ACTION
```

A resumed run keeps the same `runId` only when its baseline and scope remain valid. A material scope or baseline change starts a linked run so evidence from different decisions is never merged invisibly.

## Risk Levels

| Level | Examples | Expected Controls |
|---|---|---|
| `low` | Documentation, copy, isolated visual token | Scope and focused tests |
| `medium` | Ordinary feature, local refactor, screen behavior | Review, static analysis, tests, PRD verification |
| `high` | Authentication, payments, permissions, sensitive storage, migrations, signing, CI | Accountable owner, integration/device QA, security, supply-chain review, tested rollback |
| `regulated` | Health, finance, children, identity, controlled or retained personal data | High-risk controls plus privacy, retention, traceable approval, release approval |

The highest matching rule wins. Agents cannot lower risk to avoid a gate.

## Scope And Protected Changes

Every run records:

- allowed files or modules
- expected file count or bounded change budget
- protected paths from policy
- actual changed files
- out-of-scope files

Unrelated dirty-worktree changes remain outside run evidence. Lockfile, dependency, generated-code, migration, signing, and CI changes need explicit treatment because their impact can exceed the visible source edit.

## Gate Semantics

| Status | Meaning |
|---|---|
| `PASS` | Required evidence exists and proves the gate |
| `FAIL` | Evidence shows the requirement was not met |
| `BLOCKED` | A required dependency or decision prevents execution |
| `WAIVED` | Policy permits an accountable, temporary exception |
| `SKIPPED` | Allowed only for a non-required gate |

A required gate cannot silently become `SKIPPED`. A waiver must contain an ID, accountable owner, reason, tracking ticket, creation time, and expiry. Expired waivers fail. Policy can forbid waiver of security, privacy, rollback, release approval, or any other gate.

## Evidence Rules

Every `PASS` claim references evidence IDs rather than prose alone. Each evidence entry contains:

- relative artifact path
- evidence type and producer
- UTC creation time
- SHA-256 hash
- command or source, when applicable
- redaction state

Redact credentials, authorization headers, cookies, tokens, private keys, personal data, production payloads, and customer screenshots before storage or hashing. Evidence proves what ran; it must never be invented when a tool is unavailable.

## Rollback Rules

High and regulated runs define rollback before editing:

- failure trigger
- accountable owner
- exact revert, feature-flag, configuration, or data-recovery steps
- validation command and expected result
- maximum recovery time
- backup/restore evidence for data migrations
- forward-fix limit when rollback cannot fully restore state

Source control reversal alone is not a valid data rollback plan.

## CI Consumption

CI should validate `result.json` against the versioned schema and reject a run unless its status is `PASS` and every required gate is `PASS` or validly `WAIVED`.

Example policy check after schema validation:

```bash
jq -e '
  .status == "PASS" and
  (.scope.outOfScopeFiles | length == 0) and
  all(.gates[]; .status == "PASS" or .status == "WAIVED")
' .mobile-ai-agents/harness/runs/$RUN_ID/result.json
```

Organizations can archive the run directory as a CI artifact and apply their own retention, access control, signing, or attestation layer. Mobile Harness does not claim regulatory certification by itself.

## Recommended Rollout

1. **Observe:** generate reports and evidence without blocking merges.
2. **Enforce scope and tests:** use low/medium policy gates on one repository.
3. **Add ownership:** require review for protected paths and high-risk domains.
4. **Add device and security gates:** connect Mobile MCP, security scanning, and dependency review.
5. **Regulated mode:** involve privacy, legal, security, and release owners; align retention with organizational policy.

Start with the smallest enforceable policy. A policy that every team bypasses provides less safety than a narrow policy with clear ownership and fast evidence.

## Enterprise Prompt

```text
Use MOBILE-HARNESS in PRODUCTION_READY_MVP mode.
Load HARNESS_POLICY.json and enforce the Enterprise Execution Contract.
Create a governed run for TASKS.md task <id>.
Do not edit until run identity, baseline commit, risk, scope, change budget, protected paths, required gates, and rollback requirements are recorded.
Produce MOBILE_HARNESS_REPORT.md, result.json, and evidence.json.
Stop on any missing required owner, forbidden waiver, out-of-scope change, unredacted secret, or failed required gate.
```
