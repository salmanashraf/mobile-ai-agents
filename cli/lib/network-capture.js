'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

function origin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP(S) URL without embedded credentials.');
  }
  return url.origin;
}

// Values are deliberately omitted, including harmless-looking IDs and query strings.
function safeUrl(value) {
  const url = new URL(value);
  const pathname = url.pathname.split('/').map(part => /^[a-z][a-z_-]{0,40}$/i.test(part) ? part : part ? '[REDACTED]' : '').join('/');
  return url.origin + pathname + (url.search ? '?' + [...url.searchParams.keys()].map(key => `${encodeURIComponent(key)}=[REDACTED]`).join('&') : '');
}

function shape(value, depth = 0) {
  if (depth > 12) return { type: 'unknown', reason: 'depth-limit' };
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    const variants = [...new Set(value.slice(0, 20).map(item => JSON.stringify(shape(item, depth + 1))))].map(item => JSON.parse(item));
    return { type: 'array', observedItems: variants, sampled: value.length > 20 };
  }
  if (typeof value === 'object') return { type: 'object', properties: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item, depth + 1)])) };
  return { type: typeof value };
}

function bodyShape(text, contentType = '') {
  if (!text) return { state: 'empty' };
  if (Buffer.byteLength(text) > 65536) return { state: 'omitted', reason: 'body-size-limit' };
  if (/json/i.test(contentType)) {
    try { return { state: 'observed', schema: shape(JSON.parse(text)) }; }
    catch { return { state: 'unavailable', reason: 'invalid-json' }; }
  }
  if (/application\/x-www-form-urlencoded/i.test(contentType)) {
    return { state: 'observed', schema: { type: 'object', properties: Object.fromEntries([...new URLSearchParams(text).keys()].map(key => [key, { type: 'string' }])) } };
  }
  return { state: 'omitted', reason: 'non-json-body' };
}

function safeHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, ['content-type', 'accept'].includes(key.toLowerCase()) ? value.split(';')[0] : '[REDACTED]']));
}

function validateFlow(flow) {
  if (!Array.isArray(flow) || flow.length > 50) throw new Error('Flow must be an array with at most 50 steps.');
  for (const step of flow) {
    if (!step || !['click', 'fill'].includes(step.action) || typeof step.selector !== 'string' || !step.selector || step.selector.length > 500) throw new Error('Each step needs action click|fill and a selector.');
    if (step.action === 'fill' && typeof step.value !== 'string') throw new Error('Fill steps need a string value; use test data only.');
    if (step.waitMs !== undefined && (!Number.isInteger(step.waitMs) || step.waitMs < 0 || step.waitMs > 10000)) throw new Error('waitMs must be an integer from 0 to 10000.');
  }
}

function loadPlaywright() {
  try { return require('playwright'); }
  catch {
    try { return createRequire(path.join(process.cwd(), 'package.json'))('playwright'); }
    catch { throw new Error('Optional browser tooling missing. Install playwright in your project, then run: npx playwright install chromium'); }
  }
}

