'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildContract } = require('../cli/lib/api-contract');
const { validateEvidence, verifyParity, writeParity } = require('../cli/lib/mobile-parity');

function contract() {
  return buildContract({
    schemaVersion: 1,
    status: 'captured',
    touchpoints: [{ id: 'T1', action: 'click', status: 'completed', requestIds: ['R1'] }],
    requests: [{
      id: 'R1', touchpoint: 'T1', method: 'GET', url: 'https://web.example/api/items?build=redacted',
      requestHeaders: {}, responseHeaders: { 'content-type': 'application/json' }, requestBody: { state: 'empty' },
      responseBody: { state: 'observed', schema: { type: 'object', properties: { items: { type: 'array', observedItems: [{ type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' } } }] } } } },
      status: 200, outcome: 'http-success',
    }],
  });
}

function evidence() {
  return {
    evidenceVersion: '1.0.0', runtimeObserved: true, capturedAt: '2026-11-19T00:00:00Z', environment: 'owned-local-parity-v1',
    target: { platform: 'ios', runtime: 'iOS Simulator 26.5', buildId: 'fixture-1' },
    touchpoints: [{
      id: 'T1', networkVisibility: 'observed', ui: 'pass',
      requests: [{ id: 'R1', method: 'GET', url: 'http://127.0.0.1:4173/api/items?build=local', status: 200, request: { state: 'empty' }, response: { state: 'observed', schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'number' }, title: { type: 'string' } } } } } } } }],
    }],
    scenarios: [
      { name: 'auth-expiry', status: 'pass', evidence: '401 mapped to expired session' },
      { name: 'invalid-input', status: 'pass', evidence: 'rejected before request' },
      { name: 'offline-failure', status: 'pass', evidence: 'transport error shown' },
      { name: 'duplicate-submission', status: 'pass', evidence: 'one request observed' },
    ],
    buildChecks: [{ name: 'simulator-build', status: 'pass' }],
    normalization: [{ pointer: '/items/0/id', reason: 'server-generated-id' }],
  };
}

test('matching real-runtime evidence stays separated by web, network and UI', () => {
  const report = verifyParity(contract(), evidence());
  assert.equal(report.verdict, 'VERIFIED');
  assert.deepEqual(report.rows[0], { id: 'T1', webCapture: 'pass', mobileNetwork: 'pass', mobileUI: 'pass', mismatches: [] });
  assert.equal(report.normalization[0].status, 'documented-only');
});

test('dynamic values can vary while meaningful method, path, status and schema differences fail', () => {
  const dynamic = evidence();
  dynamic.touchpoints[0].requests[0].url = 'http://localhost:9999/api/items?build=another';
  assert.equal(verifyParity(contract(), dynamic).verdict, 'VERIFIED');
  for (const mutate of [
    item => { item.method = 'POST'; },
    item => { item.url = 'http://localhost/api/other?build=x'; },
    item => { item.status = 201; },
    item => { item.response.schema.properties.items.items.properties.title.type = 'number'; },
  ]) {
    const changed = evidence(); mutate(changed.touchpoints[0].requests[0]);
    const report = verifyParity(contract(), changed);
    assert.equal(report.verdict, 'FAILED');
    assert.equal(report.rows[0].mobileNetwork, 'fail');
  }
});

test('missing network visibility and failed UI remain explicit', () => {
  const missing = evidence(); missing.touchpoints[0].networkVisibility = 'missing'; missing.touchpoints[0].requests = [];
  let report = verifyParity(contract(), missing);
  assert.equal(report.verdict, 'UNVERIFIED'); assert.equal(report.rows[0].mobileNetwork, 'unverified');
  const failed = evidence(); failed.touchpoints[0].ui = 'fail';
  report = verifyParity(contract(), failed);
  assert.equal(report.verdict, 'FAILED'); assert.equal(report.rows[0].mobileUI, 'fail');
  const buildFailed = evidence(); buildFailed.buildChecks[0].status = 'fail';
  assert.equal(verifyParity(contract(), buildFailed).verdict, 'FAILED');
});

