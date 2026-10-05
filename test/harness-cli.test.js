'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  initHarnessPolicy,
  loadHarnessPolicy,
  validateHarnessPolicy,
} = require('../cli/commands/harness');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-harness-policy-'));
}

test('harness policy init is idempotent and supports profiles', () => {
  const cwd = tempDir();
  const first = initHarnessPolicy({ cwd, profile: 'regulated' });
  const second = initHarnessPolicy({ cwd, profile: 'regulated' });
  const loaded = loadHarnessPolicy({ cwd });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(loaded.policy.profile, 'regulated');
  assert.equal(first.schemaFiles.length, 3);
  first.schemaFiles.forEach(file => assert.equal(fs.existsSync(file), true));
  assert.equal(loaded.policy.$schema, './.mobile-ai-agents/harness/schemas/mobile-harness-policy.schema.json');
  assert.deepEqual(loaded.errors, []);
});

test('harness policy init preserves an existing custom policy by default', () => {
  const cwd = tempDir();
  const file = path.join(cwd, 'HARNESS_POLICY.json');
  fs.writeFileSync(file, '{"custom":true}\n');

  assert.throws(() => initHarnessPolicy({ cwd }), /already exists/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{"custom":true}\n');
});

test('harness policy validation reports missing enterprise fields', () => {
  const errors = validateHarnessPolicy({ version: 1, profile: 'enterprise', defaultRisk: 'medium' });

  assert.match(errors.join(' '), /gates\.low/);
  assert.match(errors.join(' '), /hashAlgorithm/);
  assert.match(errors.join(' '), /ownership\.security/);
});

test('harness policy validation rejects unknown gates and fields', () => {
  const cwd = tempDir();
  const { policy } = initHarnessPolicy({ cwd });
  policy.gates.high.push('made_up_gate');
  policy.unreviewedSetting = true;

  const errors = validateHarnessPolicy(policy);
  assert.match(errors.join(' '), /unsupported gate: made_up_gate/);
  assert.match(errors.join(' '), /Unknown top-level field: unreviewedSetting/);
});
