# Natural-language mobile device control with Minitap mobile-use

Give a bounded task to an AI device agent through an optional external SDK. This repository provides the plan/run bridge, limits and reporting; [Minitap mobile-use](https://github.com/minitap-ai/mobile-use) supplies the device-control runtime.

**Status:** Offline planning, SDK mapping and process lifecycle are tested. Live model/device execution is not verified by this integration's tests. The new command is available from this checkout; npm availability follows release.

## What is included

| Capability | This integration |
|---|---|
| Natural-language task | Local goal file passed to the SDK through stdin |
| Target | Explicit Android device/emulator or iOS simulator UUID |
| Model | User-configured provider, full JSON config and external credentials |
| Bounds | 1–100 SDK steps; 10–600 seconds wall clock |
| App focus | Upstream locked app package/bundle ID |
| Evidence | Private `result.json` with target, limits, status and hashes |
| Completion | SDK output is `executed-unverified`; verify the outcome independently |

Mobile MCP QA remains the existing path for developer testing with assertions, screenshots and Device Proof Reports. This adapter is for explicit adaptive device-control requests. It does not embed an AI model inside a mobile app, capture mobile API traffic, or provide a user-facing phone-assistant product by itself.

## Try an offline plan first

From the repository checkout, create a local goal file for an **owned test app**:

```bash
printf '%s\n' 'Inspect the test app home screen without changing data.' > /tmp/mobile-use-goal.txt
node cli/index.js device-control plan \
  --platform android --device emulator-5554 --app-id com.example.demo \
  --goal-file /tmp/mobile-use-goal.txt --max-steps 5 --timeout 30 \
  --out /tmp/mobile-use-plan-1
```

Use the real package ID and device ID for your test app. The command writes a plan without invoking Python, a device or a model. Each run requires a new output directory whose parent already exists; prior evidence is never overwritten. The directory has owner-only permissions on supported systems. Do not put personal data, passwords or tokens in the goal.

## Optional SDK setup

The adapter targets `minitap-mobile-use==4.0.0` with Python 3.12+. It refuses other versions until their interfaces are reviewed. The project does not automatically install Python dependencies, select paid models, add provider credentials, enable device permissions or start cloud devices.

Install the SDK in a separate environment if you want to execute tasks:

```bash
python3.12 -m venv /tmp/mobile-use-venv
/tmp/mobile-use-venv/bin/python -m pip install minitap-mobile-use==4.0.0
node cli/index.js device-control doctor --python /tmp/mobile-use-venv/bin/python
```

Doctor checks Python/package metadata only. `ready` does not mean device tools, provider credentials or the app are available. Import/runtime incompatibilities can still fail execution.

- **Android:** Follow [upstream setup](https://github.com/minitap-ai/mobile-use#manual-launch-development-mode), enable the required test-device debugging access and select the serial shown by `adb devices`. An installed test app is required; this wrapper does not install it.
- **iOS:** This adapter accepts simulator UUIDs on macOS only. Follow upstream Xcode/IDB requirements and select the simulator UUID. Physical iOS, cloud devices and Windows process control are outside this initial adapter. Upstream code and README have differing physical-iOS scope; this is deliberately not advertised as validated here.
- Configure provider credentials in the selected process environment using upstream's documented variable names. This bridge disables dotenv loading and runs in a fresh output directory; it does not import your project's `.env` or save credentials.

### Explicit model configuration

The SDK has several agent roles. A full JSON configuration prevents an interactive model-selection prompt or silent fallback. Choose a supported provider/model using upstream guidance, set the environment variables `MOBILE_PROVIDER` and `MOBILE_MODEL` to those non-secret names, then generate a config:

```bash
node <<'JS'
const fs = require('node:fs');
const { MOBILE_PROVIDER: provider, MOBILE_MODEL: model } = process.env;
if (!provider || !model) throw new Error('Set MOBILE_PROVIDER and MOBILE_MODEL to your selected provider/model first.');
const role = { provider, model, fallback: { provider, model } };
const config = Object.fromEntries(['planner', 'orchestrator', 'contextor', 'cortex', 'executor'].map(name => [name, role]));
config.utils = { outputter: role, hopper: role };
fs.writeFileSync('/tmp/mobile-use-model.json', JSON.stringify(config, null, 2), { flag: 'wx', mode: 0o600 });
JS
```

This is a configuration shape, not a recommendation to use one model for every role. You can supply a richer full JSON config. Provider keys belong in the environment, never in this JSON file. The bridge validates the explicit config through the SDK rather than calling upstream's interactive/default configuration loader.

## Execute the scoped task

After reviewing the plan and setting up an authorized test device and provider:

```bash
node cli/index.js device-control run --execute \
  --python /tmp/mobile-use-venv/bin/python \
  --platform android --device emulator-5554 --app-id com.example.demo \
  --goal-file /tmp/mobile-use-goal.txt --model-config /tmp/mobile-use-model.json \
  --max-steps 5 --timeout 30 --out /tmp/mobile-use-run-1
```

Execution can send the task and device observations to the configured model service and incur its usage charges. Use an app/device with test data; this autonomous loop has no per-action approval UI. Upstream app lock establishes foreground focus, **not a security sandbox** or a guarantee that the agent cannot trigger an external side effect. Goal wording is not an enforceable action policy. Do not run payments, private messaging or sensitive production workflows through this initial adapter.

Ctrl+C requests cancellation. The process group receives termination and then forced termination if needed. This is best effort: remote/device actions may already have occurred and upstream can launch detached services. Inspect actual device state before retrying; the wrapper never automatically retries a failed task or rolls it back.

## Result and verification

| Status | Meaning |
|---|---|
| `planned` | No SDK/model/device invoked |
| `blocked` | Python/package prerequisites failed |
| `executed-unverified` | SDK returned a result rather than None; product outcome remains unverified |
| `failed` | SDK/protocol/process failure or no result returned |
| `timed-out` | Wall-clock budget reached; partial effects may remain |
| `cancelled` | User requested interruption; partial effects may remain |

Planned and executed-unverified return exit code 0 for the adapter operation; that code is **not a passed product test**. Other states return nonzero (cancellation: 130). Use Mobile MCP/device tooling to verify the expected outcome separately, with actual screenshots/assertions where available. Never promote a model's claim to independent verification or treat device screenshots as proof of API parity.

`result.json` omits raw goal text, provider config, credentials, model output and process stdout/stderr. It retains target identifiers, step/time limits, hashes and non-sensitive status reasons. Treat hashes as correlation data, not anonymization. Optional upstream telemetry and task trace/thought/output saving are disabled. Upstream may still create its own logs/artifacts, so review the output directory and upstream behavior before sharing anything. The report alone cannot establish that no private content was processed by the SDK/provider.

## Validation and provenance

Run `npm test` for offline Node/Python bridge tests. Tests use a stub SDK/runtime and exercise explicit device/app mapping, bounded execution, omitted output, failure, no-result, cleanup, cancellation and timeout. They neither contact a model provider nor manipulate a phone. The released 4.0.0 wheel was also inspected without installing dependencies to confirm the bridge's method names and initialization arguments. The offline `plan` command is runnable without Python or SDK installation. A live phone-and-model smoke run remains a follow-up before any end-to-end support claim.

Inspected upstream revision: [`88daffb20281e0f0a4bb5c5049005c078f63cad6`](https://github.com/minitap-ai/mobile-use/tree/88daffb20281e0f0a4bb5c5049005c078f63cad6). SDK compatibility target: [PyPI 4.0.0](https://pypi.org/project/minitap-mobile-use/4.0.0/). Update the version guard only after reviewing SDK interfaces and rerunning contract plus live-runtime checks.

**Attribution:** Device automation is provided by Minitap, Inc.'s [mobile-use](https://github.com/minitap-ai/mobile-use), independently licensed [Apache-2.0](https://github.com/minitap-ai/mobile-use/blob/88daffb20281e0f0a4bb5c5049005c078f63cad6/LICENSE), with its upstream [NOTICE](https://github.com/minitap-ai/mobile-use/blob/88daffb20281e0f0a4bb5c5049005c078f63cad6/NOTICE). This repository's bridge and skill are original interface integrations; no upstream source, branding or model weights are redistributed. No upstream benchmark result is claimed as a toolkit result.

Implementation: [#81](https://github.com/salmanashraf/mobile-ai-agents/issues/81). Real model/device smoke validation: [#82](https://github.com/salmanashraf/mobile-ai-agents/issues/82). Broader product phone-control feasibility remains [#76](https://github.com/salmanashraf/mobile-ai-agents/issues/76).
