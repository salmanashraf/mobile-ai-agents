'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { safeUrl } = require('./network-capture');
const { validateContract } = require('./api-contract');

const scenarioNames = ['auth-expiry', 'invalid-input', 'offline-failure', 'duplicate-submission'];
const resultValues = ['pass', 'fail', 'unverified'];

function readEvidence(file) {
  if (fs.statSync(file).size > 5 * 1024 * 1024) throw new Error('Mobile evidence exceeds 5 MiB.');
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch { throw new Error('Mobile evidence must be valid JSON; parser details omitted to avoid exposing values.'); }
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
}

function validateShape(shape, depth = 0) {
  if (!shape || typeof shape !== 'object' || Array.isArray(shape) || depth > 12) throw new Error('Invalid bounded mobile body shape.');
  if (!['object', 'array', 'string', 'number', 'boolean', 'null', 'binary', 'unknown'].includes(shape.type)) throw new Error('Invalid mobile body shape type.');
  if (shape.type === 'object') {
    if (!shape.properties || typeof shape.properties !== 'object' || Array.isArray(shape.properties) || Object.keys(shape.properties).length > 200) throw new Error('Invalid mobile object shape.');
    for (const child of Object.values(shape.properties)) validateShape(child, depth + 1);
  }
  if (shape.type === 'array' && shape.items) validateShape(shape.items, depth + 1);
  return true;
}

function validateEvidence(evidence) {
  if (evidence?.evidenceVersion !== '1.0.0' || typeof evidence.target !== 'object' || !['android', 'ios', 'flutter', 'rn', 'kmp', 'other'].includes(evidence.target.platform)) throw new Error('Invalid mobile evidence envelope.');
  if (typeof evidence.capturedAt !== 'string' || !Number.isFinite(Date.parse(evidence.capturedAt)) || typeof evidence.environment !== 'string' || !/^[A-Za-z0-9_.:-]{1,100}$/.test(evidence.environment)) throw new Error('Mobile evidence requires capture time and a safe environment identity.');
  if (typeof evidence.target.runtime !== 'string' || !evidence.target.runtime || evidence.target.runtime.length > 200 || typeof evidence.target.buildId !== 'string' || !evidence.target.buildId || evidence.target.buildId.length > 200) throw new Error('Mobile target requires bounded runtime and build identity.');
  if (typeof evidence.runtimeObserved !== 'boolean' || !Array.isArray(evidence.touchpoints) || evidence.touchpoints.length > 100 || !Array.isArray(evidence.scenarios)) throw new Error('Mobile evidence requires runtime status, touchpoints and scenarios.');
  const pointIds = new Set();
  for (const point of evidence.touchpoints) {
    if (!validId(point.id) || pointIds.has(point.id) || !['observed', 'missing', 'not-applicable'].includes(point.networkVisibility) || !resultValues.includes(point.ui) || !Array.isArray(point.requests) || point.requests.length > 500) throw new Error('Invalid mobile touchpoint evidence.');
    if (point.networkVisibility === 'not-applicable' && point.nativeDifference !== 'browser-document-shell') throw new Error('Native differences require the supported browser-document-shell reason.');
    pointIds.add(point.id);
    const requestIds = new Set();
    for (const request of point.requests) {
      if (!validId(request.id) || requestIds.has(request.id) || typeof request.method !== 'string' || !/^[A-Z]{1,16}$/.test(request.method) || typeof request.url !== 'string' || !Number.isInteger(request.status) || request.status < 100 || request.status > 599) throw new Error('Invalid or duplicate mobile request evidence.');
      requestIds.add(request.id);
      safeUrl(request.url);
      if (request.request?.schema) validateShape(request.request.schema);
      if (request.response?.schema) validateShape(request.response.schema);
    }
  }
  const scenarioIds = new Set();
  for (const scenario of evidence.scenarios) {
    if (!scenarioNames.includes(scenario.name) || scenarioIds.has(scenario.name) || !resultValues.includes(scenario.status) || typeof scenario.evidence !== 'string' || !scenario.evidence || scenario.evidence.length > 500) throw new Error('Invalid or duplicate required scenario evidence.');
    scenarioIds.add(scenario.name);
  }
  if (!Array.isArray(evidence.buildChecks) || evidence.buildChecks.length === 0 || evidence.buildChecks.length > 100 || evidence.buildChecks.some(check => typeof check.name !== 'string' || !/^[A-Za-z0-9_.:-]{1,100}$/.test(check.name) || !resultValues.includes(check.status))) throw new Error('At least one bounded explicit build check is required.');
  if (evidence.normalization !== undefined) {
    if (!Array.isArray(evidence.normalization) || evidence.normalization.length > 100 || evidence.normalization.some(item => typeof item.pointer !== 'string' || !/^\/(?:[^/~]|~[01])+(?:\/(?:[^/~]|~[01])+)*$/.test(item.pointer) || !['server-generated-id', 'server-timestamp'].includes(item.reason))) throw new Error('Normalization requires bounded JSON pointers and supported reasons.');
  }
  return true;
}

