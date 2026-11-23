'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { cmdMobileTest, createTestRequest, detectPlatform } = require('../cli/commands/mobile-test');

function tempDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-test-')); }

test('detects Flutter without requiring technical options', () => {
  const cwd = tempDir();
  fs.writeFileSync(path.join(cwd, 'pubspec.yaml'), 'name: demo\n');
  assert.equal(detectPlatform(cwd), 'Flutter');
});

test('creates a plain-language evidence-based test request', () => {
  const cwd = tempDir();
  const file = createTestRequest('Android', cwd);
  const content = fs.readFileSync(file, 'utf8');
  assert.match(content, /Test this app/);
  assert.match(content, /Do not claim PASS without device evidence/);
});

test('one command configures the selected client and prepares testing', async () => {
  const cwd = tempDir();
  const homedir = tempDir();
  fs.writeFileSync(path.join(cwd, 'pubspec.yaml'), 'name: demo\n');
  const result = await cmdMobileTest(['--client', 'codex', '--json'], { cwd, homedir });
  assert.equal(result.platform, 'Flutter');
  assert.equal(result.client, 'codex');
  assert.equal(result.setup.server, 'mobile-mcp');
  assert.ok(fs.existsSync(path.join(homedir, '.codex', 'config.toml')));
  assert.ok(fs.existsSync(path.join(cwd, '.mobile-ai-agents', 'MOBILE_TEST.md')));
});
