'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { safeUrl, bodyShape } = require('./network-capture');

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
const enumValue = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const mediaType = value => typeof value === 'string' && /^[\w.+-]+\/[\w.+*-]+(?:;|$)/.test(value) ? value.split(';')[0].toLowerCase() : null;

function readJson(file) {
  if (fs.statSync(file).size > 10 * 1024 * 1024) throw new Error('Input exceeds the 10 MiB contract-processing limit.');
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch { throw new Error('Input must be valid JSON; parser details omitted to avoid exposing source values.'); }
}

// Copy only our shape vocabulary; never trust an imported object to be sanitized.
function observedShape(value, depth = 0) {
  if (!object(value) || depth > 12) return { type: 'unknown' };
  const type = enumValue(value.type, ['object', 'array', 'string', 'number', 'boolean', 'null', 'binary'], 'unknown');
  if (type === 'object') {
    const entries = Object.entries(object(value.properties) ? value.properties : {});
    return { type, properties: Object.fromEntries(entries.slice(0, 200).map(([key, child]) => [key, observedShape(child, depth + 1)])), ...(entries.length > 200 ? { sampled: true } : {}) };
  }
  if (type === 'array') return { type, observedItems: (Array.isArray(value.observedItems) ? value.observedItems : []).slice(0, 20).map(child => observedShape(child, depth + 1)), sampled: value.sampled === true || value.observedItems?.length > 20 };
  return { type };
}

function observedBody(value) {
  const state = enumValue(value?.state, ['observed', 'empty', 'omitted', 'unavailable'], 'unavailable');
  return { source: 'observed', state, ...(state === 'observed' ? { schema: observedShape(value.schema) } : {}) };
}

function headers(value) {
  return Object.fromEntries(Object.entries(object(value) ? value : {}).filter(([key]) => /^[A-Za-z0-9-]{1,100}$/.test(key)).map(([key, item]) => [key.toLowerCase(), ['content-type', 'accept'].includes(key.toLowerCase()) ? mediaType(item) || '[OMITTED]' : '[REDACTED]']));
}

function harHeaders(items) {
  return headers(Object.fromEntries((Array.isArray(items) ? items : []).filter(item => typeof item.name === 'string').map(item => [item.name, item.value])));
}

function fromHar(har) {
  if (!object(har.log) || !Array.isArray(har.log.entries) || har.log.entries.length > 500) throw new Error('HAR requires log.entries with at most 500 HTTP transactions.');
  const touchpoints = [{ id: 'T0', action: 'unknown', status: 'unverified', requestIds: [] }];
  const requests = har.log.entries.map((entry, index) => {
    if (!object(entry.request) || typeof entry.request.url !== 'string') throw new Error('HAR transaction lacks request URL.');
    const requestHeaders = harHeaders(entry.request.headers);
    const responseHeaders = harHeaders(entry.response?.headers);
    const post = entry.request.postData;
    if (!requestHeaders['content-type'] && mediaType(post?.mimeType)) requestHeaders['content-type'] = mediaType(post.mimeType);
    if (!responseHeaders['content-type'] && mediaType(entry.response?.content?.mimeType)) responseHeaders['content-type'] = mediaType(entry.response.content.mimeType);
    let requestBody = post ? bodyShape(post.text, post.mimeType || requestHeaders['content-type']) : { state: 'empty' };
    if (post && /multipart\/form-data|application\/x-www-form-urlencoded/i.test(post.mimeType || '') && Array.isArray(post.params)) {
      requestBody = { state: 'observed', schema: { type: 'object', properties: Object.fromEntries(post.params.slice(0, 200).filter(item => typeof item.name === 'string').map(item => [item.name, { type: item.fileName !== undefined ? 'binary' : 'string' }])) } };
    }
    const content = entry.response?.content;
    let responseBody = { state: 'unavailable' };
    if ([204, 304].includes(entry.response?.status) || entry.request.method === 'HEAD') responseBody = { state: 'empty' };
    if (content && typeof content.text === 'string') {
      if (content.encoding && content.encoding !== 'base64') responseBody = { state: 'unavailable' };
      else if (content.text.length > 90000) responseBody = { state: 'omitted' };
      else responseBody = bodyShape(content.encoding === 'base64' ? Buffer.from(content.text, 'base64').toString('utf8') : content.text, content.mimeType || responseHeaders['content-type']);
    }
    const requestId = `R${index + 1}`;
    touchpoints[0].requestIds.push(requestId);
    return { id: requestId, touchpoint: 'T0', method: entry.request.method, url: entry.request.url, requestHeaders, responseHeaders, requestBody, responseBody, status: entry.response?.status, outcome: entry.response?.status > 0 ? 'http-response' : 'failed' };
  });
  return { schemaVersion: 1, status: 'partial', touchpoints, requests };
}

