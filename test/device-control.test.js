'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { validateTask, probeSdk, runTask } = require('../cli/lib/device-control');

const task = { platform: 'android', device: 'emulator-5554', appId: 'com.example.demo', goal: 'Inspect a test app; private-marker', maxSteps: 5, timeoutSeconds: 10 };
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'device-control-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function requirePython(t) {
  if (spawnSync('python3', ['--version']).status !== 0) { t.skip('Python 3 needed for bridge contract tests.'); return false; }
  return true;
}
function stub(root) {
  const bridge = path.join(root, 'stub.py');
  fs.writeFileSync(bridge, `import json, os, sys, time
if '--probe' in sys.argv:
 print(json.dumps({'status':'ready','sdkVersion':'4.0.0'})); sys.exit(0)
task=json.load(sys.stdin)
assert os.getenv('MOBILE_USE_TELEMETRY_ENABLED') == 'false'
assert os.getenv('PYTHON_DOTENV_DISABLED') == '1'
assert os.getenv('EVENTS_OUTPUT_PATH') is None
mode=os.getenv('STUB_MODE','ok')
if mode == 'sleep': time.sleep(30)
if mode == 'crash': sys.exit(2)
print('private-marker from upstream')
with os.fdopen(3,'w') as out:
 out.write('bad protocol' if mode == 'malformed' else json.dumps({'status':'executed-unverified','reason':'independent-device-proof-required'}))
`);
  return bridge;
}

test('plan is offline and does not persist goal, overwrite a run or invoke Python', async t => {
  const root = fixture(t);
  const output = path.join(root, 'plan');
  const report = await runTask(task, { output, python: 'not-a-real-python' });
  assert.equal(report.status, 'planned');
  assert.equal(report.mobileVerification, 'unverified');
  assert.equal(fs.readFileSync(path.join(output, 'result.json'), 'utf8').includes('private-marker'), false);
  await assert.rejects(runTask(task, { output }), /EEXIST/);
});

test('task validation rejects ambiguous devices, unsafe bounds, unsupported platform and unapproved execution', async t => {
  for (const change of [{ device: '' }, { maxSteps: 0 }, { maxSteps: 101 }, { timeoutSeconds: 601 }, { appId: '../app' }, { platform: 'ios', device: 'physical-udid' }, { platform: 'web' }]) assert.throws(() => validateTask({ ...task, ...change }));
  const root = fixture(t);
  await assert.rejects(runTask(task, { output: path.join(root, 'invalid'), execute: true }), /model configuration/);
  const cli = spawnSync(process.execPath, [path.resolve(__dirname, '../cli/index.js'), 'device-control', 'run'], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /--execute/);
});

test('missing Python produces blocked evidence rather than executing or claiming success', async t => {
  const root = fixture(t);
  assert.equal(probeSdk('/nonexistent/python').status, 'blocked');
  const report = await runTask(task, { output: path.join(root, 'blocked'), execute: true, python: '/nonexistent/python', modelConfig: {} });
  assert.equal(report.status, 'blocked');
});

test('SDK probe rejects wrong versions and malformed responses', t => {
  if (!requirePython(t)) return;
  const root = fixture(t);
  for (const [name, text] of [['version', '{"status":"ready","sdkVersion":"5.0.0"}'], ['malformed', 'not-json']]) {
    const bridge = path.join(root, `${name}.py`);
    fs.writeFileSync(bridge, `print(${JSON.stringify(text)})`);
    assert.equal(probeSdk('python3', { bridge }).status, 'blocked');
  }
});

test('subprocess execution distinguishes unverified, crashes and invalid protocol without saving raw output', async t => {
  if (!requirePython(t)) return;
  const root = fixture(t), bridge = stub(root);
  for (const mode of ['ok', 'crash', 'malformed']) {
    const report = await runTask(task, { output: path.join(root, mode), execute: true, modelConfig: { apiKey: 'private-config' }, bridge, env: { ...process.env, STUB_MODE: mode, EVENTS_OUTPUT_PATH: 'unwanted.json' } });
    assert.equal(report.status, mode === 'ok' ? 'executed-unverified' : 'failed');
    const text = JSON.stringify(report);
    assert.equal(text.includes('private-marker'), false);
    assert.equal(text.includes('private-config'), false);
  }
});

test('cancellation and wall-clock timeout terminate the isolated runtime', { timeout: 20000 }, async t => {
  if (!requirePython(t)) return;
  const root = fixture(t), bridge = stub(root);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 250);
  const cancelled = await runTask(task, { output: path.join(root, 'cancelled'), execute: true, modelConfig: {}, bridge, env: { ...process.env, STUB_MODE: 'sleep' }, signal: controller.signal });
  clearTimeout(timer);
  assert.equal(cancelled.status, 'cancelled');
  const timed = await runTask(task, { output: path.join(root, 'timeout'), execute: true, modelConfig: {}, bridge, env: { ...process.env, STUB_MODE: 'sleep' } });
  assert.equal(timed.status, 'timed-out');
});

test('Python SDK mapping and cleanup contract tests (stub SDK, no live provider/device)', t => {
  if (!requirePython(t)) return;
  const result = spawnSync('python3', [path.resolve(__dirname, 'device_control_bridge_test.py')], { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
