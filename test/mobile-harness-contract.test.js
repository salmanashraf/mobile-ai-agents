'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test('Mobile Harness system prompt stays within the repository token budget', () => {
  const agent = read('agents/cross-platform/mobile-harness/agent.md');
  const prompt = agent.match(/## System Prompt\s+```text\s+([\s\S]*?)\s+```/);
  assert.ok(prompt, 'system prompt block is required');
  const approximateTokens = prompt[1].trim().split(/\s+/).length;
  assert.ok(approximateTokens <= 600, `system prompt is ${approximateTokens} words; limit is 600`);
  assert.match(prompt[1], /Output MUST follow the exact format specified/);
});

test('agent and workflow enforce the enterprise execution contract', () => {
  for (const file of [
    'agents/cross-platform/mobile-harness/agent.md',
    'workflows/mobile-harness.md',
  ]) {
    const content = read(file);
    for (const required of [
      'HARNESS_POLICY.json',
      'runId',
      'baseline commit',
      'risk classification',
      'evidence.json',
      'result.json',
      'rollback',
      'expires',
    ]) {
      assert.match(content, new RegExp(required, 'i'), `${file} must mention ${required}`);
    }
  }
});

test('enterprise policy template defines all risk levels and protected gates', () => {
  const policy = readJson('templates/mobile-harness-policy.json');
  const schema = readJson('templates/mobile-harness-policy.schema.json');

  assert.equal(policy.version, 1);
  assert.equal(policy.evidence.hashAlgorithm, 'sha256');
  assert.deepEqual(Object.keys(policy.gates), ['low', 'medium', 'high', 'regulated']);
  assert.ok(policy.gates.regulated.includes('privacy'));
  assert.ok(policy.gates.high.includes('rollback'));
  assert.ok(policy.exceptions.forbiddenGates.includes('security'));
  assert.equal(schema.additionalProperties, false);
});

test('result and evidence schemas require reproducible run metadata', () => {
  const result = readJson('templates/mobile-harness-result.schema.json');
  const evidence = readJson('templates/mobile-harness-evidence.schema.json');
  const resultExample = readJson('templates/mobile-harness-result.example.json');
  const evidenceExample = readJson('templates/mobile-harness-evidence.example.json');

  assert.ok(result.required.includes('runId'));
  assert.ok(result.required.includes('repository'));
  assert.ok(result.required.includes('scope'));
  assert.ok(result.required.includes('evidenceManifest'));
  assert.equal(result.properties.repository.additionalProperties, false);
  assert.ok(evidence.properties.artifacts.items.required.includes('sha256'));
  assert.equal(evidence.properties.artifacts.items.properties.sha256.pattern, '^[a-f0-9]{64}$');
  assert.equal(resultExample.runId, evidenceExample.runId);
  const evidenceIds = new Set(evidenceExample.artifacts.map(artifact => artifact.id));
  for (const gate of resultExample.gates) {
    assert.ok(gate.evidence.length > 0);
    gate.evidence.forEach(id => assert.ok(evidenceIds.has(id), `missing evidence ${id}`));
  }
  evidenceExample.artifacts.forEach(artifact => assert.match(artifact.sha256, /^[a-f0-9]{64}$/));
});

test('issue 20 acceptance links remain in the harness agent', () => {
  const agent = read('agents/cross-platform/mobile-harness/agent.md');
  assert.match(agent, /Rough Idea To Verified Feature Example/);
  assert.match(agent, /\/prd-verification/);
  assert.match(agent, /mobile-flight-recorder/);
  assert.match(agent, /device-proof-report/);
});
