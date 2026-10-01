'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  initProjectConfig,
  inspectMcpConfiguration,
  loadProjectConfig,
  setupMcpClient,
  validateProjectConfig,
} = require('../cli/commands/mcp');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ai-agents-'));
}

test('JSON MCP setup preserves settings and is idempotent', () => {
  const cwd = tempDir();
  const file = path.join(cwd, '.mcp.json');
  fs.writeFileSync(file, `${JSON.stringify({ theme: 'dark', mcpServers: { existing: { command: 'existing' } } }, null, 2)}\n`);

  const first = setupMcpClient('claude', { cwd });
  const once = fs.readFileSync(file, 'utf8');
  const second = setupMcpClient('claude', { cwd });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(fs.readFileSync(file, 'utf8'), once);
  const config = JSON.parse(once);
  assert.equal(config.theme, 'dark');
  assert.equal(config.mcpServers.existing.command, 'existing');
  assert.deepEqual(config.mcpServers['mobile-mcp'], {
    command: 'npx',
    args: ['-y', '@mobilenext/mobile-mcp@latest'],
  });
});

test('Codex MCP setup preserves TOML settings and is idempotent', () => {
  const homedir = tempDir();
  const file = path.join(homedir, '.codex', 'config.toml');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'model = "gpt-5"\n\n[projects."/tmp/app"]\ntrust_level = "trusted"\n');

  const first = setupMcpClient('codex', { homedir });
  const once = fs.readFileSync(file, 'utf8');
  const second = setupMcpClient('codex', { homedir });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(fs.readFileSync(file, 'utf8'), once);
  assert.match(once, /model = "gpt-5"/);
  assert.match(once, /\[projects\."\/tmp\/app"\]/);
  assert.match(once, /\[mcp_servers\.mobile-mcp\]/);
});

test('MCP inspection only accepts the expected server command', () => {
  const cwd = tempDir();
  const file = path.join(cwd, '.mcp.json');
  fs.writeFileSync(file, '{"mcpServers":{"mobile-mcp":{"command":"wrong","args":[]}}}\n');

  assert.deepEqual(inspectMcpConfiguration({ cwd, homedir: cwd }), []);
  setupMcpClient('claude', { cwd });
  assert.equal(inspectMcpConfiguration({ cwd, homedir: cwd })[0].client, 'claude');
});

test('project config init is valid, repeatable, and preserves custom fields', () => {
  const cwd = tempDir();
  const first = initProjectConfig({
    appId: 'com.example.app',
    flow: ['Launch app', 'Open settings'],
  }, { cwd });
  const file = first.file;
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  config.owner = 'mobile-team';
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);

  const updated = initProjectConfig({}, { cwd });
  const repeat = initProjectConfig({}, { cwd });
  const loaded = loadProjectConfig({ cwd });

  assert.equal(updated.config.owner, 'mobile-team');
  assert.equal(repeat.changed, false);
  assert.deepEqual(loaded.errors, []);
});

test('project config validation rejects invalid values', () => {
  const errors = validateProjectConfig({
    version: 2,
    platform: 'ios',
    appId: 'not-an-app-id',
    apkPath: 'app.ipa',
    device: '',
    flow: [],
    timeouts: { bootMs: 0, actionMs: -1 },
    evidenceDir: '',
  });

  assert.equal(errors.length, 9);
  assert.match(errors.join(' '), /appId/);
  assert.match(errors.join(' '), /apkPath/);
});
