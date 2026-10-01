'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createCommandRouter } = require('../cli/commands/router');

test('router preserves legacy command dispatch', async () => {
  const calls = [];
  const handlers = Object.fromEntries(
    ['start', 'install', 'add', 'memory', 'list', 'help'].map(name => [name, args => calls.push({ name, args })]),
  );
  const route = createCommandRouter(handlers);

  await route('install', ['--platform', 'android']);
  await route(undefined);

  assert.deepEqual(calls, [
    { name: 'install', args: ['--platform', 'android'] },
    { name: 'help', args: [] },
  ]);
});

test('router reports unknown commands without terminating the process', async () => {
  const noop = () => {};
  const route = createCommandRouter({
    start: noop,
    install: noop,
    add: noop,
    memory: noop,
    list: noop,
    help: noop,
  });

  await assert.rejects(route('missing'), error => {
    assert.equal(error.code, 'UNKNOWN_COMMAND');
    assert.match(error.message, /missing/);
    return true;
  });
});
