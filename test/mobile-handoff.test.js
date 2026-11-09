'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { buildHandoff, writeHandoff } = require('../cli/lib/mobile-handoff');
const { buildContract } = require('../cli/lib/api-contract');
const { createDemo } = require('../cli/fixtures/network-demo');
const { createClient } = require('../cli/fixtures/mobile-handoff/client');
const { createModel } = require('../cli/fixtures/mobile-handoff/model');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-handoff-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { 'react-native': '*' } }));
  fs.writeFileSync(path.join(root, 'source.js'), '// existing architecture');
  return root;
}
function contract() {
  return buildContract({ schemaVersion: 1, status: 'captured', touchpoints: [{ id: 'T1', action: 'click', status: 'completed', requestIds: ['R1'] }, { id: 'T2', action: 'click', status: 'completed', requestIds: [] }], requests: [{ id: 'R1', touchpoint: 'T1', method: 'GET', url: 'https://example.test/api/items', requestHeaders: { cookie: 'private-secret' }, responseHeaders: {}, requestBody: { state: 'empty' }, responseBody: { state: 'empty' }, status: 200 }] });
}
function mapping() {
  return { version: 1, platform: 'rn', touchpoints: ['T1', 'T2'].map(id => ({ id, files: Object.fromEntries(['network','auth','domain','state','navigation'].map(role => [role, { path: 'source.js', ownership: 'native' }])), requests: id === 'T1' ? [{ id: 'R1', nativeEndpoint: 'supported', nativeAuth: 'supported', evidence: 'source.js', findingsReviewed: true }] : [] })) };
}
test('handoff preserves reviewed existing-file mappings and no-network actions without claiming verification', t => {
  const root = fixture(t), report = buildHandoff(contract(), mapping(), root);
  assert.equal(report.tasks.length, 2);
  assert.equal(report.status, 'needs-review');
  assert.equal(report.mobileVerification, 'unverified');
  assert.deepEqual(report.tasks[1].requestIds, []);
  assert.equal(JSON.stringify(report).includes('private-secret'), false);
  writeHandoff(report, path.join(root, 'out'));
  assert.throws(() => writeHandoff(report, path.join(root, 'out')), /EEXIST/);
});
test('missing auth, endpoint and architecture evidence blocks dependent tasks only', t => {
  const root = fixture(t), m = mapping(); m.touchpoints[0].requests = [];
  const report = buildHandoff(contract(), m, root);
  assert.equal(report.tasks[0].status, 'blocked'); assert.equal(report.tasks[1].status, 'ready-for-review');
  assert.match(report.tasks[0].gaps.join(' '), /native-auth-unresolved/);
});
test('mapping rejects escaping paths, symlinks, unknown ids and platform guesses', t => {
  const root = fixture(t);
  for (const filename of ['../outside', '/etc/passwd', 'missing.js']) {
    const m = mapping(); m.touchpoints[0].files.network.path = filename;
    assert.throws(() => buildHandoff(contract(), m, root));
  }
  fs.symlinkSync(os.tmpdir(), path.join(root, 'escape'));
  const m = mapping(); m.touchpoints[0].files.network.path = 'escape';
  assert.throws(() => buildHandoff(contract(), m, root));
  m.platform = 'android'; assert.throws(() => buildHandoff(contract(), m, root), /marker/);
  const bad = mapping(); bad.touchpoints[0].id = 'Unknown'; assert.throws(() => buildHandoff(contract(), bad, root), /touchpoint/);
});
test('KMP retains explicit shared versus native file ownership', t => {
  const root = fixture(t); fs.writeFileSync(path.join(root, 'build.gradle.kts'), 'plugins { kotlin("multiplatform") }');
  const m = mapping(); m.platform = 'kmp'; m.touchpoints[0].files.network.ownership = 'shared';
  const report = buildHandoff(contract(), m, root);
  assert.equal(report.mappings[0].files.network.ownership, 'shared'); assert.equal(report.mappings[0].files.navigation.ownership, 'native');
});
test('reference mobile client exercises the owned HTTP list/detail/save contract', async t => {
  const server = createDemo(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const client = createClient({ baseUrl: `http://127.0.0.1:${server.address().port}` });
  assert.equal((await client.list()).items[0].id, 1);
  assert.equal((await client.detail()).options.categories[0], 'Books');
  assert.deepEqual(await client.save('Test listing'), { id: 2, saved: true });
});
test('reference rejects blank input before transport and never retries expired auth or writes', async () => {
  let calls = 0;
  const client = createClient({ baseUrl: 'https://example.test', transport: async () => { calls++; return { status: 401, ok: false }; } });
  assert.throws(() => client.save(' '), /Title required/); assert.equal(calls, 0);
  await assert.rejects(client.save('Title'), e => e.kind === 'auth-expired'); assert.equal(calls, 1);
});
test('reference cancellation reaches transport, prevents duplicates and discards stale results', async () => {
  let finish, signal, calls = 0;
  const model = createModel({ save: (_, s) => { signal = s; calls++; return new Promise(resolve => { finish = resolve; }); } });
  const pending = model.run('save', 'Title'); await model.run('save', 'Title'); assert.equal(calls, 1);
  model.cancel(); assert.equal(signal.aborted, true); finish({ saved: true }); await pending;
  assert.equal(model.getState().status, 'cancelled'); model.dispose();
});
test('reference maps server validation and transport failures without automatic retry', async () => {
  let calls = 0;
  const client = createClient({ baseUrl: 'https://example.test', transport: async () => { calls++; return { status: 422, ok: false }; } });
  await assert.rejects(client.save('Title'), e => e.kind === 'validation'); assert.equal(calls, 1);
  const offline = createClient({ baseUrl: 'https://example.test', transport: async () => { throw new Error('offline'); } });
  const model = createModel(offline); await model.run('list'); assert.equal(model.getState().error, 'network');
});
test('Android, iOS, Flutter and custom stacks retain explicit platform selection', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'AndroidManifest.xml'), '<manifest/>');
  fs.writeFileSync(path.join(root, 'Screen.swift'), '// Swift');
  fs.writeFileSync(path.join(root, 'pubspec.yaml'), 'dependencies:\n  flutter:\n    sdk: flutter\n');
  for (const platform of ['android', 'ios', 'flutter', 'other']) {
    const m = mapping(); m.platform = platform;
    const result = buildHandoff(contract(), m, root);
    assert.equal(result.platform, platform);
    assert.equal(result.mobileVerification, 'unverified');
    if (platform === 'other') assert.equal(result.status, 'blocked');
  }
});
test('external symlink files and incomplete capture evidence cannot silently pass', t => {
  const root = fixture(t), external = fixture(t);
  fs.symlinkSync(path.join(external, 'source.js'), path.join(root, 'external.js'));
  const m = mapping(); m.touchpoints[0].files.network.path = 'external.js';
  assert.throws(() => buildHandoff(contract(), m, root), /inside/);
  const c = contract(); c.source.captureStatus = 'partial';
  assert.equal(buildHandoff(c, mapping(), root).tasks[0].status, 'blocked');
});
test('handoff command writes scoped tasks without changing the app', t => {
  const root = fixture(t), input = path.join(root, 'contract.json'), map = path.join(root, 'mapping.json');
  fs.writeFileSync(input, JSON.stringify(contract())); fs.writeFileSync(map, JSON.stringify(mapping()));
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../cli/index.js'), 'network', 'handoff', '--contract', input, '--mapping', map, '--repo', root, '--out', path.join(root, 'output')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /unverified/);
  assert.equal(fs.readFileSync(path.join(root, 'source.js'), 'utf8'), '// existing architecture');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'output/handoff.json'))).tasks.length, 2);
});
