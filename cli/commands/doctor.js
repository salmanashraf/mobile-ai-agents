'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseOptions } = require('../lib/options');
const { inspectMcpConfiguration, loadProjectConfig } = require('./mcp');

function executableOnPath(name, env, fsImpl) {
  const entries = String(env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const entry of entries) {
    const candidate = path.join(entry, name);
    if (fsImpl.existsSync(candidate)) return candidate;
  }
  return null;
}

function defaultRunner(command, args, env) {
  const result = childProcess.spawnSync(command, args, {
    encoding: 'utf8',
    env,
    timeout: 10000,
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : '',
  };
}

function resultStatus(checks) {
  if (checks.some(check => check.status === 'FAIL')) return 'FAIL';
  if (checks.some(check => check.status === 'WARN')) return 'WARN';
  return 'PASS';
}

function parseAdbDevices(output) {
  return String(output)
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    });
}

function collectAndroidDoctor(options = {}) {
  const cwd = options.cwd || process.cwd();
  const env = options.env || process.env;
  const homedir = options.homedir || os.homedir();
  const fsImpl = options.fsImpl || fs;
  const runner = options.runner || defaultRunner;
  const checks = [];
  const sdkCandidates = [
    env.ANDROID_HOME,
    env.ANDROID_SDK_ROOT,
    path.join(homedir, 'Library', 'Android', 'sdk'),
    path.join(homedir, 'Android', 'Sdk'),
  ].filter(Boolean);
  const sdkRoot = sdkCandidates.find(candidate => fsImpl.existsSync(candidate));

  checks.push(sdkRoot
    ? { id: 'android-sdk', status: 'PASS', summary: `Android SDK found at ${sdkRoot}` }
    : {
      id: 'android-sdk',
      status: 'FAIL',
      summary: 'Android SDK was not found.',
      action: 'Install Android Studio/SDK and set ANDROID_HOME or ANDROID_SDK_ROOT.',
    });

  const adb = executableOnPath('adb', env, fsImpl) ||
    (sdkRoot && fsImpl.existsSync(path.join(sdkRoot, 'platform-tools', 'adb')) ? path.join(sdkRoot, 'platform-tools', 'adb') : null);
  if (!adb) {
    checks.push({
      id: 'adb',
      status: 'FAIL',
      summary: 'adb was not found.',
      action: 'Install Android SDK Platform-Tools and add platform-tools to PATH.',
    });
  } else {
    const version = runner(adb, ['version'], env);
    checks.push(version.status === 0
      ? { id: 'adb', status: 'PASS', summary: `adb available at ${adb}`, details: version.stdout.split(/\r?\n/)[0] }
      : { id: 'adb', status: 'FAIL', summary: 'adb exists but could not run.', details: version.stderr || version.error, action: 'Repair Platform-Tools or PATH permissions.' });

    const devicesResult = runner(adb, ['devices'], env);
    const devices = devicesResult.status === 0 ? parseAdbDevices(devicesResult.stdout) : [];
    checks.push(devicesResult.status !== 0
      ? { id: 'android-devices', status: 'FAIL', summary: 'adb could not list devices.', details: devicesResult.stderr || devicesResult.error, action: 'Restart adb and reconnect or authorize the target device.' }
      : devices.some(device => device.state === 'device')
        ? { id: 'android-devices', status: 'PASS', summary: `${devices.filter(device => device.state === 'device').length} ready Android device(s).`, details: devices }
        : { id: 'android-devices', status: 'WARN', summary: 'No ready Android device or emulator is connected.', details: devices, action: 'Start an emulator or connect and authorize a device.' });
  }

  const emulator = executableOnPath('emulator', env, fsImpl) ||
    (sdkRoot && fsImpl.existsSync(path.join(sdkRoot, 'emulator', 'emulator')) ? path.join(sdkRoot, 'emulator', 'emulator') : null);
  if (!emulator) {
    checks.push({
      id: 'android-emulator',
      status: 'WARN',
      summary: 'Android Emulator command was not found.',
      action: 'Install Android Emulator from SDK Manager if emulator QA is required.',
    });
  } else {
    const avdResult = runner(emulator, ['-list-avds'], env);
    const avds = avdResult.status === 0 ? avdResult.stdout.split(/\r?\n/).map(v => v.trim()).filter(Boolean) : [];
    checks.push(avdResult.status !== 0
      ? { id: 'android-emulator', status: 'WARN', summary: 'Emulator exists but AVDs could not be listed.', details: avdResult.stderr || avdResult.error, action: 'Open Android Studio Device Manager and repair the emulator installation.' }
      : avds.length
        ? { id: 'android-emulator', status: 'PASS', summary: `${avds.length} Android Virtual Device image(s) available.`, details: avds }
        : { id: 'android-emulator', status: 'WARN', summary: 'No Android Virtual Device images are configured.', action: 'Create an AVD in Android Studio Device Manager.' });
  }

  const mcpConfigs = inspectMcpConfiguration({ cwd, homedir, fsImpl });
  checks.push(mcpConfigs.length
    ? { id: 'mobile-mcp', status: 'PASS', summary: `Mobile MCP configured for ${mcpConfigs.map(item => item.client).join(', ')}.`, details: mcpConfigs.map(item => item.file) }
    : { id: 'mobile-mcp', status: 'WARN', summary: 'Mobile MCP is not configured for a supported client.', action: 'Run mobile-ai-agents mcp setup --client <client>.' });

  const project = loadProjectConfig({ cwd, fsImpl, configPath: options.configPath });
  if (!project.config) {
    checks.push({
      id: 'project-config',
      status: 'WARN',
      summary: 'Android device QA project configuration is missing.',
      action: 'Run mobile-ai-agents mcp config init --app-id com.example.app.',
    });
  } else if (project.errors.length) {
    checks.push({
      id: 'project-config',
      status: 'FAIL',
      summary: 'Android device QA project configuration is invalid.',
      details: project.errors,
      action: 'Run mobile-ai-agents mcp config validate and correct the listed fields.',
    });
  } else {
    const apk = path.resolve(cwd, project.config.apkPath);
    checks.push(fsImpl.existsSync(apk)
      ? { id: 'project-config', status: 'PASS', summary: 'Android device QA project configuration is valid.', details: project.file }
      : { id: 'project-config', status: 'WARN', summary: 'Project configuration is valid, but the APK does not exist yet.', details: project.config.apkPath, action: 'Build the configured APK before device QA.' });
  }

  return {
    platform: 'android',
    status: resultStatus(checks),
    checkedAt: new Date().toISOString(),
    checks,
  };
}

function printDoctorReport(report) {
  console.log('');
  console.log('  Android Environment Doctor');
  console.log(`  Result: ${report.status}`);
  console.log('');
  for (const check of report.checks) {
    const icon = check.status === 'PASS' ? '✓' : check.status === 'WARN' ? '!' : '✗';
    console.log(`  ${icon} [${check.status}] ${check.summary}`);
    if (check.action) console.log(`    Action: ${check.action}`);
  }
  console.log('');
}

async function cmdDoctor(args) {
  const opts = parseOptions(args);
  const platform = opts.platform === true ? '' : opts.platform;
  if (platform !== 'android') throw new Error('doctor currently requires --platform android.');
  const report = collectAndroidDoctor({ configPath: opts.config === true ? undefined : opts.config });
  if (opts.json) console.log(JSON.stringify(report, null, 2));
  else printDoctorReport(report);
  if (report.status === 'FAIL') process.exitCode = 1;
  return report;
}

module.exports = {
  cmdDoctor,
  collectAndroidDoctor,
  parseAdbDevices,
};
