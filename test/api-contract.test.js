'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { shape } = require('../cli/lib/network-capture');
const { buildContract, readJson, writeContract, validateContract } = require('../cli/lib/api-contract');

function fixture() {
  return { schemaVersion: 1, status: 'captured',
    touchpoints: [{ id: 'T1', action: 'click', status: 'completed', requestIds: ['R1'] }, { id: 'T2', action: 'click', status: 'completed', requestIds: [] }],
    requests: [{ id: 'R1', touchpoint: 'T1', method: 'GET', url: 'https://staging.example.test/api/items/123?page=secret&token=secret', requestHeaders: { Cookie: 'session-secret', 'X-CSRF-Token': 'csrf-secret' }, responseHeaders: { 'Content-Type': 'application/json' }, requestBody: { state: 'empty' }, responseBody: { state: 'observed', schema: shape({ amount: 25.5, note: null, title: 'sensitive-title' }) }, status: 200, outcome: 'http-success' }],
  };
}

function docs(schema) {
  return { openapi: '3.1.0', servers: [{ url: 'https://staging.example.test/api' }], paths: { '/items/{id}': { get: { parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }], responses: { 200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } } } } } }, components: { schemas: { Item: schema || { type: 'object', required: ['currency'], properties: { amount: { type: 'string', 'x-unit': 'USD', example: 'secret' }, note: { type: ['string', 'null'] } } } } } };
}

test('traceability preserves zero-call actions and separates observed types from unconfirmed semantics', () => {
  const contract = buildContract(fixture());
  assert.deepEqual(contract.touchpoints[1].requestIds, []);
  assert.equal(contract.requests[0].touchpointId, 'T1');
  assert.equal(contract.requests[0].response.schema.properties.note.type, 'null');
  assert.equal(contract.requests[0].response.schema.properties.amount.type, 'number');
  assert.equal(contract.requests[0].paginationCandidates.source, 'inferred');
  assert.deepEqual(contract.requests[0].paginationCandidates.names, ['page']);
  assert.ok(contract.findings.some(item => item.code === 'mobile-auth-handoff-required'));
  assert.equal(contract.status, 'needs-review');
  assert.equal(contract.mobileVerification, 'unverified');
  assert.equal(contract.requests[0].response.schema.required, undefined);
  for (const secret of ['session-secret', 'csrf-secret', 'sensitive-title', 'page=secret', 'token=secret']) assert.equal(JSON.stringify(contract).includes(secret), false);
});

test('OpenAPI local refs, server prefix, nullable fields and required parameters are cross-checked without copying examples', () => {
  const contract = buildContract(fixture(), { openapi: docs() });
  assert.equal(contract.requests[0].documentation.state, 'operation-matched');
  assert.equal(contract.requests[0].documentation.response.schema.properties.amount.unit, 'USD');
  assert.ok(contract.findings.some(item => item.code === 'type-disagreement' && item.field === '$.amount'));
  assert.ok(contract.findings.some(item => item.code === 'documented-required-field-absent' && item.field === '$.currency'));
  assert.ok(contract.findings.some(item => item.code === 'documented-required-parameter-absent'));
  assert.equal(contract.findings.some(item => item.field === '$.note'), false);
  assert.equal(JSON.stringify(contract).includes('"example"'), false);
  const legacy = docs({ type: 'object', properties: { amount: { type: 'number' }, note: { type: 'string', nullable: true, enum: ['private-enum-value'] } } });
  legacy.openapi = '3.0.3';
  const second = buildContract(fixture(), { openapi: legacy });
  assert.equal(second.findings.some(item => item.code === 'type-disagreement'), false);
  assert.equal(JSON.stringify(second).includes('private-enum-value'), false);
});

test('OpenAPI composition, unresolved refs, undocumented errors and ambiguous routes remain gaps', () => {
  const spec = docs({ oneOf: [{ type: 'string' }, { type: 'number' }] });
  let contract = buildContract(fixture(), { openapi: spec });
  assert.ok(contract.findings.some(item => item.code === 'openapi-response-constraints-unverified'));
  contract = buildContract(fixture(), { openapi: docs({ $ref: 'https://private.example.test/schema?token=secret' }) });
  assert.ok(contract.findings.some(item => item.code === 'openapi-response-constraints-unverified'));
  assert.equal(JSON.stringify(contract).includes('private.example.test'), false);
  const error = fixture(); error.requests[0].status = 422;
  assert.ok(buildContract(error, { openapi: docs() }).findings.some(item => item.code === 'openapi-status-undocumented'));
  const ambiguous = docs(); ambiguous.paths['/items/{other}'] = ambiguous.paths['/items/{id}'];
  assert.equal(buildContract(fixture(), { openapi: ambiguous }).requests[0].documentation.state, 'operation-unmatched-or-ambiguous');
});

