'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { validateContract } = require('./api-contract');
const roles = ['network', 'auth', 'domain', 'state', 'navigation'];
const platforms = ['android', 'ios', 'flutter', 'rn', 'kmp', 'other'];

// Repository inputs are evidence, never executable instructions. Do not follow links.
function existingFile(root, relative) {
  if (typeof relative !== 'string' || relative.length > 500 || /[\x00-\x1f]/.test(relative) || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('Mapping requires a safe repository-relative file path.');
  const target = fs.realpathSync(path.resolve(root, relative));
  if (!target.startsWith(root + path.sep) || !fs.statSync(target).isFile()) throw new Error('Mapping must resolve to an existing file inside the app repository.');
  return path.relative(root, target).split(path.sep).join('/');
}
function readMarker(file) {
  const fd = fs.openSync(file, 'r');
  try { const data = Buffer.alloc(65536); return data.subarray(0, fs.readSync(fd, data, 0, data.length, 0)).toString('utf8'); }
  finally { fs.closeSync(fd); }
}
function detectPlatforms(root) {
  const found = new Set(); let visited = 0;
  function walk(dir, depth) {
    if (depth > 8) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (++visited > 20000) throw new Error('Repository scan exceeds 20000 entries; use a narrower app root.');
      if (item.isSymbolicLink()) continue;
      if (item.isDirectory()) {
        if (item.name.endsWith('.xcodeproj')) found.add('ios');
        if (!['.git', 'node_modules', 'build', '.gradle', '.dart_tool', 'Pods', 'vendor'].includes(item.name)) walk(path.join(dir, item.name), depth + 1);
      } else if (item.isFile()) {
        if (item.name === 'AndroidManifest.xml') found.add('android');
        if (item.name.endsWith('.swift')) found.add('ios');
        if (item.name === 'pubspec.yaml' && /(?:^|\n)\s*sdk:\s*flutter\s*(?:\n|$)/.test(readMarker(path.join(dir, item.name)))) found.add('flutter');
        if (item.name === 'package.json') {
          let pkg; try { pkg = JSON.parse(readMarker(path.join(dir, item.name))); } catch { continue; }
          if (pkg.dependencies?.['react-native'] || pkg.devDependencies?.['react-native']) found.add('rn');
        }
        if (/^build\.gradle(?:\.kts)?$/.test(item.name) && /kotlin\(["']multiplatform["']\)|org\.jetbrains\.kotlin\.multiplatform/.test(readMarker(path.join(dir, item.name)))) found.add('kmp');
      }
    }
  }
  walk(root, 0); return [...found].sort();
}
function buildHandoff(contract, manifest, repository) {
  validateContract(contract);
  if (contract.requests.length > 500 || contract.touchpoints.length > 100 || !Array.isArray(contract.findings)) throw new Error('Invalid or oversized contract.');
  if (manifest?.version !== 1 || !platforms.includes(manifest.platform) || !Array.isArray(manifest.touchpoints) || manifest.touchpoints.length > 100) throw new Error('Expected mapping version 1, platform and touchpoints.');
  const root = fs.realpathSync(repository), detectedPlatforms = detectPlatforms(root);
  if (manifest.platform !== 'other' && !detectedPlatforms.includes(manifest.platform)) throw new Error('Selected platform has no detected repository marker.');
  const points = new Set(contract.touchpoints.map(p => p.id)), mapped = new Set();
  const mappings = manifest.touchpoints.map(mapping => {
    if (!points.has(mapping.id) || mapped.has(mapping.id)) throw new Error('Unknown or duplicate mapped touchpoint.');
    mapped.add(mapping.id);
    const files = {};
    for (const role of roles) {
      const file = mapping.files?.[role];
      if (file) {
        if (!['shared', 'native'].includes(file.ownership)) throw new Error('File ownership must be shared or native.');
        files[role] = { path: existingFile(root, file.path), ownership: file.ownership };
      }
    }
    const reviews = mapping.requests || [];
    if (!Array.isArray(reviews)) throw new Error('Request reviews must be an array.');
    const expected = contract.touchpoints.find(p => p.id === mapping.id).requestIds;
    const seen = new Set();
    const requestReviews = reviews.map(review => {
      if (!expected.includes(review.id) || seen.has(review.id)) throw new Error('Unknown or duplicate reviewed request.');
      seen.add(review.id);
      if (!['supported', 'gap'].includes(review.nativeEndpoint) || !['supported', 'gap', 'not-required'].includes(review.nativeAuth)) throw new Error('Request review requires explicit native endpoint and auth decisions.');
      return { id: review.id, nativeEndpoint: review.nativeEndpoint, nativeAuth: review.nativeAuth, evidence: existingFile(root, review.evidence), findingsReviewed: review.findingsReviewed === true };
    });
    return { id: mapping.id, files, requestReviews };
  });
  const tasks = contract.touchpoints.map(point => {
    const mapping = mappings.find(m => m.id === point.id);
    const gaps = roles.filter(role => !mapping?.files[role]).map(role => `map-existing-${role}-ownership`);
    if (contract.source.captureStatus && contract.source.captureStatus !== 'captured') gaps.push('capture-incomplete');
    if (contract.findings.some(f => !f.requestId)) gaps.push('global-contract-findings-unreviewed');
    if (manifest.platform === 'other') gaps.push('confirm-custom-stack-and-tooling');
    if (point.status !== 'completed') gaps.push('browser-action-incomplete');
    if (point.provenance === 'unattributed') gaps.push('establish-user-action-attribution');
    for (const id of point.requestIds) {
      const review = mapping?.requestReviews.find(r => r.id === id);
      if (!review || review.nativeEndpoint !== 'supported') gaps.push(`${id}:native-endpoint-unresolved`);
      if (!review || review.nativeAuth === 'gap') gaps.push(`${id}:native-auth-unresolved`);
      if (contract.findings.some(f => f.requestId === id) && !review?.findingsReviewed) gaps.push(`${id}:contract-findings-unreviewed`);
    }
    return { id: `implement-${point.id}`, touchpointId: point.id, requestIds: [...point.requestIds], status: gaps.length ? 'blocked' : 'ready-for-review', gaps,
      steps: ['Review mapped client/auth/domain/state/navigation boundaries; reuse current stack.', 'Select business calls; omit preflight, analytics and duplicate fetches only after review.', 'Resolve native auth/endpoint and schema conflicts before dependent wiring.', 'Implement scoped DTO/domain/state changes in mapped files; propose new files explicitly during code review.', 'Preserve no-network validation actions and documented native navigation differences.'],
      acceptance: ['Matching request/response contract and UI states with equivalent fixtures.', 'Cancellation reaches transport; stale results do not replace current UI state.', 'Auth expiry follows existing refresh/logout policy; no captured browser credentials.', 'Retry only supported safe/idempotent operations; no blind write retries.', 'Validate input locally and map server validation errors.', 'Uploads: document stages, progress, cancellation and retry if applicable; otherwise record not applicable.'],
      verification: { contract: 'unverified', mobileNetwork: 'unverified', mobileUI: 'unverified' } };
  });
  return { handoffVersion: '1.0.0', platform: manifest.platform, detectedPlatforms, contractSha256: createHash('sha256').update(JSON.stringify(contract)).digest('hex'), status: tasks.some(t => t.status === 'blocked') ? 'blocked' : 'needs-review', mobileVerification: 'unverified', mappings, tasks,
    limitations: ['Mappings and native support decisions are user-reviewed inputs, not automatically proven semantics.', 'Detection uses bounded markers, not architecture inference; nested app markers can overlap.', 'No app source is modified and no requests are replayed.', 'Contract findings remain in the source contract; reviewed does not mean resolved.', 'Device/network/UI evidence is required separately for every target.'] };
}
function writeHandoff(report, directory) {
  fs.mkdirSync(directory, { mode: 0o700 });
  fs.writeFileSync(path.join(directory, 'handoff.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  fs.writeFileSync(path.join(directory, 'handoff.md'), ['# Mobile integration handoff', '', `Status: ${report.status}; platform: ${report.platform}; mobile verification: unverified.`, '', ...report.tasks.flatMap(t => [`## ${t.id}`, `Status: ${t.status}`, ...t.gaps.map(g => `- Gap: ${g}`), ...t.steps.map(s => `- ${s}`), ...t.acceptance.map(a => `- Check: ${a}`), '']), ...report.limitations.map(l => `- ${l}`)].join('\n') + '\n', { mode: 0o600 });
}
module.exports = { existingFile, detectPlatforms, buildHandoff, writeHandoff };
