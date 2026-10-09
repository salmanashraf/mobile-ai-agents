'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { initFigmaTools } = require('../cli/commands/figma');
const root = path.resolve(__dirname, '..');

test('Figma helper install is offline, repeatable and preserves custom helpers', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-install-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  assert.equal(initFigmaTools(cwd).filter(x => x.status === 'created').length, 10);
  const target = path.join(cwd, 'tools/figma-spec/node_dump.js');
  fs.writeFileSync(target, 'custom');
  assert.ok(initFigmaTools(cwd).every(x => x.status === 'preserved'));
  assert.equal(fs.readFileSync(target, 'utf8'), 'custom');
});

test('Figma helper install rejects directories redirected outside the project', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-symlink-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.mkdirSync(path.join(cwd, 'project'));
  fs.mkdirSync(path.join(cwd, 'outside'));
  fs.symlinkSync(path.join(cwd, 'outside'), path.join(cwd, 'project/tools'), 'dir');
  assert.throws(() => initFigmaTools(path.join(cwd, 'project')), /inside the project/);
  assert.deepEqual(fs.readdirSync(path.join(cwd, 'outside')), []);
});

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
test('Figma extraction retains precision and zero radius and reports depth truncation', async () => {
  const source = fs.readFileSync(path.join(root, 'tools/figma-spec/node_dump.js'), 'utf8')
    .replaceAll('__PAGE_ID__', 'null').replaceAll('__NODE_IDS__', '["1:2"]').replaceAll('__MAX_DEPTH__', '0');
  const node = { id: '1:2', name: 'Card', type: 'FRAME', width: 123.456789, height: 56,
    cornerRadius: 0, children: [{ id: '1:3' }], fills: [{ type: 'SOLID', color: { r: 0.123456, g: 0, b: 0 }, opacity: 0.5 }] };
  const figma = { root: { name: 'Fixture' }, mixed: Symbol(), getNodeByIdAsync: async () => node };
  const result = JSON.parse(await new AsyncFunction('figma', source)(figma));
  assert.equal(result.nodes[0].width, node.width);
  assert.equal(result.nodes[0].radius, 0);
  assert.equal(result.nodes[0].fills[0].rgba.r, 0.123456);
  assert.equal(result.nodes[0].childCount, 1);
});

test('text extraction includes a selected TEXT root', async () => {
  const source = fs.readFileSync(path.join(root, 'tools/figma-spec/text_dump.js'), 'utf8')
    .replaceAll('__PAGE_ID__', 'null').replaceAll('__NODE_IDS__', '["1:2"]');
  const node = { id: '1:2', name: 'Acceptance', type: 'TEXT', characters: 'Submit is disabled while saving.', absoluteTransform: [[1, 0, 1], [0, 1, 2]] };
  const result = JSON.parse(await new AsyncFunction('figma', source)({ getNodeByIdAsync: async () => node }));
  assert.equal(result.blocks[0].texts[0].characters, node.characters);
});

test('Python Figma contract and image regressions', t => {
  const python = spawnSync('python3', ['--version'], { encoding: 'utf8' });
  if (python.error) return t.skip('Python 3 is not available');
  const result = spawnSync('python3', ['test/figma_tools_test.py'], { cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