test('HAR import strips values, keeps missing bodies unavailable and never invents action provenance', () => {
  const har = { log: { version: '1.2', entries: [
    { request: { url: 'https://example.test/graphql', method: 'POST', headers: [{ name: 'Authorization', value: 'Bearer private-token' }], postData: { mimeType: 'application/json', text: JSON.stringify({ operationName: 'PrivateName', query: 'private-query', variables: { email: 'private-email' } }) } }, response: { status: 200, content: { mimeType: 'application/json', encoding: 'base64', text: Buffer.from(JSON.stringify({ data: null, errors: [{ message: 'private-error' }] })).toString('base64') } } },
    { request: { url: 'https://example.test/upload?signature=private-signature', method: 'POST', postData: { mimeType: 'multipart/form-data', params: [{ name: 'photo', fileName: 'private-file.jpg' }, { name: 'description', value: 'private-description' }] } }, response: { status: 201, content: { mimeType: 'application/json' } } },
    { request: { url: 'https://example.test/events', method: 'GET' }, response: { status: 200, content: { mimeType: 'text/event-stream', text: 'private-frame' } } },
    { request: { url: 'https://example.test/empty', method: 'GET' }, response: { status: 204 } },
  ] } };
  const contract = buildContract(har, { format: 'har' });
  assert.equal(contract.touchpoints[0].provenance, 'unattributed');
  assert.equal(contract.requests[0].errorEvidence.graphqlErrorsField, true);
  assert.equal(contract.requests[1].request.schema.properties.photo.type, 'binary');
  assert.equal(contract.requests[1].response.state, 'unavailable');
  assert.equal(contract.requests[3].response.state, 'empty');
  for (const code of ['har-action-provenance-missing', 'graphql-operation-values-and-semantics-unverified', 'multipart-upload-stages-unverified', 'stream-frames-unavailable', 'response-body-coverage-gap']) assert.ok(contract.findings.some(item => item.code === code), code);
  for (const secret of ['private-token', 'PrivateName', 'private-query', 'private-email', 'private-error', 'private-file', 'private-description', 'private-signature', 'private-frame']) assert.equal(JSON.stringify(contract).includes(secret), false, secret);
});

test('invalid capture references, duplicate mappings and future versions are rejected', () => {
  for (const mutate of [value => { value.schemaVersion = 2; }, value => value.touchpoints[1].requestIds.push('R1'), value => { value.requests[0].touchpoint = 'missing'; }, value => { value.requests[0].redirectedFrom = 'R1'; }]) {
    const input = fixture(); mutate(input); assert.throws(() => buildContract(input));
  }
  assert.throws(() => buildContract({ log: { entries: [{}] } }, { format: 'har' }));
  assert.throws(() => buildContract(fixture(), { openapi: { openapi: '2.0', paths: {} } }));
  const incomplete = fixture(); incomplete.status = 'failed';
  assert.ok(buildContract(incomplete).findings.some(item => item.code === 'capture-incomplete-or-status-unknown'));
});

test('CLI exports reproducible contracts without browser tooling, preserves existing output and hides JSON parse values', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'api-contract-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'capture.json');
  fs.writeFileSync(file, '\uFEFF' + JSON.stringify(fixture()));
  const contract = buildContract(readJson(file));
  assert.equal(validateContract(contract), true);
  assert.equal(buildContract(fixture()).source.sha256, contract.source.sha256);
  const output = path.join(directory, 'output');
  const cli = spawnSync(process.execPath, [path.resolve(__dirname, '../cli/index.js'), 'network', 'contract', '--capture', file, '--out', output], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(output, 'contract.json'))).contractVersion, '1.0.0');
  assert.match(fs.readFileSync(path.join(output, 'contract.md'), 'utf8'), /Mobile verification: unverified/);
  assert.throws(() => writeContract(contract, output), /EEXIST/);
  fs.writeFileSync(file, '{"private-key": broken-secret');
  assert.throws(() => readJson(file), error => !error.message.includes('broken-secret'));
});
