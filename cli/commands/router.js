'use strict';

const { cmdDoctor } = require('./doctor');
const { cmdMcp } = require('./mcp');

function createCommandRouter(legacyHandlers) {
  const routes = new Map([
    ['start', legacyHandlers.start],
    ['install', legacyHandlers.install],
    ['add', legacyHandlers.add],
    ['memory', legacyHandlers.memory],
    ['list', legacyHandlers.list],
    ['doctor', cmdDoctor],
    ['mcp', cmdMcp],
    ['help', legacyHandlers.help],
    ['--help', legacyHandlers.help],
    ['-h', legacyHandlers.help],
  ]);

  return async function routeCommand(command, args = []) {
    if (command === undefined) return legacyHandlers.help(args);
    const handler = routes.get(command);
    if (!handler) {
      const error = new Error(`Unknown command: ${command}`);
      error.code = 'UNKNOWN_COMMAND';
      throw error;
    }
    return handler(args);
  };
}

module.exports = { createCommandRouter };
