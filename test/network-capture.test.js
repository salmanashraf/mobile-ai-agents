'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { capture, safeUrl, bodyShape, safeHeaders, validateFlow } = require('../cli/lib/network-capture');
const { createDemo, flow } = require('../cli/fixtures/network-demo');
const { buildContract } = require('../cli/lib/api-contract');

test('capture artifacts omit body values and URL/header credentials while retaining observed types', () => {
  const body = bodyShape(JSON.stringify({ email: 'private@example.test', password: 'secret', amount: 0, enabled: false, optional: null }), 'application/json');
  assert.deepEqual(body.schema.properties.amount, { type: 'number' });
  assert.deepEqual(body.schema.properties.enabled, { type: 'boolean' });
  assert.equal(JSON.stringify(body).includes('secret'), false);
  const url = safeUrl('https://user:password@example.test/api/items/123?token=secret#secret');
  assert.equal(url, 'https://example.test/api/items/[REDACTED]?token=[REDACTED]');
  assert.equal(safeHeaders({ authorization: 'Bearer secret', cookie: 'secret', 'content-type': 'application/json; charset=utf-8' }).authorization, '[REDACTED]');
  assert.equal(bodyShape('secret', 'text/plain').state, 'omitted');
  assert.equal(bodyShape('{broken', 'application/json').state, 'unavailable');
  assert.equal(bodyShape('x'.repeat(65537), 'application/json').reason, 'body-size-limit');
});

test('invalid flows fail before browser launch or output mutation', async () => {
  assert.throws(() => validateFlow([{ action: 'evaluate', selector: 'body' }]));
  assert.throws(() => validateFlow([{ action: 'click', selector: 'button', waitMs: -1 }]));
  await assert.rejects(capture({ url: 'file:///private/data', output: '/unused' }), /HTTP/);
});

test('browser unavailability creates an honest failure report without raw browser secrets', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'network-missing-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const report = await capture({ url: 'http://localhost:1234', output: path.join(root, 'run'), playwright: { chromium: { launch: async () => { throw new Error('secret-cookie'); } } } });
  assert.equal(report.status, 'failed');
  assert.equal(JSON.stringify(report).includes('secret-cookie'), false);
  assert.ok(fs.existsSync(path.join(root, 'run/report.md')));
  await assert.rejects(capture({ url: 'http://localhost:1234', output: path.join(root, 'run') }), /EEXIST/);
});

test('real browser captures zero/multiple calls, redacts secrets and blocks writes/external origins', { timeout: 60000 }, async t => {
  let playwright;
  try { playwright = require('playwright'); }
  catch { if (process.env.NETWORK_BROWSER_TESTS === '1') throw new Error('Install Playwright for required browser tests.'); return t.skip('Optional Playwright missing; set NETWORK_BROWSER_TESTS=1 to require browser validation.'); }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'network-live-'));
  const server = createDemo();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); fs.rmSync(root, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const channel = process.env.NETWORK_BROWSER_CHANNEL;
  const report = await capture({ url, flow, output: path.join(root, 'success'), playwright, channel, allowWrites: true });
  assert.equal(report.status, 'captured', JSON.stringify(report));
  assert.equal(report.touchpoints[2].requestIds.length, 2);
  assert.equal(report.touchpoints[3].requestIds.length, 0);
  assert.equal(report.touchpoints[4].requestIds.length, 0);
  assert.equal(report.touchpoints[3].after.invalidInputs, 1);
  assert.equal(report.touchpoints[4].after.invalidInputs, 0);
  const save = report.requests.find(r => r.method === 'POST');
  assert.equal(save.status, 201);
  assert.equal(save.requestBody.schema.properties.password.type, 'string');
  assert.equal(save.auth, 'authorization-header');
  const contract = buildContract(report);
  assert.equal(contract.touchpoints[2].requestIds.length, 2);
  assert.equal(contract.touchpoints[3].requestIds.length, 0);
  assert.equal(contract.requests.find(row => row.id === save.id).status, 201);
  assert.equal(contract.mobileVerification, 'unverified');
  const serialized = fs.readFileSync(path.join(root, 'success/capture.json'), 'utf8');
  for (const secret of ['private@example.test', 'private-password', 'demo-secret', 'Test listing']) assert.equal(serialized.includes(secret), false);
  const blocked = await capture({ url, flow: [{ action: 'click', selector: '#save' }, { action: 'click', selector: '#external' }, { action: 'click', selector: '#error' }, { action: 'click', selector: '#fail' }], output: path.join(root, 'blocked'), playwright, channel });
  assert.equal(blocked.status, 'partial');
  assert.ok(blocked.requests.some(r => r.blockedReason === 'writes-disabled'));
  assert.ok(blocked.requests.some(r => r.blockedReason === 'outside-allowed-origins'));
  assert.ok(blocked.requests.some(r => r.status === 422));
  assert.ok(blocked.requests.some(r => r.failure === 'network-failure'));
  const failed = await capture({ url, flow: [{ action: 'click', selector: '#does-not-exist' }], output: path.join(root, 'failed'), playwright, channel });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.touchpoints[1].status, 'failed');
});