function normalizeCapture(input) {
  if (input?.schemaVersion !== 1 || !Array.isArray(input.touchpoints) || !Array.isArray(input.requests) || input.touchpoints.length > 100 || input.requests.length > 500) throw new Error('Expected capture schemaVersion 1 with bounded touchpoints and requests.');
  const seen = new Set();
  const points = input.touchpoints.map(point => {
    if (!id(point.id) || seen.has(point.id) || !Array.isArray(point.requestIds)) throw new Error('Invalid or duplicate touchpoint ID.');
    seen.add(point.id);
    return { id: point.id, action: enumValue(point.action, ['navigate', 'click', 'fill'], 'unknown'), status: enumValue(point.status, ['completed', 'failed', 'running'], 'unverified'), requestIds: [...point.requestIds] };
  });
  const requests = new Set();
  const rows = input.requests.map((row, index) => {
    if (!id(row.id) || requests.has(row.id) || !seen.has(row.touchpoint)) throw new Error('Invalid request ID or missing touchpoint attribution.');
    if (typeof row.method !== 'string' || !/^[A-Z]{1,16}$/.test(row.method)) throw new Error('Request has invalid HTTP method.');
    if (!/^https?:$/.test(new URL(row.url).protocol)) throw new Error('Only HTTP(S) capture URLs are supported.');
    requests.add(row.id);
    return {
      id: row.id, touchpointId: row.touchpoint, sequence: index + 1,
      source: 'observed', method: row.method, url: safeUrl(row.url),
      requestHeaders: headers(row.requestHeaders), responseHeaders: headers(row.responseHeaders),
      request: observedBody(row.requestBody), response: observedBody(row.responseBody),
      status: Number.isInteger(row.status) && row.status >= 100 && row.status <= 599 ? row.status : null,
      outcome: enumValue(row.outcome, ['http-success', 'http-error', 'http-response', 'failed', 'pending'], 'unknown'),
      redirectedFrom: id(row.redirectedFrom) ? row.redirectedFrom : null,
    };
  });
  const assigned = new Set();
  for (const point of points) for (const requestId of point.requestIds) {
    if (!requests.has(requestId) || assigned.has(requestId) || rows.find(row => row.id === requestId).touchpointId !== point.id) throw new Error('Touchpoint request mapping is incomplete or inconsistent.');
    assigned.add(requestId);
  }
  if (assigned.size !== requests.size) throw new Error('Every request needs exactly one touchpoint mapping.');
  for (const row of rows) if (row.redirectedFrom && (!requests.has(row.redirectedFrom) || rows.find(parent => parent.id === row.redirectedFrom).sequence >= row.sequence)) throw new Error('Redirect dependency must reference an earlier request.');
  return { points, rows };
}

function resolveRef(value, doc, seen = new Set()) {
  if (!object(value) || !value.$ref) return value;
  if (typeof value.$ref !== 'string' || !value.$ref.startsWith('#/') || seen.has(value.$ref)) return null;
  seen.add(value.$ref);
  const found = value.$ref.slice(2).split('/').reduce((node, key) => object(node) && Object.hasOwn(node, key.replace(/~1/g, '/').replace(/~0/g, '~')) ? node[key.replace(/~1/g, '/').replace(/~0/g, '~')] : null, doc);
  return resolveRef(found, doc, seen);
}

function documentedShape(value, doc, depth = 0) {
  const resolved = resolveRef(value, doc);
  if (!object(resolved) || depth > 12) return { type: 'unknown', unresolved: true };
  const types = (Array.isArray(resolved.type) ? resolved.type : [resolved.type]).filter(type => ['object', 'array', 'string', 'integer', 'number', 'boolean', 'null'].includes(type));
  if (resolved.nullable === true && !types.includes('null')) types.push('null');
  const result = { types, source: 'documented' };
  if (types.includes('object') || resolved.properties) {
    result.properties = Object.fromEntries(Object.entries(resolved.properties || {}).slice(0, 200).map(([key, child]) => [key, documentedShape(child, doc, depth + 1)]));
    result.required = Array.isArray(resolved.required) ? resolved.required.filter(key => typeof key === 'string') : [];
  }
  if (resolved.items) result.items = documentedShape(resolved.items, doc, depth + 1);
  if (Array.isArray(resolved.enum)) result.enumCount = resolved.enum.length;
  if (typeof resolved.format === 'string' && /^[A-Za-z0-9_.-]{1,40}$/.test(resolved.format)) result.format = resolved.format;
  if (typeof resolved['x-unit'] === 'string' && /^[A-Za-z%][A-Za-z /._%-]{0,31}$/.test(resolved['x-unit'])) result.unit = resolved['x-unit'];
  if (['oneOf', 'anyOf', 'allOf', 'not', 'if', 'pattern', 'additionalProperties', 'const', 'minimum', 'maximum'].some(key => resolved[key] !== undefined)) result.complexConstraintsUnverified = true;
  return result;
}

