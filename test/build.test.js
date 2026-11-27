'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cmdBuild, buildPrompt } = require('../cli/commands/build');

test('build hands literal user input to interactive client without a shell', () => {
  let captured;
  const result = cmdBuild(['Habit tracker; $(touch unwanted)', '--client', 'codex'], {
    spawnSync: (...args) => { captured = args; return { status: 0 }; },
  });
  assert.equal(result.status, 0);
  assert.equal(captured[0], 'codex');
  assert.equal(captured[1][0], '--');
  assert.match(captured[1][1], /Habit tracker; \$\(touch unwanted\)/);
  assert.match(captured[1][1], /MOBILE-HARNESS/);
  assert.equal(captured[2].shell, false);
  assert.equal(captured[2].stdio, 'inherit');
});
test('missing clients provide a useful recovery', () => {
  assert.throws(() => cmdBuild(['My app'], { spawnSync: () => ({error: {code: 'ENOENT'}}) }), /Install and sign in/);
});
test('invalid requests fail before starting an AI client', () => {
  assert.throws(() => buildPrompt({_: []}), /Describe your app/);
  assert.throws(() => buildPrompt({_: ['App'], figma: 'https://example.com/design'}), /Figma HTTPS/);
  assert.throws(() => cmdBuild(['App', '--client', 'unknown']), /claude or.*codex/);
});
test('preview does not start a client', () => {
  const result = cmdBuild(['App', '--preview'], {spawnSync: () => { throw new Error('Must not launch'); }});
  assert.equal(result.preview, true);
});
