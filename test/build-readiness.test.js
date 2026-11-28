'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkBuildReadiness } = require('../cli/commands/build-readiness');
const { cmdBuild } = require('../cli/commands/build');
test('readiness uses a bounded version probe and preserves unverified status', () => {
  const report = checkBuildReadiness('codex', {
    spawnSync: (name, args, opts) => {
      assert.equal(name, 'codex'); assert.deepEqual(args, ['--version']);
      assert.equal(opts.shell, false); assert.equal(opts.timeout, 5000);
      return {status: 0};
    }, inspectMcpConfiguration: () => [{client: 'codex'}],
  });
  assert.equal(report.cli.status, 'available');
  assert.equal(report.mobileMcp.status, 'configured-unverified');
  assert.equal(report.authentication, 'not-checked');
});
test('missing, failing and timed out clients are unavailable without exposing raw output', () => {
  for (const probe of [{error:{code:'ENOENT'}}, {error:{code:'ETIMEDOUT'}}, {status:1, stderr:'secret'}, {signal:'SIGTERM'}]) {
    const report = checkBuildReadiness('claude', {spawnSync:()=>probe, inspectMcpConfiguration:()=>[]});
    assert.equal(report.cli.status, 'unavailable');
    assert.ok(!JSON.stringify(report).includes('secret'));
  }
});
test('check rejects setup and project input before invoking either', () => {
  for (const args of [['--check','--mobile-mcp'], ['--check','--brief','missing.md'], ['App','--check']]) {
    assert.throws(()=>cmdBuild(args, {spawnSync:()=>{throw new Error('Unexpected probe');}}), /only --client/);
  }
});
