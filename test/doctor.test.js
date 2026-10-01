'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { collectAndroidDoctor, parseAdbDevices } = require('../cli/commands/doctor');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ai-agents-doctor-'));
}

test('adb device output is parsed into serial and state', () => {
  assert.deepEqual(parseAdbDevices('List of devices attached\nemulator-5554\tdevice\nphone\tunauthorized\n'), [
    { serial: 'emulator-5554', state: 'device' },
    { serial: 'phone', state: 'unauthorized' },
  ]);
});

test('doctor reports actionable failures when Android tools are missing', () => {
  const root = tempDir();
  const report = collectAndroidDoctor({
    cwd: root,
    homedir: root,
    env: { PATH: '' },
  });

  assert.equal(report.status, 'FAIL');
  assert.equal(report.checks.find(check => check.id === 'android-sdk').status, 'FAIL');
  assert.match(report.checks.find(check => check.id === 'adb').action, /Platform-Tools/);
});

test('doctor warns when tools exist but no AVD or ready device exists', () => {
  const root = tempDir();
  const sdk = path.join(root, 'sdk');
  const adb = path.join(sdk, 'platform-tools', 'adb');
  const emulator = path.join(sdk, 'emulator', 'emulator');
  fs.mkdirSync(path.dirname(adb), { recursive: true });
  fs.mkdirSync(path.dirname(emulator), { recursive: true });
  fs.writeFileSync(adb, '');
  fs.writeFileSync(emulator, '');

  const runner = (command, args) => {
    if (args[0] === 'version') return { status: 0, stdout: 'Android Debug Bridge version 1.0.41\n', stderr: '', error: '' };
    if (args[0] === 'devices') return { status: 0, stdout: 'List of devices attached\n\n', stderr: '', error: '' };
    return { status: 0, stdout: '', stderr: '', error: '' };
  };
  const report = collectAndroidDoctor({
    cwd: root,
    homedir: root,
    env: { PATH: '', ANDROID_HOME: sdk },
    runner,
  });

  assert.equal(report.status, 'WARN');
  assert.equal(report.checks.find(check => check.id === 'android-devices').status, 'WARN');
  assert.equal(report.checks.find(check => check.id === 'android-emulator').status, 'WARN');
});

test('doctor identifies invalid project configuration', () => {
  const root = tempDir();
  const configDir = path.join(root, '.mobile-ai-agents');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, 'android-device.json'), '{"platform":"ios"}\n');

  const report = collectAndroidDoctor({
    cwd: root,
    homedir: root,
    env: { PATH: '' },
  });
  const project = report.checks.find(check => check.id === 'project-config');

  assert.equal(project.status, 'FAIL');
  assert.match(project.details.join(' '), /platform/);
});
