'use strict';
const { spawnSync } = require('child_process');
const { inspectMcpConfiguration } = require('./mcp');

function checkBuildReadiness(client, dependencies = {}) {
  const cwd = dependencies.cwd || process.cwd();
  const probe = (dependencies.spawnSync || spawnSync)(client, ['--version'], {
    cwd, shell: false, encoding: 'utf8', timeout: 5000, maxBuffer: 16384,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const available = !probe.error && !probe.signal && probe.status === 0;
  const configured = (dependencies.inspectMcpConfiguration || inspectMcpConfiguration)({cwd, homedir: dependencies.homedir});
  return {
    client,
    cli: { status: available ? 'available' : 'unavailable',
      action: available ? 'Sign-in and model access will be checked by the interactive client.' : `Install and sign in to ${client === 'claude' ? 'Claude Code' : 'Codex'}, then retry.`,
    },
    mobileMcp: { status: configured.some(item => item.client === client) ? 'configured-unverified' : 'not-configured',
      action: 'Device access requires a connected server and a separate device check.',
    },
    authentication: 'not-checked',
    note: 'No build started, brief sent, or configuration changed. Platform build tools are not checked here.',
  };
}
module.exports = { checkBuildReadiness };
