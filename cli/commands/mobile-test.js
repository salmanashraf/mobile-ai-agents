'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseOptions } = require('../lib/options');
const { inspectMcpConfiguration, setupMcpClient } = require('./mcp');

const SUPPORTED_CLIENTS = new Set(['claude', 'cursor', 'windsurf', 'codex']);

function detectPlatform(cwd = process.cwd(), fsImpl = fs) {
  if (fsImpl.existsSync(path.join(cwd, 'pubspec.yaml'))) return 'Flutter';
  if (fsImpl.existsSync(path.join(cwd, 'android')) || fsImpl.existsSync(path.join(cwd, 'build.gradle')) || fsImpl.existsSync(path.join(cwd, 'build.gradle.kts'))) return 'Android';
  if (fsImpl.readdirSync(cwd).some(name => name.endsWith('.xcodeproj') || name.endsWith('.xcworkspace'))) return 'iOS';
  if (fsImpl.existsSync(path.join(cwd, 'package.json'))) return 'React Native or mobile JavaScript';
  return 'mobile app';
}

function detectClient(options = {}) {
  const cwd = options.cwd || process.cwd();
  const homedir = options.homedir || os.homedir();
  const fsImpl = options.fsImpl || fs;
  const configured = inspectMcpConfiguration({ cwd, homedir, fsImpl });
  if (configured.length) return configured[0].client;
  if (process.env.CODEX_HOME || fsImpl.existsSync(path.join(homedir, '.codex'))) return 'codex';
  if (fsImpl.existsSync(path.join(cwd, '.cursor'))) return 'cursor';
  if (fsImpl.existsSync(path.join(cwd, '.mcp.json')) || fsImpl.existsSync(path.join(homedir, '.claude'))) return 'claude';
  if (fsImpl.existsSync(path.join(homedir, '.codeium', 'windsurf'))) return 'windsurf';
  return null;
}

function createTestRequest(platform, cwd = process.cwd(), fsImpl = fs) {
  const dir = path.join(cwd, '.mobile-ai-agents');
  const file = path.join(dir, 'MOBILE_TEST.md');
  fsImpl.mkdirSync(dir, { recursive: true });
  const content = `# Test this app\n\nUse the Mobile MCP QA skill to test this ${platform} app on an available device, emulator, or simulator.\n\n1. Build and launch the app.\n2. Test the main user journey and important error states.\n3. Check accessibility and visible UI problems.\n4. Capture screenshots and supporting evidence.\n5. Save a plain-language pass/fail report with the fixes needed next.\n\nDo not claim PASS without device evidence.\n`;
  fsImpl.writeFileSync(file, content);
  return file;
}

async function cmdMobileTest(args, options = {}) {
  const opts = parseOptions(args);
  if (opts.help || opts.h) {
    console.log('');
    console.log('  mobile-test');
    console.log('  Detect the app, prepare Mobile MCP, and create a plain-language QA request.');
    console.log('');
    console.log('  Usage: npx mobile-ai-agents mobile-test [--client codex|claude|cursor|windsurf]');
    console.log('');
    return null;
  }
  const cwd = options.cwd || process.cwd();
  const homedir = options.homedir || os.homedir();
  const fsImpl = options.fsImpl || fs;
  const requested = opts.client === true ? null : opts.client;
  if (requested && !SUPPORTED_CLIENTS.has(String(requested))) {
    throw new Error('Choose claude, cursor, windsurf, or codex for --client.');
  }

  const platform = detectPlatform(cwd, fsImpl);
  const client = requested ? String(requested) : detectClient({ cwd, homedir, fsImpl });
  let setup = null;
  if (client) setup = setupMcpClient(client, { cwd, homedir, fsImpl });
  const requestFile = createTestRequest(platform, cwd, fsImpl);

  const result = { platform, client, setup, requestFile };
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  console.log('');
  console.log('  Mobile test is ready');
  console.log(`  ✓ App detected: ${platform}`);
  if (setup) console.log(`  ✓ Device testing prepared for ${client}`);
  else console.log('  ! AI tool not detected. Run again with --client codex, claude, cursor, or windsurf.');
  console.log(`  ✓ Test request saved: ${requestFile}`);
  console.log('');
  console.log('  Next: restart your AI tool if it was open, then say:');
  console.log('  "Read .mobile-ai-agents/MOBILE_TEST.md and test this app."');
  console.log('');
  return result;
}

module.exports = { cmdMobileTest, createTestRequest, detectClient, detectPlatform };
