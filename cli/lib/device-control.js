'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const BRIDGE = path.resolve(__dirname, '../bridges/mobile_use.py');
const SDK_VERSION = '4.0.0';
const UPSTREAM_REVISION = '88daffb20281e0f0a4bb5c5049005c078f63cad6';

function validateTask(task) {
  if (!['android', 'ios'].includes(task.platform)) throw new Error('platform must be android or ios (simulator only in this adapter).');
  if (typeof task.device !== 'string' || !/^[A-Za-z0-9_.:-]{1,150}$/.test(task.device)) throw new Error('Provide an explicit device ID.');
  if (task.platform === 'ios' && !/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/.test(task.device)) throw new Error('iOS requires a simulator UUID; physical iOS is outside this adapter scope.');
  if (typeof task.appId !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_-]+)+$/.test(task.appId)) throw new Error('Provide an explicit app package/bundle ID.');
  if (typeof task.goal !== 'string' || !task.goal.trim() || Buffer.byteLength(task.goal) > 16000) throw new Error('Goal must be nonempty test instructions, at most 16 KiB.');
  if (!Number.isInteger(task.maxSteps) || task.maxSteps < 1 || task.maxSteps > 100) throw new Error('maxSteps must be 1–100.');
  if (!Number.isInteger(task.timeoutSeconds) || task.timeoutSeconds < 10 || task.timeoutSeconds > 600) throw new Error('timeoutSeconds must be 10–600.');
  if (task.platform === 'ios' && process.platform !== 'darwin') throw new Error('iOS simulator control requires macOS.');
  if (process.platform === 'win32') throw new Error('This initial process-group adapter supports macOS/Linux only.');
}

function probeSdk(python = 'python3', { bridge = BRIDGE, env = process.env } = {}) {
  const child = spawnSync(python, [bridge, '--probe'], { env, encoding: 'utf8', timeout: 10000, maxBuffer: 8192, windowsHide: true });
  if (child.error || child.status !== 0) return { status: 'blocked', reason: 'python-unavailable-or-probe-failed' };
  try {
    const result = JSON.parse(child.stdout);
    if (result.status === 'ready' && result.sdkVersion === SDK_VERSION) return { status: 'ready', sdkVersion: SDK_VERSION };
    return { status: 'blocked', reason: ['python-3.12-required', 'sdk-not-installed', 'sdk-version-mismatch'].includes(result.reason) ? result.reason : 'invalid-sdk-probe' };
  } catch { return { status: 'blocked', reason: 'invalid-sdk-probe' }; }
}

async function runTask(task, { python = 'python3', output, execute = false, modelConfig, signal, bridge = BRIDGE, env = process.env } = {}) {
  validateTask(task);
  if (!output) throw new Error('Choose a new output directory.');
  if (execute && (!modelConfig || typeof modelConfig !== 'object' || Array.isArray(modelConfig))) throw new Error('Execution requires a full JSON model configuration.');
  fs.mkdirSync(output, { mode: 0o700 });
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), status: 'planned',
    integration: { name: 'Minitap mobile-use', sdkVersion: SDK_VERSION, upstreamRevision: UPSTREAM_REVISION },
    target: { platform: task.platform, device: task.device, appId: task.appId },
    limits: { maxSteps: task.maxSteps, timeoutSeconds: task.timeoutSeconds },
    goalSha256: createHash('sha256').update(task.goal).digest('hex'),
    mobileVerification: 'unverified',
    limitations: [
      'Upstream app lock is a foreground guard, not a security sandbox or per-action permission gate.',
      'Explicit run sends device observations and instructions to the configured model provider; use an owned test app/device.',
      'No goal text, model output, credentials, stdout or stderr are stored in this report. Upstream may create its own local artifacts.',
      'Timeout/cancellation terminates the process group best-effort; it does not undo device actions or guarantee stopping detached upstream services.',
      'Android/iOS SDK interface mapping is contract-tested; live device/provider execution is not established by stub tests.',
    ],
  };
  const save = () => {
    report.updatedAt = new Date().toISOString();
    if (report.status !== 'running') report.finishedAt = report.updatedAt;
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  };
  if (!execute) { save(); return report; }
  report.modelConfigSha256 = createHash('sha256').update(JSON.stringify(modelConfig)).digest('hex');
  const probe = probeSdk(python, { bridge, env });
  if (probe.status !== 'ready') { report.status = 'blocked'; report.reason = probe.reason; save(); return report; }
  if (signal?.aborted) { report.status = 'cancelled'; save(); return report; }
  // Do not inherit upstream output hooks or opt-in telemetry. Credentials remain in the process environment.
  const childEnv = { ...env, MOBILE_USE_TELEMETRY_ENABLED: 'false', DOTENV_DISABLED: '1', PYTHONUNBUFFERED: '1' };
  delete childEnv.EVENTS_OUTPUT_PATH;
  delete childEnv.RESULTS_OUTPUT_PATH;
  report.status = 'running'; save();
  const child = spawn(python, [bridge], { cwd: output, env: childEnv, detached: true, stdio: ['pipe', 'ignore', 'ignore', 'pipe'] });
  let payload = '', stopping, killTimer;
  const killGroup = name => { try { process.kill(-child.pid, name); } catch { /* Already stopped or spawn failed. */ } };
  const stop = status => {
    if (stopping) return;
    stopping = status;
    killGroup('SIGTERM');
    killTimer = setTimeout(() => killGroup('SIGKILL'), 1500);
  };
  const abort = () => stop('cancelled');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => stop('timed-out'), task.timeoutSeconds * 1000);
  child.stdin.on('error', () => {});
  child.stdio[3].on('data', bytes => {
    if (stopping) return;
    if (Buffer.byteLength(payload) + bytes.length > 8192) { stop('failed'); return; }
    payload += bytes.toString('utf8');
  });
  const exit = await new Promise(resolve => {
    child.once('error', () => resolve({ code: null }));
    child.once('close', (code, terminationSignal) => resolve({ code, terminationSignal }));
    child.stdin.end(JSON.stringify({ ...task, modelConfig }));
  });
  clearTimeout(timer); clearTimeout(killTimer);
  signal?.removeEventListener('abort', abort);
  if (stopping) {
    // Escalate once even if the parent exited quickly, to reap lingering group members.
    killGroup('SIGKILL');
    report.status = stopping;
  } else {
    try {
      const result = JSON.parse(payload);
      if (exit.code === 0 && ['executed-unverified', 'failed', 'blocked'].includes(result.status)) {
        report.status = result.status;
        const reasons = ['independent-device-proof-required', 'sdk-returned-no-result', 'sdk-error-details-suppressed', 'python-3.12-required', 'sdk-not-installed', 'sdk-version-mismatch'];
        report.reason = reasons.includes(result.reason) ? result.reason : 'sdk-result-not-verified';
      } else report.status = 'failed';
    } catch { report.status = 'failed'; }
  }
  report.exitCode = exit.code;
  save();
  return report;
}

module.exports = { validateTask, probeSdk, runTask, SDK_VERSION, UPSTREAM_REVISION };