function compareShapes(observed, documented, pointer = '$', findings = []) {
  if (!observed || !documented || documented.unresolved) return findings;
  const types = documented.types || [];
  if (types.length && !types.includes(observed.type) && !(observed.type === 'number' && types.includes('integer')) && observed.type !== 'unknown') findings.push({ code: 'type-disagreement', field: pointer, observedType: observed.type, documentedTypes: types });
  // Observed number may be integer: scalar values were removed, so do not assert mismatch.
  if (observed.type === 'object') {
    for (const key of documented.required || []) if (!Object.hasOwn(observed.properties || {}, key)) findings.push({ code: 'documented-required-field-absent', field: `${pointer}.${key}` });
    for (const [key, item] of Object.entries(observed.properties || {})) if (documented.properties && Object.hasOwn(documented.properties, key)) compareShapes(item, documented.properties[key], `${pointer}.${key}`, findings);
  }
  if (observed.type === 'array' && documented.items) for (const item of observed.observedItems || []) compareShapes(item, documented.items, `${pointer}[]`, findings);
  return findings;
}

function matchOperation(row, doc) {
  const url = new URL(row.url);
  const matches = [];
  for (const [template, item] of Object.entries(doc.paths || {})) {
    if (!template.startsWith('/') || !object(item) || !object(item[row.method.toLowerCase()])) continue;
    const operation = item[row.method.toLowerCase()];
    const servers = operation.servers || item.servers || doc.servers || [{ url: '/' }];
    for (const server of servers) {
      if (typeof server.url !== 'string' || /\{/.test(server.url)) continue;
      let base;
      try { base = new URL(server.url, url.origin); } catch { continue; }
      const candidate = (base.pathname.replace(/\/$/, '') + template).split('/');
      const actual = url.pathname.split('/');
      if (base.origin !== url.origin || candidate.length !== actual.length) continue;
      if (candidate.every((part, index) => /^\{[^}]+\}$/.test(part) || part === actual[index])) {
        matches.push({ operation, template, item }); break;
      }
    }
  }
  // Literal paths have precedence over matching template paths per OpenAPI.
  const literal = matches.filter(match => !match.template.includes('{'));
  return (literal.length === 1 ? literal : matches).length === 1 ? (literal.length === 1 ? literal : matches)[0] : null;
}

function documentedBody(container, type, doc) {
  const resolved = resolveRef(container, doc);
  if (container?.$ref && !resolved) return { state: 'unresolved' };
  if (!object(resolved?.content)) return { state: 'undocumented' };
  const entry = Object.entries(resolved.content).find(([key]) => key === type) || Object.entries(resolved.content).find(([key]) => key === '*/*' || key.endsWith('/*') && type?.startsWith(key.slice(0, -1)));
  if (!entry) return { state: 'media-type-unmatched' };
  return { state: 'documented', mediaType: mediaType(entry[0]), schema: documentedShape(entry[1]?.schema, doc) };
}

function schemaUnverified(schema) {
  return !!schema && (schema.unresolved || schema.complexConstraintsUnverified || Object.values(schema.properties || {}).some(schemaUnverified) || schemaUnverified(schema.items));
}

