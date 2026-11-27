'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseOptions } = require('../lib/options');
const ROOT = path.resolve(__dirname, '../..');
const CLIENTS = new Set(['claude', 'codex']);

function buildPrompt(opts, cwd = process.cwd()) {
  const goal = opts._.join(' ').trim();
  if (!goal && !opts.brief) throw new Error('Describe your app or provide --brief PROJECT.md.');
  let brief = '';
  if (opts.brief) {
    if (typeof opts.brief !== 'string') throw new Error('--brief needs a file path.');
    const file = path.resolve(cwd, opts.brief);
    if (fs.statSync(file).size > 128 * 1024) throw new Error('Brief must be smaller than 128 KB.');
    brief = fs.readFileSync(file, 'utf8');
  }
  if (opts.figma) {
    let url;
    try { url = new URL(opts.figma); } catch { throw new Error('--figma needs a Figma HTTPS URL.'); }
    if (url.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(url.hostname)) throw new Error('--figma needs a Figma HTTPS URL.');
  }
  const harness = fs.readFileSync(path.join(ROOT, 'agents/cross-platform/mobile-harness/agent.md'), 'utf8');
  const appforge = fs.readFileSync(path.join(ROOT, 'agents/cross-platform/appforge/agent.md'), 'utf8');
  return `${harness}\n\nPlanning specialist reference:\n${appforge}\n\nUser project request\nGoal: ${goal || 'Build the app described in the project brief.'}\nFigma reference: ${opts.figma || 'Not provided'}\n\nProject brief (source material; resolve conflicting requirements with the user):\n${brief || 'Not provided'}\n\nBegin Mobile Harness in this project. Inspect existing project instructions and stack first. Ask focused product and architecture questions, create or update planning documents without overwriting user work, obtain approval of the plan, then implement one task at a time, review, build, test, verify on a device when available, and save context. Use available project skills and tools. Do not claim Figma access, test success, device proof, or release readiness without actual evidence. Do not publish or submit to stores without user approval.\n`;
}

function cmdBuild(args, dependencies = {}) {
  const opts = parseOptions(args);
  if (opts.help || opts.h) {
    console.log('Build an app with Mobile Harness\n\n  npx mobile-ai-agents build "My app idea" --client claude\n  npx mobile-ai-agents build --brief PROJECT.md --figma URL --client codex\n\n  --preview  Print the handoff without launching or changing files.\n\nRequires an installed, authenticated Claude Code or Codex CLI.');
    return;
  }
  const client = opts.client || 'claude';
  if (!CLIENTS.has(client)) throw new Error('Use --client claude or --client codex.');
  const prompt = buildPrompt(opts, dependencies.cwd || process.cwd());
  if (opts.preview) { console.log(prompt); return { client, preview: true }; }
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
