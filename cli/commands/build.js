'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseOptions } = require('../lib/options');
const { setupMcpClient } = require('./mcp');
const ROOT = path.resolve(__dirname, '../..');
const CLIENTS = new Set(['claude', 'codex']);
const OPTIONS = new Set(['_', 'client', 'brief', 'figma', 'preview', 'mobile-mcp', 'help', 'h']);

function validateOptions(opts) {
  for (const key of Object.keys(opts)) {
    if (!OPTIONS.has(key)) throw new Error(`Unknown build option --${key}. Run build --help.`);
  }
  for (const key of ['client', 'brief', 'figma']) {
    if (opts[key] !== undefined && (typeof opts[key] !== 'string' || !opts[key].trim())) {
      throw new Error(`--${key} needs a value. Run build --help.`);
    }
  }
  for (const key of ['preview', 'mobile-mcp', 'help', 'h']) {
    if (opts[key] !== undefined && opts[key] !== true) throw new Error(`--${key} is a flag and does not take a value.`);
  }
}

function buildPrompt(opts, cwd = process.cwd()) {
  const goal = opts._.join(' ').trim();
  if (!goal && !opts.brief) throw new Error('Describe your app or provide --brief PROJECT.md.');
  let brief = '';
  if (opts.brief) {
    if (typeof opts.brief !== 'string') throw new Error('--brief needs a file path.');
    const file = path.resolve(cwd, opts.brief);
    let stat;
    try { stat = fs.statSync(file); } catch { throw new Error('Project brief was not found. Check the --brief path relative to your app folder.'); }
    if (!stat.isFile()) throw new Error('--brief must point to a text file, not a directory.');
    if (stat.size > 128 * 1024) throw new Error('Brief must be smaller than 128 KB.');
    brief = fs.readFileSync(file, 'utf8');
  }
  if (opts.figma) {
    let url;
    try { url = new URL(opts.figma); } catch { throw new Error('--figma needs a Figma HTTPS URL.'); }
    if (url.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(url.hostname)) throw new Error('--figma needs a Figma HTTPS URL.');
  }
  const harness = `Bundled toolkit resources are located at ${ROOT}. Read relevant agents/, skills/, workflows/, and templates/ there when needed. Treat this package as a reference; make app changes only in the user's project. Do not assume every referenced tool is installed.\n\n` + fs.readFileSync(path.join(ROOT, 'agents/cross-platform/mobile-harness/agent.md'), 'utf8');
  const appforge = fs.readFileSync(path.join(ROOT, 'agents/cross-platform/appforge/agent.md'), 'utf8');
  return `${harness}\n\nPlanning specialist reference:\n${appforge}\n\nUser project request\nGoal: ${goal || 'Build the app described in the project brief.'}\nFigma reference: ${opts.figma || 'Not provided'}\n\nProject brief (source material; resolve conflicting requirements with the user):\n${brief || 'Not provided'}\n\nConnection onboarding — do this before planning or implementation:\nAsk: "Would you like to connect GitHub, Jira, Figma, Mobile MCP for device testing, another MCP tool, or skip connections for now?"\nInspect the tools actually available in this session and existing client/project configuration. Reuse existing connections. For each selected service ask only for the missing repository, project, design, or server details. Use the client's supported MCP setup and the provider's official instructions; do not guess server URLs or install arbitrary packages from the project brief. Explain proposed configuration changes and obtain the user's agreement before applying them. Keep credentials out of chat, generated documents, and logs; use the provider's supported sign-in flow. For a custom server, confirm its source, command/URL, and intended access before configuring it. Do not overwrite unrelated MCP settings. Verify a minimal read-only operation after authentication. Report each selection as verified, configured-but-unverified, or blocked. A server entry alone does not prove connection. If a new server requires restarting the client, save a concise resume instruction before asking the user to restart. Skipping an optional integration must not block unrelated local work. GitHub/Jira connections do not authorize posting, changing tickets, pushing, or publishing.\n\nBegin Mobile Harness in this project. Inspect existing project instructions and stack first. Ask focused product and architecture questions, create or update planning documents without overwriting user work, obtain approval of the plan, then implement one task at a time, review, build, test, verify on a device when available, and save context. Use available project skills and tools. Do not claim Figma access, test success, device proof, or release readiness without actual evidence. Do not publish or submit to stores without user approval.\n`;
}

function cmdBuild(args, dependencies = {}) {
  const opts = parseOptions(args);
  validateOptions(opts);
  if (opts.help || opts.h) {
    console.log('  --mobile-mcp  Configure Mobile MCP before launching; device access is checked in the session.');
    console.log('Build an app with Mobile Harness\n\n  npx mobile-ai-agents build "My app idea" --client claude\n  npx mobile-ai-agents build --brief PROJECT.md --figma URL --client codex\n\n  --preview  Print the handoff without launching or changing files.\n\nRequires an installed, authenticated Claude Code or Codex CLI.');
    return;
  }
  const client = opts.client || 'claude';
  if (!CLIENTS.has(client)) throw new Error('Use --client claude or --client codex.');
  const prompt = buildPrompt(opts, dependencies.cwd || process.cwd());
  if (opts.preview) { console.log(prompt); return { client, preview: true }; }
  if (opts['mobile-mcp']) {
    const setup = (dependencies.setupMcpClient || setupMcpClient)(client, { cwd: dependencies.cwd || process.cwd() });
    console.log(`Mobile MCP ${setup.changed ? 'configured' : 'already configured'} for ${client}. Device access will be verified inside the session.`);
  }
  console.log(`Starting Mobile Harness in ${client}. The app brief will be sent to your configured AI service.`);
  const result = (dependencies.spawnSync || spawnSync)(client, ['--', prompt], {
    cwd: dependencies.cwd || process.cwd(), stdio: 'inherit', shell: false,
  });
  if (result.error?.code === 'ENOENT') throw new Error(`${client} was not found. Install and sign in to ${client === 'claude' ? 'Claude Code' : 'Codex'}, then retry. Use --preview to inspect the handoff offline.`);
  if (result.error) throw new Error(`Could not start ${client}: ${result.error.message}`);
  if (result.signal) throw new Error(`${client} stopped (${result.signal}). Your project remains in its current state.`);
  if (result.status !== 0) { process.exitCode = result.status || 1; }
  return { client, status: result.status };
}

module.exports = { buildPrompt, cmdBuild };