function buildContract(input, { format = 'capture', openapi } = {}) {
  if (!['capture', 'har'].includes(format)) throw new Error('format must be capture or har.');
  if (openapi && (!/^3\.[01]\./.test(openapi.openapi || '') || !object(openapi.paths))) throw new Error('Cross-check requires an OpenAPI 3.0 or 3.1 JSON document with paths.');
  const { points, rows } = normalizeCapture(format === 'har' ? fromHar(input) : input);
  const findings = [];
  const add = (code, requestId = null) => findings.push({ code, requestId });
  if (format === 'capture' && input.status !== 'captured') add('capture-incomplete-or-status-unknown');
  if (format === 'har' && rows.length) add('har-action-provenance-missing');
  for (const row of rows) {
    row.unknowns = ['requiredness', 'enum-coverage', 'units', 'pagination-semantics', 'complete-error-coverage', 'mobile-auth-contract'];
    const names = Object.keys(row.requestHeaders);
    row.mobileAuth = { source: 'inferred', status: 'needs-confirmation', signals: [] };
    if (names.includes('cookie')) row.mobileAuth.signals.push('cookie-header-observed');
    if (names.some(key => /csrf|xsrf/.test(key))) row.mobileAuth.signals.push('csrf-header-observed');
    if (/\/bff(?:\/|\?|$)/i.test(row.url)) row.mobileAuth.signals.push('bff-path-candidate');
    if (row.mobileAuth.signals.length) add('mobile-auth-handoff-required', row.id);
    const query = [...new URL(row.url).searchParams.keys()];
    row.paginationCandidates = { source: 'inferred', names: query.filter(key => /^(page|cursor|offset|limit|after|before)$/i.test(key)), status: 'unverified' };
    row.transport = { request: mediaType(row.requestHeaders['content-type']), response: mediaType(row.responseHeaders['content-type']) };
    row.errorEvidence = { source: 'observed', httpError: row.status !== null && row.status >= 400, graphqlErrorsField: !!row.response.schema?.properties?.errors };
    if (row.request.schema?.properties?.query || row.request.schema?.properties?.operationName || row.errorEvidence.graphqlErrorsField) add('graphql-operation-values-and-semantics-unverified', row.id);
    if (row.transport.request === 'multipart/form-data') add('multipart-upload-stages-unverified', row.id);
    if (row.transport.response === 'text/event-stream') add('stream-frames-unavailable', row.id);
    if (row.response.state === 'unavailable' || row.response.state === 'omitted') add('response-body-coverage-gap', row.id);
    if (row.status === null) add('response-status-unavailable', row.id);
    row.dependencies = { source: 'observed', redirectedFrom: row.redirectedFrom, causalDependencies: 'unverified', ordering: 'capture-order-only' };
    delete row.redirectedFrom;
    if (openapi) {
      const match = matchOperation(row, openapi);
      if (!match) { row.documentation = { source: 'documented', state: 'operation-unmatched-or-ambiguous' }; add('openapi-operation-unmatched-or-ambiguous', row.id); }
      else {
        const response = match.operation.responses?.[String(row.status)] || match.operation.responses?.[`${String(row.status)[0]}XX`] || match.operation.responses?.default;
        const parameterMap = new Map();
        for (const raw of [...(Array.isArray(match.item.parameters) ? match.item.parameters : []), ...(Array.isArray(match.operation.parameters) ? match.operation.parameters : [])]) {
          const parameter = resolveRef(raw, openapi);
          if (!object(parameter) || typeof parameter.name !== 'string' || !['query', 'header', 'path', 'cookie'].includes(parameter.in)) { add('openapi-parameter-unresolved', row.id); continue; }
          parameterMap.set(`${parameter.in}:${parameter.name}`, { name: parameter.name, in: parameter.in, required: typeof parameter.required === 'boolean' ? parameter.required : null, schema: documentedShape(parameter.schema, openapi) });
        }
        const parameters = [...parameterMap.values()];
        for (const parameter of parameters) if (parameter.required && ((parameter.in === 'query' && !query.includes(parameter.name)) || (parameter.in === 'header' && !names.includes(parameter.name.toLowerCase())))) findings.push({ code: 'documented-required-parameter-absent', requestId: row.id, field: parameter.name });
        row.documentation = { source: 'documented', state: 'operation-matched', path: match.template, parameters, request: documentedBody(match.operation.requestBody, row.transport.request, openapi), response: documentedBody(response, row.transport.response, openapi) };
        const bodyDefinition = resolveRef(match.operation.requestBody, openapi);
        row.documentation.request.required = typeof bodyDefinition?.required === 'boolean' ? bodyDefinition.required : null;
        if (bodyDefinition?.required === true && row.request.state === 'empty') add('documented-required-request-body-absent', row.id);
        for (const kind of ['request', 'response']) {
          const documented = row.documentation[kind];
          if (documented.state === 'unresolved' || schemaUnverified(documented.schema)) add(`openapi-${kind}-constraints-unverified`, row.id);
          if (documented.state === 'documented' && row[kind].state === 'observed') for (const finding of compareShapes(row[kind].schema, documented.schema)) findings.push({ ...finding, requestId: row.id, body: kind });
          if (documented.state === 'media-type-unmatched') add(`openapi-${kind}-media-type-unmatched`, row.id);
        }
        if (!response && row.status !== null) add('openapi-status-undocumented', row.id);
      }
    }
  }
  const contract = {
    contractVersion: '1.0.0', source: { format, ...(format === 'capture' ? { captureStatus: enumValue(input.status, ['captured', 'partial', 'failed'], 'unknown') } : {}), sha256: createHash('sha256').update(JSON.stringify(input)).digest('hex'), ...(openapi ? { openapiSha256: createHash('sha256').update(JSON.stringify(openapi)).digest('hex') } : {}) },
    status: 'needs-review', mobileVerification: 'unverified',
    touchpoints: points.map(point => ({ ...point, provenance: format === 'har' ? 'unattributed' : 'capture-window', outcome: point.status === 'completed' ? 'browser-action-completed-only' : 'unverified' })),
    requests: rows, findings,
    limitations: [
      'Observed shapes are samples, not required fields, complete enums, units or proven API semantics.',
      'Temporal ordering and redirects do not prove other causal dependencies or UI/business outcomes.',
      'Raw values, examples, enum values, descriptions and arbitrary metadata are omitted; field names, origins and readable routes remain visible.',
      'HAR has no reliable touchpoint attribution; pageref and initiator metadata do not establish which action caused a call.',
      'OpenAPI cross-check is a subset, not full schema validation: local refs and basic types/requiredness only; composition/constraints remain unverified. Relative servers use the captured origin.',
      'No external refs are fetched. Browser-only auth, GraphQL semantics, upload stages and streaming need a supported mobile contract.',
    ],
  };
  validateContract(contract);
  return contract;
}