async function capture({ url, flow = [], allowedOrigins = [], allowWrites = false, output, headless = true, channel, playwright }) {
  const firstOrigin = origin(url);
  const allowed = new Set([firstOrigin, ...allowedOrigins.map(origin)]);
  validateFlow(flow);
  if (!output) throw new Error('Choose an output directory.');
  // Every run gets a fresh directory: never overwrite an existing report or follow it as a symlink.
  fs.mkdirSync(output, { recursive: false });
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), source: safeUrl(url),
    viewport: { width: 390, height: 844 }, status: 'capturing',
    privacy: 'Body values omitted; header values and query values redacted. Review field names and route segments before sharing.',
    limitations: [
      'Touchpoint attribution is temporal, not proof of causality; delayed work may belong to a later window.',
      'Fresh isolated browser; no existing login session imported. Service workers blocked and routing disables HTTP cache.',
      'No screenshots, DOM text, raw HAR, SSE messages or multipart values saved. WebSocket connections are blocked.',
      'Observed shapes are samples, not complete API contracts. No mobile implementation or mobile parity verified.',
      'One page supported; popups blocked. JSON bodies capped at 64 KiB after transfer; request count capped at 500.',
      'Same-origin analytics are not automatically classified as product APIs. UI state is metadata only, not business outcome proof.',
    ], touchpoints: [], requests: [],
  };
  let browser, context, current, stopped = false;
  const records = new Map();
  const pending = new Set();
  const track = promise => { pending.add(promise); promise.finally(() => pending.delete(promise)); };
  const flush = async () => { await Promise.allSettled([...pending]); };
  const save = () => {
    fs.writeFileSync(path.join(output, 'capture.json'), JSON.stringify(report, null, 2));
    const lines = ['# Website API capture', '', `Status: ${report.status}`, '', 'Body values are omitted. No mobile parity has been verified.', '', '## Touchpoints', ''];
    for (const point of report.touchpoints) {
      lines.push(`### ${point.id}: ${point.action}`, '', `Result: ${point.status}. Requests: ${point.requestIds.join(', ') || 'none observed in this window'}.`, '');
      for (const id of point.requestIds) {
        const item = report.requests.find(r => r.id === id);
        lines.push(`- ${id}: ${item.method} ${item.url.replace(/[\r\n`<>]/g, '')} — ${item.status || item.outcome}`);
      }
      lines.push('');
    }
    lines.push('## Limitations', '', ...report.limitations.map(item => `- ${item}`));
    fs.writeFileSync(path.join(output, 'report.md'), lines.join('\n') + '\n');
  };
  try {
    const pw = playwright || loadPlaywright();
    report.tool = { name: 'playwright', node: process.version };
    browser = await pw.chromium.launch({ headless, ...(channel ? { channel } : {}) });
    report.tool.browser = browser.version();
    context = await browser.newContext({ viewport: report.viewport, serviceWorkers: 'block', acceptDownloads: false });
    if (typeof context.routeWebSocket !== 'function') throw new Error('Install a current Playwright version with WebSocket routing support.');
    await context.routeWebSocket('**/*', socket => socket.close());
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    context.on('page', popup => { if (popup !== page) popup.close().catch(() => {}); });
    context.on('request', request => {
      if (stopped || report.requests.length >= 500) return;
      const headers = request.headers();
      const record = {
        id: `R${report.requests.length + 1}`, touchpoint: current?.id || null,
        at: new Date().toISOString(), method: request.method(), url: safeUrl(request.url()),
        resourceType: request.resourceType(), requestHeaders: safeHeaders(headers),
        auth: headers.authorization ? 'authorization-header' : headers.cookie ? 'cookie' : 'not-observed',
        requestBody: bodyShape(request.postData(), headers['content-type']), outcome: 'pending',
        redirectedFrom: records.get(request.redirectedFrom())?.id || null,
      };
      records.set(request, record); report.requests.push(record); current?.requestIds.push(record.id);
    });
    await context.route('**/*', async route => {
      const request = route.request();
      const record = records.get(request);
      let reason;
      if (report.requests.length >= 500) reason = 'request-limit';
      else if (!allowed.has(new URL(request.url()).origin)) reason = 'outside-allowed-origins';
      else if (!allowWrites && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) reason = 'writes-disabled';
      if (reason) { if (record) record.blockedReason = reason; await route.abort(); }
      else await route.continue();
    });
    context.on('requestfailed', request => {
      const record = records.get(request);
      if (record) { record.outcome = 'failed'; record.failure = record.blockedReason || 'network-failure'; }
    });
    context.on('response', response => {
      const record = records.get(response.request());
      if (!record) return;
      record.status = response.status(); record.responseHeaders = safeHeaders(response.headers());
      record.outcome = response.ok() ? 'http-success' : 'http-error';
      track((async () => {
        const type = response.headers()['content-type'] || '';
        if (!/json/i.test(type)) { record.responseBody = { state: 'omitted', reason: 'non-json-body' }; return; }
        if (Number(response.headers()['content-length']) > 65536) { record.responseBody = { state: 'omitted', reason: 'body-size-limit' }; return; }
        // A stalled body cannot hold finalization indefinitely.
        let timer;
        try {
          const text = await Promise.race([response.text(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 5000); })]);
          record.responseBody = bodyShape(text, type);
        } catch { record.responseBody = { state: 'unavailable', reason: 'body-read-failed-or-timeout' }; }
        finally { clearTimeout(timer); }
      })());
    });
    const state = async () => ({
      url: safeUrl(page.url() === 'about:blank' ? url : page.url()),
      invalidInputs: await page.locator('input:invalid,select:invalid,textarea:invalid').count().catch(() => null),
    });
    const window = async (action, execute, waitMs = 500) => {
      current = { id: `T${report.touchpoints.length + 1}`, action, startedAt: new Date().toISOString(), requestIds: [], before: await state(), status: 'running' };
      report.touchpoints.push(current);
      try { await execute(); await page.waitForTimeout(waitMs); current.status = 'completed'; }
      catch { current.status = 'failed'; throw new Error('Browser action failed; check selector, access and tooling. Sensitive browser error details omitted.'); }
      finally { await flush(); current.after = await state(); current.finishedAt = new Date().toISOString(); }
    };
    await window('navigate', () => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }));
    for (const step of flow) {
      await window(step.action, () => step.action === 'fill' ? page.locator(step.selector).fill(step.value) : page.locator(step.selector).click(), step.waitMs ?? 500);
    }
    report.status = report.requests.length >= 500 || report.requests.some(r => r.outcome === 'pending' || r.outcome === 'failed' || r.outcome === 'http-error' || r.responseBody?.state === 'unavailable') ? 'partial' : 'captured';
  } catch (error) {
    report.status = 'failed';
    // Only our own actionable setup errors are returned; browser messages may contain secrets.
    report.error = /Optional browser tooling|Browser action failed/.test(error.message) ? error.message : 'Browser capture unavailable; check Playwright/browser installation and scoped site access.';
  } finally {
    stopped = true;
    await context?.close().catch(() => {});
    await flush();
    await browser?.close().catch(() => {});
    report.finishedAt = new Date().toISOString(); save();
  }
  return report;
}

module.exports = { capture, origin, safeUrl, shape, bodyShape, safeHeaders, validateFlow };