test('auth, invalid input, offline and duplicate submission scenarios are required independently', () => {
  for (const name of ['auth-expiry', 'invalid-input', 'offline-failure', 'duplicate-submission']) {
    const item = evidence(); item.scenarios.find(scenario => scenario.name === name).status = 'fail';
    assert.equal(verifyParity(contract(), item).verdict, 'FAILED', name);
  }
  const absent = evidence(); absent.scenarios = [];
  const report = verifyParity(contract(), absent);
  assert.equal(report.verdict, 'UNVERIFIED');
  assert.equal(report.scenarios.every(item => item.status === 'unverified'), true);
});

test('runtime absence and malformed or oversized evidence cannot claim parity', () => {
  const absent = evidence(); absent.runtimeObserved = false;
  absent.touchpoints = []; absent.scenarios = []; absent.buildChecks = [{ name: 'runtime-availability', status: 'unverified' }];
  const absentReport = verifyParity(contract(), absent);
  assert.equal(absentReport.verdict, 'UNVERIFIED'); assert.equal(absentReport.runtimeObserved, false);
  const raw = JSON.stringify(evidence()).replace('fixture-1', 'private-secret');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-invalid-'));
  fs.writeFileSync(path.join(root, 'bad.json'), raw.slice(0, -1));
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../cli/index.js'), 'network', 'verify', '--contract', path.join(root, 'missing'), '--mobile', path.join(root, 'bad.json'), '--out', path.join(root, 'out')], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal((result.stdout + result.stderr).includes('private-secret'), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test('CLI writes a private report, preserves output and does not replay requests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-cli-'));
  const contractFile = path.join(root, 'contract.json'), mobileFile = path.join(root, 'mobile.json'), output = path.join(root, 'out');
  fs.writeFileSync(contractFile, JSON.stringify(contract())); fs.writeFileSync(mobileFile, JSON.stringify(evidence()));
  const args = [path.resolve(__dirname, '../cli/index.js'), 'network', 'verify', '--contract', contractFile, '--mobile', mobileFile, '--out', output];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /VERIFIED/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(output, 'parity.json'))).verdict, 'VERIFIED');
  assert.notEqual(fs.statSync(path.join(output, 'parity.json')).mode & 0o777, 0o644);
  const again = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.notEqual(again.status, 0);
  fs.rmSync(root, { recursive: true, force: true });
});

test('HAR and incomplete web actions cannot become verified from mobile evidence alone', () => {
  const incomplete = contract(); incomplete.touchpoints[0].status = 'failed';
  assert.notEqual(verifyParity(incomplete, evidence()).verdict, 'VERIFIED');
  const har = contract(); har.source.format = 'har'; delete har.source.captureStatus; har.touchpoints[0].provenance = 'unattributed';
  assert.equal(verifyParity(har, evidence()).rows[0].webCapture, 'unverified');
});

test('an explicit browser HTML document shell can be a justified native difference', () => {
  const source = {
    schemaVersion: 1, status: 'captured',
    touchpoints: [{ id: 'T1', action: 'navigate', status: 'completed', requestIds: ['R1'] }],
    requests: [{ id: 'R1', touchpoint: 'T1', method: 'GET', url: 'https://web.example/', requestHeaders: {}, responseHeaders: { 'content-type': 'text/html' }, requestBody: { state: 'empty' }, responseBody: { state: 'omitted' }, status: 200, outcome: 'http-success' }],
  };
  const mobile = evidence();
  mobile.touchpoints = [{ id: 'T1', networkVisibility: 'not-applicable', nativeDifference: 'browser-document-shell', ui: 'pass', requests: [] }];
  assert.equal(verifyParity(buildContract(source), mobile).verdict, 'VERIFIED');
  source.requests[0].url = 'https://web.example/api/items';
  assert.equal(verifyParity(buildContract(source), mobile).verdict, 'FAILED');
});