function validateContract(contract) {
  if (contract?.contractVersion !== '1.0.0' || contract.status !== 'needs-review' || contract.mobileVerification !== 'unverified' || !['capture', 'har'].includes(contract.source?.format) || !/^[a-f0-9]{64}$/.test(contract.source?.sha256 || '') || !Array.isArray(contract.touchpoints) || !Array.isArray(contract.requests)) throw new Error('Invalid API contract envelope.');
  const points = new Set(contract.touchpoints.map(point => point.id));
  if (points.size !== contract.touchpoints.length || contract.touchpoints.some(point => !id(point.id) || !Array.isArray(point.requestIds))) throw new Error('Invalid contract touchpoints.');
  const ids = new Set(contract.requests.map(row => row.id));
  if (ids.size !== contract.requests.length || contract.requests.some(row => !id(row.id) || !points.has(row.touchpointId))) throw new Error('Duplicate or invalid contract request IDs.');
  const assignments = contract.touchpoints.flatMap(point => point.requestIds);
  if (new Set(assignments).size !== ids.size || assignments.length !== ids.size || assignments.some(item => !ids.has(item))) throw new Error('Contract traceability is incomplete.');
  for (const point of contract.touchpoints) if (point.requestIds.some(requestId => contract.requests.find(row => row.id === requestId).touchpointId !== point.id)) throw new Error('Contract touchpoint mapping is inconsistent.');
  return true;
}

function writeContract(contract, directory) {
  validateContract(contract);
  fs.mkdirSync(directory, { mode: 0o700 });
  fs.writeFileSync(path.join(directory, 'contract.json'), JSON.stringify(contract, null, 2) + '\n', { mode: 0o600 });
  const text = ['# Mobile API handoff contract', '', 'Status: needs-review. Mobile verification: unverified.', '', '## Touchpoints', ''];
  for (const point of contract.touchpoints) text.push(`- ${point.id}: ${point.action}; ${point.requestIds.join(', ') || 'no request observed'}; ${point.provenance}.`);
  text.push('', '## Requests', '');
  for (const row of contract.requests) text.push(`- ${row.id} → ${row.touchpointId}: ${row.method} ${row.url.replace(/[\r\n`<>]/g, '')}; HTTP ${row.status ?? 'unavailable'}; request ${row.request.state}; response ${row.response.state}.`);
  text.push('', '## Findings', '', ...contract.findings.map(item => `- ${item.requestId || 'Source'}: ${item.code}${item.field ? ` (${item.field.replace(/[\r\n`<>]/g, '')})` : ''}`), '', '## Limitations', '', ...contract.limitations.map(item => `- ${item}`));
  fs.writeFileSync(path.join(directory, 'contract.md'), text.join('\n') + '\n', { mode: 0o600 });
}

module.exports = { readJson, observedShape, fromHar, normalizeCapture, resolveRef, documentedShape, compareShapes, buildContract, validateContract, writeContract };
