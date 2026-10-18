'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseOptions } = require('../lib/options');
const { runTask, probeSdk } = require('../lib/device-control');

async function cmdDeviceControl(args) {
  const opts = parseOptions(args);
  const command = opts._.join(' ');
  const allowed = ['_', 'python', ...(command === 'doctor' ? [] : ['platform', 'device', 'app-id', 'goal-file', 'out', 'max-steps', 'timeout', 'model-config', 'execute'])];
  if (!['doctor', 'plan', 'run'].includes(command) || Object.keys(opts).some(key => !allowed.includes(key))) throw new Error('Usage: device-control doctor [--python PATH] | plan|run --platform android|ios --device ID --app-id ID --goal-file FILE --out NEW_DIR [--max-steps 20] [--timeout 120] [--python PATH]; run also requires --execute --model-config JSON_FILE');
  for (const key of Object.keys(opts)) if (!['_', 'execute'].includes(key) && typeof opts[key] !== 'string') throw new Error(`--${key} needs a value.`);
  if (command === 'doctor') {
    const result = probeSdk(opts.python);
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'ready') process.exitCode = 1;
    return;
  }
  if (command === 'run' && opts.execute !== true) throw new Error('Review the plan, then pass --execute to run against the selected test device and model provider.');
  if (command === 'plan' && (opts.execute || opts['model-config'])) throw new Error('Plan never executes or needs a model config. Use run --execute for device control.');
  for (const key of ['platform', 'device', 'app-id', 'goal-file', 'out']) if (!opts[key]) throw new Error(`--${key} is required.`);
  const goalFile = path.resolve(opts['goal-file']);
  if (fs.statSync(goalFile).size > 16000) throw new Error('Goal file exceeds 16 KiB.');
  let modelConfig;
  if (command === 'run') {
    if (!opts['model-config']) throw new Error('--model-config is required for non-interactive execution.');
    if (fs.statSync(opts['model-config']).size > 65536) throw new Error('Model config exceeds 64 KiB.');
    modelConfig = JSON.parse(fs.readFileSync(opts['model-config'], 'utf8'));
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
  let report;
  try {
    report = await runTask({ platform: opts.platform, device: opts.device, appId: opts['app-id'], goal: fs.readFileSync(goalFile, 'utf8'), maxSteps: Number(opts['max-steps'] ?? 20), timeoutSeconds: Number(opts.timeout ?? 120) }, { python: opts.python, output: path.resolve(opts.out), execute: command === 'run', modelConfig, signal: controller.signal });
  } finally { process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); }
  console.log(`${report.status}: ${path.resolve(opts.out, 'result.json')}`);
  console.log('Device outcome verification remains unverified; use independent Mobile MCP/device proof.');
  if (!['planned', 'executed-unverified'].includes(report.status)) process.exitCode = report.status === 'cancelled' ? 130 : 1;
}
module.exports = { cmdDeviceControl };