function comparableUrl(value) {
  const url = new URL(value);
  return `${url.pathname}?${[...url.searchParams.keys()].sort().join('&')}`;
}

function shapeSignature(shape) {
  if (!shape) return 'missing';
  if (shape.type === 'object') return `object{${Object.entries(shape.properties || {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${shapeSignature(value)}`).join(',')}}`;
  if (shape.type === 'array') return `array<${shapeSignature(shape.items || shape.observedItems?.[0] || { type: 'unknown' })}>`;
  return shape.type;
}

function bodySignature(body) {
  if (!body || body.state !== 'observed') return body?.state || 'unavailable';
  return shapeSignature(body.schema);
}

function compareRequest(expected, actual) {
  const mismatches = [];
  if (expected.method !== actual.method) mismatches.push('method');
  if (comparableUrl(expected.url) !== comparableUrl(actual.url)) mismatches.push('path-or-query-keys');
  if (expected.status !== null && expected.status !== actual.status) mismatches.push('status');
  if (bodySignature(expected.request) !== bodySignature(actual.request)) mismatches.push('request-shape');
  if (bodySignature(expected.response) !== bodySignature(actual.response)) mismatches.push('response-shape');
  return mismatches;
}

function verifyParity(contract, evidence) {
  validateContract(contract);
  validateEvidence(evidence);
  const contractPointIds = new Set(contract.touchpoints.map(point => point.id));
  if (evidence.touchpoints.some(point => !contractPointIds.has(point.id))) throw new Error('Mobile evidence contains an unknown touchpoint.');
  const mobilePoints = new Map(evidence.touchpoints.map(point => [point.id, point]));
  const rows = contract.touchpoints.map(point => {
    const mobile = mobilePoints.get(point.id);
    const webCapture = contract.source.captureStatus === 'captured' && point.status === 'completed' ? 'pass' : contract.source.format === 'har' ? 'unverified' : 'fail';
    let mobileNetwork = 'unverified';
    const mismatches = [];
    if (mobile?.networkVisibility === 'observed') {
      mobileNetwork = 'pass';
      for (const requestId of point.requestIds) {
        const expected = contract.requests.find(request => request.id === requestId);
        const actual = mobile.requests.find(request => request.id === requestId);
        if (!actual) { mobileNetwork = 'fail'; mismatches.push(`${requestId}:missing`); continue; }
        const requestMismatches = compareRequest(expected, actual);
        if (requestMismatches.length) { mobileNetwork = 'fail'; mismatches.push(`${requestId}:${requestMismatches.join(',')}`); }
      }
      const unexpected = mobile.requests.filter(request => !point.requestIds.includes(request.id));
      if (unexpected.length) { mobileNetwork = 'fail'; mismatches.push(`unexpected:${unexpected.map(request => request.id).join(',')}`); }
    }
    if (mobile?.networkVisibility === 'not-applicable') {
      const browserShellOnly = point.requestIds.length > 0 && point.requestIds.every(requestId => {
        const request = contract.requests.find(item => item.id === requestId);
        const url = new URL(request.url);
        return request.method === 'GET' && url.pathname === '/' && request.transport?.response === 'text/html';
      });
      mobileNetwork = browserShellOnly && mobile.requests.length === 0 ? 'pass' : 'fail';
      if (!browserShellOnly) mismatches.push('unsupported-native-difference');
    }
    return { id: point.id, webCapture, mobileNetwork, mobileUI: mobile?.ui || 'unverified', mismatches };
  });
  const scenarios = scenarioNames.map(name => {
    const item = evidence.scenarios.find(candidate => candidate.name === name);
    return item ? { name, status: item.status, evidenceSha256: createHash('sha256').update(item.evidence).digest('hex') } : { name, status: 'unverified', evidenceSha256: null };
  });
  const buildChecks = evidence.buildChecks.map(check => ({ name: check.name, status: check.status }));
  const verified = evidence.runtimeObserved && rows.length > 0 && rows.every(row => row.webCapture === 'pass' && row.mobileNetwork === 'pass' && row.mobileUI === 'pass') && scenarios.every(item => item.status === 'pass') && buildChecks.every(item => item.status === 'pass');
  return {
    parityVersion: '1.0.0',
    verdict: verified ? 'VERIFIED' : rows.some(row => row.webCapture === 'fail' || row.mobileNetwork === 'fail' || row.mobileUI === 'fail') || scenarios.some(item => item.status === 'fail') || buildChecks.some(item => item.status === 'fail') ? 'FAILED' : 'UNVERIFIED',
    target: { platform: evidence.target.platform, runtime: evidence.target.runtime, buildId: evidence.target.buildId },
    source: { contractSha256: createHash('sha256').update(JSON.stringify(contract)).digest('hex'), mobileEvidenceSha256: createHash('sha256').update(JSON.stringify(evidence)).digest('hex'), capturedAt: evidence.capturedAt, environment: evidence.environment },
    rows, scenarios, buildChecks,
    runtimeObserved: evidence.runtimeObserved,
    normalization: Array.isArray(evidence.normalization) ? evidence.normalization.map(item => ({ pointer: item.pointer, reason: item.reason, status: 'documented-only' })) : [],
    limitations: ['Only supplied app-owned network evidence is compared; UI automation alone cannot establish network parity.', 'Origins may differ by test environment; HTTP method, path, query-key set, status and body shapes are compared.', 'A root GET returning text/html may be explicitly documented as a browser document shell that has no native request.', 'Normalization entries are recorded but never silently applied to method, path, status or schema differences.', 'Every target requires its own runtime, build, network and UI evidence. Production TLS or pinning must not be weakened.'],
  };
}

function writeParity(report, directory) {
  fs.mkdirSync(directory, { mode: 0o700 });
  fs.writeFileSync(path.join(directory, 'parity.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  const lines = ['# Mobile API and UI parity', '', `Verdict: ${report.verdict}`, `Runtime observed: ${report.runtimeObserved}`, '', '| Touchpoint | Web capture | Mobile network | Mobile UI | Mismatch |', '|---|---|---|---|---|', ...report.rows.map(row => `| ${row.id} | ${row.webCapture} | ${row.mobileNetwork} | ${row.mobileUI} | ${row.mismatches.join('; ') || 'none'} |`), '', '## Required scenarios', '', ...report.scenarios.map(item => `- ${item.name}: ${item.status}${item.evidenceSha256 ? ` (evidence sha256: ${item.evidenceSha256})` : ''}`), '', '## Build checks', '', ...report.buildChecks.map(item => `- ${item.name}: ${item.status}`), '', ...report.limitations.map(item => `- ${item}`)];
  fs.writeFileSync(path.join(directory, 'parity.md'), lines.join('\n') + '\n', { mode: 0o600 });
}

module.exports = { readEvidence, validateEvidence, compareRequest, verifyParity, writeParity };
