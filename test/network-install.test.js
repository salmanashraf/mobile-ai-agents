'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

test('web-network-to-mobile installs from every CLI platform bundle and shell installer', { timeout: 60000 }, t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'network-install-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const expected = fs.readFileSync(path.join(root, 'skills/cross-platform/web-network-to-mobile.md'), 'utf8');
  for (const platform of ['android', 'ios', 'flutter', 'rn', 'gaming', 'cross', 'all']) {
    const home = path.join(temporary, platform);
    fs.mkdirSync(home);
    const result = spawnSync(process.execPath, [path.join(root, 'cli/index.js'), 'install', '--platform', platform, '--tool', 'claude'], { cwd: temporary, env: { ...process.env, HOME: home, USERPROFILE: home }, encoding: 'utf8', timeout: 20000 });
    assert.equal(result.status, 0, `${platform}: ${result.stderr}`);
    assert.equal(fs.readFileSync(path.join(home, '.claude/commands/web-network-to-mobile.md'), 'utf8'), expected, platform);
  }
  if (process.platform !== 'win32') {
    const home = path.join(temporary, 'shell');
    fs.mkdirSync(home);
    const result = spawnSync('bash', [path.join(root, 'install.sh'), '--platform', 'android', '--tool', 'claude'], { cwd: root, env: { ...process.env, HOME: home }, encoding: 'utf8', timeout: 20000 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(home, '.claude/commands/web-network-to-mobile.md'), 'utf8'), expected);
  }
});
