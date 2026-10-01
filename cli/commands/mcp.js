'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseOptions } = require('../lib/options');

const SERVER_NAME = 'mobile-mcp';
const SERVER_COMMAND = 'npx';
const SERVER_ARGS = ['-y', '@mobilenext/mobile-mcp@latest'];
const PROJECT_CONFIG_PATH = path.join('.mobile-ai-agents', 'android-device.json');

const JSON_CLIENTS = {
  claude: ({ cwd }) => path.join(cwd, '.mcp.json'),
  cursor: ({ cwd }) => path.join(cwd, '.cursor', 'mcp.json'),
  windsurf: ({ homedir }) => path.join(homedir, '.codeium', 'windsurf', 'mcp_config.json'),
};

function ensureParent(file, fsImpl = fs) {
  fsImpl.mkdirSync(path.dirname(file), { recursive: true });
}

function readJsonObject(file, fsImpl = fs) {
  if (!fsImpl.existsSync(file)) return {};
  try {
    const value = JSON.parse(fsImpl.readFileSync(file, 'utf8'));
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new Error('top-level value must be an object');
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${error.message}`);
  }
}

function resolveClientConfig(client, options = {}) {
  const cwd = options.cwd || process.cwd();
  const homedir = options.homedir || os.homedir();
  if (options.configPath) return path.resolve(cwd, options.configPath);
  if (client === 'codex') return path.join(homedir, '.codex', 'config.toml');
  const resolver = JSON_CLIENTS[client];
  if (!resolver) {
    throw new Error('Unsupported MCP client. Use claude, cursor, windsurf, or codex.');
  }
  return resolver({ cwd, homedir });
}

function setupJsonClient(file, fsImpl = fs) {
  const config = readJsonObject(file, fsImpl);
  const servers = config.mcpServers && typeof config.mcpServers === 'object' && !Array.isArray(config.mcpServers)
    ? { ...config.mcpServers }
    : {};
  const desired = { command: SERVER_COMMAND, args: SERVER_ARGS };
  const current = servers[SERVER_NAME];
  const unchanged = current &&
    current.command === desired.command &&
    JSON.stringify(current.args) === JSON.stringify(desired.args);

  if (unchanged) return { changed: false, file, clientFormat: 'json' };

  config.mcpServers = { ...servers, [SERVER_NAME]: desired };
  ensureParent(file, fsImpl);
  fsImpl.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  return { changed: true, file, clientFormat: 'json' };
}

function setupCodexClient(file, fsImpl = fs) {
  const existing = fsImpl.existsSync(file) ? fsImpl.readFileSync(file, 'utf8') : '';
  const block = [
    '[mcp_servers.mobile-mcp]',
    `command = "${SERVER_COMMAND}"`,
    `args = ["${SERVER_ARGS.join('", "')}"]`,
  ].join('\n');
  const sectionPattern = /^\[mcp_servers\.(?:mobile-mcp|"mobile-mcp")\]\s*$/m;
  const match = sectionPattern.exec(existing);
  let next;

  if (!match) {
    const prefix = existing.trimEnd();
    next = `${prefix}${prefix ? '\n\n' : ''}${block}\n`;
  } else {
    const sectionStart = match.index;
    const afterHeader = sectionStart + match[0].length;
    const remainder = existing.slice(afterHeader);
    const nextSection = /^\s*\[[^\]]+\]/m.exec(remainder);
    const sectionEnd = nextSection ? afterHeader + nextSection.index : existing.length;
    next = `${existing.slice(0, sectionStart)}${block}\n${existing.slice(sectionEnd).replace(/^\s+/, '')}`;
  }

  if (next === existing) return { changed: false, file, clientFormat: 'toml' };
  ensureParent(file, fsImpl);
  fsImpl.writeFileSync(file, next);
  return { changed: true, file, clientFormat: 'toml' };
}

function setupMcpClient(client, options = {}) {
  const fsImpl = options.fsImpl || fs;
  const file = resolveClientConfig(client, options);
  const result = client === 'codex'
    ? setupCodexClient(file, fsImpl)
    : setupJsonClient(file, fsImpl);
  return { ...result, client, server: SERVER_NAME };
}

function defaultProjectConfig(values = {}) {
  return {
    version: 1,
    platform: 'android',
    appId: values.appId || '',
    apkPath: values.apkPath || 'app/build/outputs/apk/debug/app-debug.apk',
    device: values.device || 'auto',
    flow: values.flow || ['Launch app', 'Verify the initial screen'],
    timeouts: {
      bootMs: values.bootMs || 120000,
      actionMs: values.actionMs || 15000,
    },
    evidenceDir: values.evidenceDir || '.mobile-ai-agents/evidence',
  };
}

function validateProjectConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return ['Configuration must be a JSON object.'];
  }
  if (config.version !== 1) errors.push('version must be 1.');
  if (config.platform !== 'android') errors.push('platform must be "android".');
  if (typeof config.appId !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(config.appId)) {
    errors.push('appId must be a valid Android application ID such as com.example.app.');
  }
  if (typeof config.apkPath !== 'string' || !config.apkPath.endsWith('.apk')) {
    errors.push('apkPath must point to an .apk file.');
  }
  if (typeof config.device !== 'string' || !config.device.trim()) {
    errors.push('device must be "auto", an emulator name, or a device serial.');
  }
  if (!Array.isArray(config.flow) || !config.flow.length || config.flow.some(step => typeof step !== 'string' || !step.trim())) {
    errors.push('flow must be a non-empty array of test steps.');
  }
  if (!config.timeouts || !Number.isInteger(config.timeouts.bootMs) || config.timeouts.bootMs <= 0) {
    errors.push('timeouts.bootMs must be a positive integer.');
  }
  if (!config.timeouts || !Number.isInteger(config.timeouts.actionMs) || config.timeouts.actionMs <= 0) {
    errors.push('timeouts.actionMs must be a positive integer.');
  }
  if (typeof config.evidenceDir !== 'string' || !config.evidenceDir.trim()) {
    errors.push('evidenceDir must be a non-empty path.');
  }
  return errors;
}

function projectConfigFile(options = {}) {
  const cwd = options.cwd || process.cwd();
  return path.resolve(cwd, options.configPath || PROJECT_CONFIG_PATH);
}

function initProjectConfig(values = {}, options = {}) {
  const fsImpl = options.fsImpl || fs;
  const file = projectConfigFile(options);
  const existing = readJsonObject(file, fsImpl);
  const base = Object.keys(existing).length ? existing : defaultProjectConfig();
  const next = {
    ...base,
    version: 1,
    platform: 'android',
    appId: values.appId !== undefined ? values.appId : base.appId,
    apkPath: values.apkPath !== undefined ? values.apkPath : base.apkPath,
    device: values.device !== undefined ? values.device : base.device,
    flow: values.flow !== undefined ? values.flow : base.flow,
    timeouts: {
      ...(base.timeouts || {}),
      bootMs: values.bootMs !== undefined ? values.bootMs : base.timeouts?.bootMs || 120000,
      actionMs: values.actionMs !== undefined ? values.actionMs : base.timeouts?.actionMs || 15000,
    },
    evidenceDir: values.evidenceDir !== undefined ? values.evidenceDir : base.evidenceDir,
  };
  const errors = validateProjectConfig(next);
  if (errors.length) throw new Error(`Invalid Android device configuration:\n- ${errors.join('\n- ')}`);

  const serialized = `${JSON.stringify(next, null, 2)}\n`;
  const current = fsImpl.existsSync(file) ? fsImpl.readFileSync(file, 'utf8') : '';
  if (current !== serialized) {
    ensureParent(file, fsImpl);
    fsImpl.writeFileSync(file, serialized);
  }
  return { changed: current !== serialized, file, config: next };
}

function loadProjectConfig(options = {}) {
  const fsImpl = options.fsImpl || fs;
  const file = projectConfigFile(options);
  if (!fsImpl.existsSync(file)) return { file, config: null, errors: ['Project configuration does not exist.'] };
  const config = readJsonObject(file, fsImpl);
  return { file, config, errors: validateProjectConfig(config) };
}

function knownMcpConfigFiles(options = {}) {
  const cwd = options.cwd || process.cwd();
  const homedir = options.homedir || os.homedir();
  return [
    { client: 'claude', format: 'json', file: path.join(cwd, '.mcp.json') },
    { client: 'cursor', format: 'json', file: path.join(cwd, '.cursor', 'mcp.json') },
    { client: 'windsurf', format: 'json', file: path.join(homedir, '.codeium', 'windsurf', 'mcp_config.json') },
    { client: 'codex', format: 'toml', file: path.join(homedir, '.codex', 'config.toml') },
  ];
}

function inspectMcpConfiguration(options = {}) {
  const fsImpl = options.fsImpl || fs;
  const found = [];
  for (const candidate of knownMcpConfigFiles(options)) {
    if (!fsImpl.existsSync(candidate.file)) continue;
    try {
      let configured;
      if (candidate.format === 'json') {
        const server = readJsonObject(candidate.file, fsImpl).mcpServers?.[SERVER_NAME];
        configured = server?.command === SERVER_COMMAND && JSON.stringify(server.args) === JSON.stringify(SERVER_ARGS);
      } else {
        const content = fsImpl.readFileSync(candidate.file, 'utf8');
        const header = /^\[mcp_servers\.(?:mobile-mcp|"mobile-mcp")\]\s*$/m.exec(content);
        if (!header) {
          configured = false;
        } else {
          const remainder = content.slice(header.index + header[0].length);
          const nextSection = /^\s*\[[^\]]+\]/m.exec(remainder);
          const section = nextSection ? remainder.slice(0, nextSection.index) : remainder;
          configured = /^\s*command\s*=\s*"npx"\s*$/m.test(section) &&
            /^\s*args\s*=\s*\[\s*"-y"\s*,\s*"@mobilenext\/mobile-mcp@latest"\s*\]\s*$/m.test(section);
        }
      }
      if (configured) found.push(candidate);
    } catch {
      // Invalid files are reported by setup/validation rather than hidden as configured.
    }
  }
  return found;
}

function printMcpHelp() {
  console.log('');
  console.log('  Mobile MCP setup');
  console.log('');
  console.log('  Commands:');
  console.log('    mobile-ai-agents mcp setup --client <claude|cursor|windsurf|codex>');
  console.log('    mobile-ai-agents mcp config init --app-id com.example.app [options]');
  console.log('    mobile-ai-agents mcp config validate [--json]');
  console.log('');
  console.log('  Config options:');
  console.log('    --apk <path>                    APK path');
  console.log('    --device <auto|name|serial>     Device selection');
  console.log('    --flow "step 1|step 2"          Ordered test flow');
  console.log('    --boot-timeout-ms <number>      Emulator boot timeout');
  console.log('    --action-timeout-ms <number>    Per-action timeout');
  console.log('    --evidence-dir <path>           Screenshots and reports');
  console.log('    --config <path>                 Override target config path');
  console.log('');
}

async function cmdMcp(args) {
  const opts = parseOptions(args);
  const [sub, action] = opts._;

  if (!sub || sub === 'help') {
    printMcpHelp();
    return;
  }

  if (sub === 'setup') {
    if (!opts.client || opts.client === true) throw new Error('mcp setup requires --client.');
    const result = setupMcpClient(String(opts.client), { configPath: opts.config === true ? undefined : opts.config });
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('');
      console.log(`  ${result.changed ? '✓ Configured' : '✓ Already configured'} mobile-mcp for ${result.client}`);
      console.log(`  File: ${result.file}`);
      console.log('');
    }
    return result;
  }

  if (sub === 'config' && action === 'init') {
    const flow = typeof opts.flow === 'string' ? opts.flow.split('|').map(v => v.trim()).filter(Boolean) : undefined;
    const result = initProjectConfig({
      appId: opts['app-id'] === true ? undefined : opts['app-id'],
      apkPath: opts.apk === true ? undefined : opts.apk,
      device: opts.device === true ? undefined : opts.device,
      flow,
      bootMs: opts['boot-timeout-ms'] ? Number(opts['boot-timeout-ms']) : undefined,
      actionMs: opts['action-timeout-ms'] ? Number(opts['action-timeout-ms']) : undefined,
      evidenceDir: opts['evidence-dir'] === true ? undefined : opts['evidence-dir'],
    }, { configPath: opts.config === true ? undefined : opts.config });
    console.log('');
    console.log(`  ${result.changed ? '✓ Wrote' : '✓ Unchanged'} ${result.file}`);
    console.log('');
    return result;
  }

  if (sub === 'config' && action === 'validate') {
    const result = loadProjectConfig({ configPath: opts.config === true ? undefined : opts.config });
    if (opts.json) {
      console.log(JSON.stringify({ valid: result.errors.length === 0, ...result }, null, 2));
    } else if (result.errors.length) {
      console.log('');
      console.log(`  ✗ Invalid ${result.file}`);
      result.errors.forEach(error => console.log(`    - ${error}`));
      console.log('');
    } else {
      console.log('');
      console.log(`  ✓ Valid ${result.file}`);
      console.log('');
    }
    if (result.errors.length) process.exitCode = 1;
    return result;
  }

  throw new Error('Unknown mcp command. Use mcp help.');
}

module.exports = {
  PROJECT_CONFIG_PATH,
  cmdMcp,
  defaultProjectConfig,
  initProjectConfig,
  inspectMcpConfiguration,
  loadProjectConfig,
  resolveClientConfig,
  setupMcpClient,
  validateProjectConfig,
};
