#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { createCommandRouter } = require('./commands/router');
const { parseOptions } = require('./lib/options');

const REPO = 'salmanashraf/mobile-agency';
const BRANCH = 'main';
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const CLAUDE_AGENTS_DIR   = path.join(os.homedir(), '.claude', 'agents');
const CLAUDE_COMMANDS_DIR = path.join(os.homedir(), '.claude', 'commands');

// ─── Manifest ────────────────────────────────────────────────────────────────

const AGENTS = {
  // Android
  'anr-investigation':       { file: 'agents/android/anr-investigation/agent.md',              platform: 'android' },
  'android-crash-analyzer':  { file: 'agents/android/android-crash-analyzer/agent.md',        platform: 'android' },
  'axiom':                   { file: 'agents/android/axiom/agent.md',                          platform: 'android' },
  'code-reviewer':           { file: 'agents/android/code-reviewer/agent.md',                  platform: 'android' },
  'compose-navigation':      { file: 'agents/android/compose-navigation/agent.md',             platform: 'android' },
  'compose-screen-builder':  { file: 'agents/android/compose-screen-builder/agent.md',         platform: 'android' },
  'compose-ui-reviewer':     { file: 'agents/android/compose-ui-reviewer/agent.md',            platform: 'android' },
  'crash-analyzer-android':  { file: 'agents/android/crash-analyzer/agent.md',                 platform: 'android' },
  'memory-leak-analyzer':    { file: 'agents/android/memory-leak-analyzer/agent.md',           platform: 'android' },
  // iOS
  'crash-analyzer-ios':      { file: 'agents/ios/crash-analyzer/agent.md',                     platform: 'ios'     },
  'swift-reviewer':          { file: 'agents/ios/swift-reviewer/agent.md',                     platform: 'ios'     },
  'swift':                   { file: 'agents/ios/swift/agent.md',                              platform: 'ios'     },
  // Flutter
  'bloc-feature-builder':    { file: 'agents/flutter/bloc-feature-builder/agent.md',           platform: 'flutter' },
  'dart':                    { file: 'agents/flutter/dart/agent.md',                           platform: 'flutter' },
  'widget-generator':        { file: 'agents/flutter/widget-generator/agent.md',               platform: 'flutter' },
  // React Native
  'bridge':                  { file: 'agents/react-native/bridge/agent.md',                    platform: 'rn'      },
  'performance-optimizer':   { file: 'agents/react-native/performance-optimizer/agent.md',     platform: 'rn'      },
  // Gaming
  'forge':                   { file: 'agents/gaming/forge/agent.md',                           platform: 'gaming'  },
  'unreal':                  { file: 'agents/gaming/unreal/agent.md',                          platform: 'gaming'  },
  'shader-generator':        { file: 'agents/unity/shader-generator/agent.md',                 platform: 'gaming'  },
  'blueprint-advisor':       { file: 'agents/unreal/blueprint-advisor/agent.md',               platform: 'gaming'  },
  // Cross-platform
  'accessibility-auditor':   { file: 'agents/cross-platform/accessibility-auditor/agent.md',   platform: 'cross'   },
  'appforge':                { file: 'agents/cross-platform/appforge/agent.md',                platform: 'cross'   },
  'ci-cd-generator':         { file: 'agents/cross-platform/ci-cd-generator/agent.md',         platform: 'cross'   },
  'crasher':                 { file: 'agents/cross-platform/crasher/agent.md',                 platform: 'cross'   },
  'figma':                   { file: 'agents/cross-platform/figma/agent.md',                   platform: 'cross'   },
  'launchpad':               { file: 'agents/cross-platform/launchpad/agent.md',               platform: 'cross'   },
  'mobile-harness':          { file: 'agents/cross-platform/mobile-harness/agent.md',          platform: 'cross'   },
  'mobile-memory':                 { file: 'agents/cross-platform/mobile-memory/agent.md',                 platform: 'cross'   },
  'perf':                    { file: 'agents/cross-platform/perf/agent.md',                    platform: 'cross'   },
  'pipeline':                { file: 'agents/cross-platform/pipeline/agent.md',                platform: 'cross'   },
  'release-notes-generator': { file: 'agents/cross-platform/release-notes-generator/agent.md', platform: 'cross'   },
  'scribe':                  { file: 'agents/cross-platform/scribe/agent.md',                  platform: 'cross'   },
  'security-scanner':        { file: 'agents/cross-platform/security-scanner/agent.md',        platform: 'cross'   },
  'sentinel':                { file: 'agents/cross-platform/sentinel/agent.md',                platform: 'cross'   },
  'store-listing-writer':    { file: 'agents/cross-platform/store-listing-writer/agent.md',    platform: 'cross'   },
};

const SKILLS = {
  // Android
  'anr-investigation':  { file: 'skills/android/anr-investigation.md',         platform: 'android' },
  'android-tdd':        { file: 'skills/android/android-tdd.md',               platform: 'android' },
  'code-review':        { file: 'skills/android/code-review.md',               platform: 'android' },
  'compose-migration':  { file: 'skills/android/compose-migration.md',         platform: 'android' },
  'compose-review':     { file: 'skills/android/compose-review.md',            platform: 'android' },
  'kotlin-modernize':   { file: 'skills/android/kotlin-modernize.md',          platform: 'android' },
  'memory-leak-investigation': { file: 'skills/android/memory-leak-investigation.md', platform: 'android' },
  'proguard-rules':     { file: 'skills/android/proguard-rules.md',            platform: 'android' },
  // iOS
  'data-persistence':   { file: 'skills/ios/data-persistence.md',              platform: 'ios'     },
  'ios-tdd':            { file: 'skills/ios/ios-tdd.md',                       platform: 'ios'     },
  'networking':         { file: 'skills/ios/networking.md',                    platform: 'ios'     },
  'ios-performance':    { file: 'skills/ios/performance.md',                   platform: 'ios'     },
  'swift-concurrency':  { file: 'skills/ios/swift-concurrency.md',             platform: 'ios'     },
  'swift-review':       { file: 'skills/ios/swift-review.md',                  platform: 'ios'     },
  'swiftui-review':     { file: 'skills/ios/swiftui-review.md',                platform: 'ios'     },
  'swiftui-state':      { file: 'skills/ios/swiftui-state.md',                 platform: 'ios'     },
  'unit-testing':       { file: 'skills/ios/unit-testing.md',                  platform: 'ios'     },
  'xcode-warnings':     { file: 'skills/ios/xcode-warnings.md',                platform: 'ios'     },
  // Flutter
  'dart-modernize':     { file: 'skills/flutter/dart-modernize.md',            platform: 'flutter' },
  'flutter-review':     { file: 'skills/flutter/flutter-review.md',            platform: 'flutter' },
  'flutter-tdd':        { file: 'skills/flutter/flutter-tdd.md',               platform: 'flutter' },
  'widget-extract':     { file: 'skills/flutter/widget-extract.md',            platform: 'flutter' },
  'widget-gen':         { file: 'skills/flutter/widget-gen.md',                platform: 'flutter' },
  // React Native
  'bridge-audit':       { file: 'skills/react-native/bridge-audit.md',         platform: 'rn'      },
  'expo-optimize':      { file: 'skills/react-native/expo-optimize.md',        platform: 'rn'      },
  'new-arch-migrate':   { file: 'skills/react-native/new-arch-migrate.md',     platform: 'rn'      },
  'rn-performance':     { file: 'skills/react-native/performance.md',          platform: 'rn'      },
  'rn-review':          { file: 'skills/react-native/rn-review.md',            platform: 'rn'      },
  'rn-tdd':             { file: 'skills/react-native/rn-tdd.md',               platform: 'rn'      },
  // Gaming
  'blueprint-to-cpp':   { file: 'skills/gaming/blueprint-to-cpp.md',           platform: 'gaming'  },
  'game-perf':          { file: 'skills/gaming/game-perf.md',                  platform: 'gaming'  },
  'shader-gen':         { file: 'skills/gaming/shader-gen.md',                 platform: 'gaming'  },
  'unity-tdd':          { file: 'skills/gaming/unity-tdd.md',                  platform: 'gaming'  },
  'shader-review':      { file: 'skills/unity/shader-review.md',               platform: 'gaming'  },
  // Cross-platform
  'accessibility-audit':{ file: 'skills/cross-platform/accessibility-audit.md', platform: 'cross'  },
  'api-versioning':     { file: 'skills/cross-platform/api-versioning.md',     platform: 'cross'   },
  'clean-code-audit':   { file: 'skills/cross-platform/clean-code-audit.md',   platform: 'cross'   },
  'crash-triage':       { file: 'skills/cross-platform/crash-triage.md',       platform: 'cross'   },
  'deeplink-debug':     { file: 'skills/cross-platform/deeplink-debug.md',     platform: 'cross'   },
  'feature-slice':      { file: 'skills/cross-platform/feature-slice.md',      platform: 'cross'   },
  'grill-mobile':       { file: 'skills/cross-platform/grill-mobile.md',       platform: 'cross'   },
  'mobile-app-design':  { file: 'skills/cross-platform/mobile-app-design.md',  platform: 'cross'   },
  'mobile-mcp-qa':      { file: 'skills/cross-platform/mobile-mcp-qa.md',      platform: 'cross'   },
  'mobile-memory-graph':      { file: 'skills/cross-platform/mobile-memory-graph.md',      platform: 'cross'   },
  'mobile-memory-search':     { file: 'skills/cross-platform/mobile-memory-search.md',     platform: 'cross'   },
  'mobile-memory-save':       { file: 'skills/cross-platform/mobile-memory-save.md',       platform: 'cross'   },
  'perf-audit':         { file: 'skills/cross-platform/perf-audit.md',         platform: 'cross'   },
  'prd-verification':   { file: 'skills/cross-platform/prd-verification.md',   platform: 'cross'   },
  'release-prep':       { file: 'skills/cross-platform/release-prep.md',       platform: 'cross'   },
  'security-audit':     { file: 'skills/cross-platform/security-audit.md',     platform: 'cross'   },
  'store-listing':      { file: 'skills/cross-platform/store-listing.md',      platform: 'cross'   },
  // Shared
  'crash-analysis':     { file: 'skills/shared/crash-analysis.md',             platform: 'cross'   },
  'security-scan':      { file: 'skills/shared/security-scan.md',              platform: 'cross'   },
};

const WORKFLOWS = {
  'feature-ship':      { file: 'workflows/feature-ship.md'      },
  'release-cycle':     { file: 'workflows/release-cycle.md'     },
  'game-level':        { file: 'workflows/game-level.md'        },
  'crash-to-fix':      { file: 'workflows/crash-to-fix.md'      },
  'ci-setup':          { file: 'workflows/ci-setup.md'          },
  'new-screen':        { file: 'workflows/new-screen.md'        },
  'new-project-setup': { file: 'workflows/new-project-setup.md' },
  'app-launch':        { file: 'workflows/app-launch.md'        },
  'perf-sprint':       { file: 'workflows/perf-sprint.md'       },
  'mobile-flight-recorder': { file: 'workflows/mobile-flight-recorder.md' },
  'mobile-memory-workflow':  { file: 'workflows/mobile-memory-workflow.md'  },
  'issue-to-agent':    { file: 'workflows/issue-to-agent.md'    },
  'device-proof-report': { file: 'workflows/device-proof-report.md' },
  'appforge-workflow': { file: 'workflows/appforge-workflow.md' },
  'mobile-mcp-qa':     { file: 'workflows/mobile-mcp-qa.md'     },
  'mobile-harness':    { file: 'workflows/mobile-harness.md'    },
};

const PLATFORM_AGENTS = {
  android: [
    'anr-investigation', 'android-crash-analyzer', 'axiom', 'code-reviewer', 'compose-navigation',
    'compose-screen-builder', 'compose-ui-reviewer', 'crash-analyzer-android',
    'memory-leak-analyzer',
    // cross-platform bundled for android
    'appforge', 'crasher', 'sentinel', 'mobile-harness', 'mobile-memory', 'perf',
    'scribe', 'pipeline', 'figma', 'launchpad',
    'accessibility-auditor', 'ci-cd-generator', 'release-notes-generator',
    'security-scanner', 'store-listing-writer',
  ],
  ios: [
    'crash-analyzer-ios', 'swift-reviewer', 'swift',
    // cross-platform bundled for ios
    'appforge', 'crasher', 'sentinel', 'mobile-harness', 'mobile-memory', 'perf',
    'scribe', 'pipeline', 'figma', 'launchpad',
    'accessibility-auditor', 'ci-cd-generator', 'release-notes-generator',
    'security-scanner', 'store-listing-writer',
  ],
  flutter: [
    'bloc-feature-builder', 'dart', 'widget-generator',
    // cross-platform bundled for flutter
    'appforge', 'crasher', 'sentinel', 'mobile-harness', 'mobile-memory', 'perf',
    'scribe', 'pipeline', 'figma', 'launchpad',
    'accessibility-auditor', 'ci-cd-generator', 'release-notes-generator',
    'security-scanner', 'store-listing-writer',
  ],
  rn: [
    'bridge', 'performance-optimizer',
    // cross-platform bundled for rn
    'appforge', 'crasher', 'sentinel', 'mobile-harness', 'mobile-memory', 'perf',
    'scribe', 'pipeline', 'figma', 'launchpad',
    'accessibility-auditor', 'ci-cd-generator', 'release-notes-generator',
    'security-scanner', 'store-listing-writer',
  ],
  gaming: [
    'forge', 'unreal', 'shader-generator', 'blueprint-advisor',
    // cross-platform bundled for gaming
    'appforge', 'mobile-harness', 'mobile-memory', 'perf',
  ],
  cross: [
    'accessibility-auditor', 'appforge', 'ci-cd-generator', 'crasher', 'figma',
    'launchpad', 'mobile-harness', 'mobile-memory',
    'perf', 'pipeline', 'release-notes-generator', 'scribe', 'security-scanner',
    'sentinel', 'store-listing-writer',
  ],
};

const PLATFORM_SKILLS = {
  android: [
    'anr-investigation', 'android-tdd', 'code-review', 'compose-migration', 'compose-review',
    'kotlin-modernize', 'memory-leak-investigation', 'proguard-rules',
    // cross-platform bundled for android
    'accessibility-audit', 'api-versioning', 'clean-code-audit', 'crash-analysis', 'crash-triage',
    'deeplink-debug', 'feature-slice', 'grill-mobile', 'mobile-app-design', 'mobile-mcp-qa',
    'mobile-memory-graph', 'mobile-memory-search', 'mobile-memory-save', 'perf-audit', 'prd-verification',
    'release-prep', 'security-audit', 'security-scan', 'store-listing',
  ],
  ios: [
    'data-persistence', 'ios-tdd', 'networking', 'ios-performance',
    'swift-concurrency', 'swift-review', 'swiftui-review', 'swiftui-state',
    'unit-testing', 'xcode-warnings',
    // cross-platform bundled for ios
    'accessibility-audit', 'api-versioning', 'clean-code-audit', 'crash-analysis', 'crash-triage',
    'deeplink-debug', 'feature-slice', 'grill-mobile', 'mobile-app-design', 'mobile-mcp-qa',
    'mobile-memory-graph', 'mobile-memory-search', 'mobile-memory-save', 'perf-audit', 'prd-verification',
    'release-prep', 'security-audit', 'security-scan', 'store-listing',
  ],
  flutter: [
    'dart-modernize', 'flutter-review', 'flutter-tdd', 'widget-extract', 'widget-gen',
    // cross-platform bundled for flutter
    'accessibility-audit', 'api-versioning', 'clean-code-audit', 'crash-analysis', 'crash-triage',
    'deeplink-debug', 'feature-slice', 'grill-mobile', 'mobile-app-design', 'mobile-mcp-qa',
    'mobile-memory-graph', 'mobile-memory-search', 'mobile-memory-save', 'perf-audit', 'prd-verification',
    'release-prep', 'security-audit', 'security-scan', 'store-listing',
  ],
  rn: [
    'bridge-audit', 'expo-optimize', 'new-arch-migrate', 'rn-performance',
    'rn-review', 'rn-tdd',
    // cross-platform bundled for rn
    'accessibility-audit', 'api-versioning', 'clean-code-audit', 'crash-analysis', 'crash-triage',
    'deeplink-debug', 'feature-slice', 'grill-mobile', 'mobile-app-design', 'mobile-mcp-qa',
    'mobile-memory-graph', 'mobile-memory-search', 'mobile-memory-save', 'perf-audit', 'prd-verification',
    'release-prep', 'security-audit', 'security-scan', 'store-listing',
  ],
  gaming: [
    'blueprint-to-cpp', 'clean-code-audit', 'game-perf', 'mobile-app-design', 'mobile-mcp-qa',
    'mobile-memory-graph', 'mobile-memory-search', 'mobile-memory-save', 'prd-verification', 'security-audit', 'shader-gen',
    'unity-tdd', 'shader-review',
  ],
  cross: [
    'accessibility-audit', 'api-versioning', 'clean-code-audit', 'crash-analysis', 'crash-triage',
    'deeplink-debug', 'feature-slice', 'grill-mobile', 'mobile-app-design', 'mobile-mcp-qa',
    'mobile-memory-graph', 'mobile-memory-search', 'mobile-memory-save', 'perf-audit', 'prd-verification',
    'release-prep', 'security-audit', 'security-scan', 'store-listing',
  ],
};

// Workflows are always installed regardless of platform selection
const ALL_WORKFLOWS = Object.keys(WORKFLOWS);

function workflowCommandName(name) {
  return (AGENTS[name] || SKILLS[name]) ? `${name}-workflow` : name;
}

const PRIMARY_MEMORY_DIR = '.mobile-ai-agents';
const LEGACY_MEMORY_DIR = '.mobile-agency';
const MEMORY_DIR = fs.existsSync(path.join(process.cwd(), LEGACY_MEMORY_DIR)) &&
  !fs.existsSync(path.join(process.cwd(), PRIMARY_MEMORY_DIR))
  ? LEGACY_MEMORY_DIR
  : PRIMARY_MEMORY_DIR;
const MEMORY_SUBDIR = path.join(MEMORY_DIR, 'memory');
const MEMORY_EVENTS_FILE = path.join(MEMORY_SUBDIR, 'events.jsonl');
const MEMORY_INDEX_FILE = path.join(MEMORY_SUBDIR, 'index.md');
const MEMORY_CONFIG_FILE = path.join(MEMORY_SUBDIR, 'config.json');
const MOBILE_MEMORY_FILE = 'MOBILE_MEMORY.md';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg)  { process.stdout.write(`  ${msg}\n`); }
function ok(msg)   { process.stdout.write(`  ✓ ${msg}\n`); }
function err(msg)  { process.stderr.write(`  ✗ ${msg}\n`); }
function bold(s)   { return `\x1b[1m${s}\x1b[0m`; }
function dim(s)    { return `\x1b[2m${s}\x1b[0m`; }
function green(s)  { return `\x1b[32m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }

function nowIso() {
  return new Date().toISOString();
}

function slugify(s) {
  return String(s || 'memory')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'memory';
}

function readStdinIfPiped() {
  if (process.stdin.isTTY) return '';
  try {
    return fs.readFileSync(0, 'utf8').trim();
  } catch {
    return '';
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(Boolean);
}

function appendJsonl(file, value) {
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`);
}

function detectProjectName() {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) return pkg.name;
    }
  } catch {}
  return path.basename(process.cwd());
}

function detectPlatform() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'pubspec.yaml'))) return 'Flutter';
  if (fs.existsSync(path.join(cwd, 'Package.swift'))) return 'iOS / Swift';
  if (fs.existsSync(path.join(cwd, 'android')) && fs.existsSync(path.join(cwd, 'ios'))) return 'React Native / Flutter';
  if (fs.existsSync(path.join(cwd, 'build.gradle')) || fs.existsSync(path.join(cwd, 'settings.gradle')) || fs.existsSync(path.join(cwd, 'settings.gradle.kts'))) return 'Android';
  if (fs.existsSync(path.join(cwd, 'project.pbxproj')) || fs.readdirSync(cwd).some(f => f.endsWith('.xcodeproj'))) return 'iOS';
  if (fs.existsSync(path.join(cwd, 'Assets')) && fs.existsSync(path.join(cwd, 'ProjectSettings'))) return 'Unity';
  if (fs.readdirSync(cwd).some(f => f.endsWith('.uproject'))) return 'Unreal';
  return 'Unknown';
}

function ensureMemory() {
  ensureDir(path.join(process.cwd(), MEMORY_SUBDIR));
  if (!fs.existsSync(path.join(process.cwd(), MEMORY_CONFIG_FILE))) {
    const config = {
      project: detectProjectName(),
      platform: detectPlatform(),
      createdAt: nowIso(),
      version: 1,
      privacy: {
        privateTag: '<private>...</private>',
        note: 'Do not capture secrets, customer data, private logs, tokens, or credentials.'
      }
    };
    fs.writeFileSync(path.join(process.cwd(), MEMORY_CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);
  }
  if (!fs.existsSync(path.join(process.cwd(), MEMORY_EVENTS_FILE))) {
    fs.writeFileSync(path.join(process.cwd(), MEMORY_EVENTS_FILE), '');
  }
  if (!fs.existsSync(path.join(process.cwd(), MEMORY_INDEX_FILE))) {
    fs.writeFileSync(path.join(process.cwd(), MEMORY_INDEX_FILE), '# Mobile AI Agents Memory Index\n\nNo memories captured yet.\n');
  }
}

function loadMemoryConfig() {
  ensureMemory();
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), MEMORY_CONFIG_FILE), 'utf8'));
}

function stripPrivateTags(text) {
  return String(text || '').replace(/<private>[\s\S]*?<\/private>/gi, '[private omitted]');
}

function memoryEventFromOptions(opts) {
  const piped = readStdinIfPiped();
  let text = opts.text || piped || opts._.join(' ');
  if (opts.file) {
    const filePath = path.resolve(process.cwd(), opts.file);
    text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : text;
  }
  text = stripPrivateTags(text).trim();
  if (!text) {
    throw new Error('Memory capture needs --text, --file, positional text, or piped stdin.');
  }
  const title = opts.title || text.split(/\r?\n/)[0].slice(0, 90);
  return {
    id: `${Date.now()}-${slugify(title)}`,
    createdAt: nowIso(),
    type: opts.type || 'note',
    title,
    tags: opts.tags ? String(opts.tags).split(',').map(s => s.trim()).filter(Boolean) : [],
    files: opts.files ? String(opts.files).split(',').map(s => s.trim()).filter(Boolean) : [],
    text,
  };
}

function updateMemoryIndex(events) {
  const recent = events.slice(-50).reverse();
  const lines = [
    '# Mobile AI Agents Memory Index',
    '',
    `Updated: ${nowIso()}`,
    `Events: ${events.length}`,
    '',
    '| Time | Type | Title | Tags |',
    '|---|---|---|---|',
  ];
  for (const e of recent) {
    lines.push(`| ${e.createdAt || ''} | ${e.type || ''} | ${String(e.title || '').replace(/\|/g, '/')} | ${(e.tags || []).join(', ')} |`);
  }
  lines.push('');
  fs.writeFileSync(path.join(process.cwd(), MEMORY_INDEX_FILE), lines.join('\n'));
}

function formatMemoryEvent(e, includeText = false) {
  const tags = e.tags && e.tags.length ? ` [${e.tags.join(', ')}]` : '';
  const files = e.files && e.files.length ? ` files: ${e.files.join(', ')}` : '';
  const head = `${e.createdAt} · ${e.type} · ${e.title}${tags}${files}`;
  if (!includeText) return head;
  return `${head}\n${e.text}`;
}

function buildMobileMemoryFromEvents(config, events) {
  const recent = events.slice(-20);
  const decisions = events.filter(e => e.type === 'decision').slice(-10);
  const findings = events.filter(e => ['finding', 'audit', 'qa', 'bug'].includes(e.type)).slice(-10);
  const progress = events.filter(e => ['progress', 'stage', 'task', 'checkpoint'].includes(e.type)).slice(-10);
  const next = [...events].reverse().find(e => e.type === 'next-action') || [...events].reverse()[0];

  const decisionRows = decisions.length
    ? decisions.map(e => `| ${e.title.replace(/\|/g, '/')} | ${e.text.replace(/\r?\n/g, ' ').replace(/\|/g, '/').slice(0, 120)} | Not captured |`).join('\n')
    : '| None captured | - | - |';

  const findingRows = findings.length
    ? findings.map(e => `| ${e.type.toUpperCase()} | ${e.title.replace(/\|/g, '/')} | ${e.text.replace(/\r?\n/g, ' ').replace(/\|/g, '/').slice(0, 120)} | Review |`).join('\n')
    : '| None | None captured | - | - |';

  const done = progress.length
    ? progress.map(e => `${e.type}: ${e.title}`).join('; ')
    : 'No progress events captured yet.';

  return `---\n# Mobile Memory\n**Project:** ${config.project || detectProjectName()}\n**Platform:** ${config.platform || detectPlatform()}\n**Stack:** Unknown\n**Architecture:** Unknown\n**Saved:** ${nowIso()}\n**Compatible:** Claude Code · Cursor · Windsurf · ChatGPT · Gemini · Copilot\n**Token reduction:** Generated from ${events.length} memory events\n\n---\n\n## ⚡ INSTANT RESUME\n${config.project || detectProjectName()} has ${events.length} captured Mobile AI Agents memory events. Recent work: ${recent.slice(-3).map(e => e.title).join('; ') || 'No events yet'}. Continue from NEXT ACTION below and read exact files before editing.\n\n---\n\n## 🗺️ Knowledge Graph\n\n### Nodes\n| Node | Type | Layer | Health |\n|---|---|---|---|\n| Memory Index | CONTEXT | Project | OK |\n\n### Key Edges\n| From | Edge | To | Note |\n|---|---|---|---|\n| Memory Index | SUMMARIZES | Session Events | Generated by mobile-ai-agents memory checkpoint |\n\n### God Nodes\n| Node | Connections | Platform Risk | Recommendation |\n|---|---|---|---|\n| Unknown | 0 | Unknown | Run /mobile-memory-graph with code files |\n\n### Architecture Violations\n- None captured. Run platform reviewer and /mobile-memory-graph for code-level risks.\n\n---\n\n## 🏥 Health Report\n### 🚨 CRITICAL\n- None captured.\n\n### ⚠️ WARNING\n- Unknown architecture health until code graph is generated.\n\n### 🏦 Tech Debt\n- Convert important memory events into richer graph nodes when the feature stabilizes.\n\n---\n\n## 🎯 Session Context\n\n### Current Task\n${next ? next.text : 'No active task captured.'}\n\n### Decisions Made\n| Decision | Reason | Rejected |\n|---|---|---|\n${decisionRows}\n\n### Progress\n✅ Done: ${done}\n🔄 In Progress: ${next ? next.title : 'Nothing captured'}\n⏭️ NEXT ACTION: ${next ? next.text.replace(/\r?\n/g, ' ').slice(0, 240) : 'Capture a next action with mobile-ai-agents memory capture --type next-action --text \"...\".'}\n🚧 Blocked: Nothing captured\n\n### Open Questions\n- None captured.\n\n---\n\n## 🤖 Agent State\n| Agent | Last Action | Finding | Pending |\n|---|---|---|---|\n${findingRows}\n\n---\n\n## 📄 Code State\nSee ${MEMORY_EVENTS_FILE} for raw event history. Capture mid-edit files with mobile-ai-agents memory capture --type code-state --file <path>.\n\n---\n\n## 🔄 Resume Instructions\n\n**Claude Code:**\nStart new session → paste INSTANT RESUME → paste full MOBILE_MEMORY.md → say "Continue"\n\n**Cursor/Windsurf:**\nSave as MOBILE_MEMORY.md in project root → next prompt: "Read MOBILE_MEMORY.md and continue"\n\n**ChatGPT/Gemini:**\nPaste full file as first message → "Resume from NEXT ACTION"\n\n**Same tool, new session:**\nPaste full file → /mobile-memory restore\n---\n`;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function downloadFile(remotePath, destPaths) {
  const content = await fetchRemote(remotePath);
  for (const destPath of destPaths) {
    ensureDir(path.dirname(destPath));
    fs.writeFileSync(destPath, content);
  }
  return content;
}

async function fetchRemote(remotePath) {
  const localPath = path.join(PACKAGE_ROOT, remotePath);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }
  return fetch(`${RAW}/${remotePath}`);
}

function normalizePlatform(input) {
  const value = String(input || '').trim().toLowerCase();
  if (['android', 'kotlin', 'compose', 'jetpack compose'].includes(value)) return 'Android';
  if (['ios', 'swift', 'swiftui'].includes(value)) return 'iOS';
  if (['flutter', 'dart'].includes(value)) return 'Flutter';
  if (['rn', 'react native', 'react-native'].includes(value)) return 'React Native';
  return input ? String(input).trim() : detectPlatform();
}

function defaultStackForPlatform(platform) {
  const value = String(platform || '').toLowerCase();
  if (value.includes('android')) return 'Kotlin + Jetpack Compose + ViewModel + local persistence';
  if (value.includes('ios')) return 'Swift + SwiftUI + SwiftData or local persistence';
  if (value.includes('flutter')) return 'Dart + Flutter + state management + local persistence';
  if (value.includes('react')) return 'React Native + TypeScript + local persistence';
  return 'Platform-native mobile stack';
}

function safeDocValue(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function askQuestion(rl, label, fallback) {
  const suffix = fallback ? ` (${fallback})` : '';
  return new Promise((resolve) => {
    rl.question(`${label}${suffix}: `, (answer) => {
      resolve(safeDocValue(answer, fallback));
    });
  });
}

async function collectStartProfile(args) {
  const opts = parseOptions(args);
  const interactive = process.stdin.isTTY && process.stdout.isTTY && !opts.yes && !opts['non-interactive'];

  const defaults = {
    idea: safeDocValue(opts.idea || opts._.join(' '), 'Untitled mobile app'),
    platform: normalizePlatform(opts.platform || detectPlatform()),
    team: safeDocValue(opts.team, 'Solo developer'),
    designs: safeDocValue(opts.designs, 'Create wireframes from scratch'),
    monetization: safeDocValue(opts.monetization, 'Decide during PRD review'),
    stack: safeDocValue(opts.stack, ''),
  };
  defaults.stack = safeDocValue(defaults.stack, defaultStackForPlatform(defaults.platform));

  if (!interactive) {
    return {
      ...defaults,
      force: Boolean(opts.force),
      createdAt: nowIso(),
      projectName: detectProjectName(),
    };
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('');
  console.log(bold('Mobile AI Agents Start'));
  console.log(dim('Answer a few questions. Press Enter to accept the default.'));
  console.log('');

  try {
    const idea = await askQuestion(rl, '1. What app idea do you have?', defaults.idea);
    const platform = normalizePlatform(await askQuestion(rl, '2. Which platform are you building for?', defaults.platform));
    const team = await askQuestion(rl, '3. Are you building solo or with a team?', defaults.team);
    const monetization = await askQuestion(rl, '4. AI features, ads, subscription, or one-time purchase?', defaults.monetization);
    const designs = await askQuestion(rl, '5. Do you already have designs?', defaults.designs);
    const stack = await askQuestion(rl, '6. Which tech stack do you want to use?', defaultStackForPlatform(platform));
    return {
      idea,
      platform,
      team,
      designs,
      monetization,
      stack,
      force: Boolean(opts.force),
      createdAt: nowIso(),
      projectName: detectProjectName(),
    };
  } finally {
    rl.close();
  }
}

function renderStarterDocs(profile) {
  const productName = profile.projectName || 'Mobile App';
  const appIdea = profile.idea;
  const platform = profile.platform;
  const stack = profile.stack;

  return {
    'PRD.md': `# PRD: ${productName}

## Product Overview
${appIdea}

## Target Audience
- Primary users: To be refined during idea discovery.
- Buyer or decision maker: To be confirmed.
- First launch market: To be confirmed.

## Problem Statement
Users need a simple, reliable mobile experience for the problem described in the app idea. The MVP should prove the core value before adding advanced features.

## Unique Value Proposition
Deliver the smallest useful version on ${platform}, with clear flows, reliable local behavior, and enough instrumentation to learn from real usage.

## Platform And Stack
- Platform: ${platform}
- Stack: ${stack}
- Team: ${profile.team}
- Designs: ${profile.designs}
- Monetization: ${profile.monetization}

## MVP Scope
- One primary user flow that demonstrates the app value.
- Home or dashboard screen.
- Create or edit flow for the core object.
- Detail or confirmation screen where useful.
- Empty, loading, error, and success states.
- Local persistence if the app needs state after restart.

## Non-Goals
- Complex social features.
- Payments before the MVP value is validated.
- Advanced AI automation before the base workflow is usable.
- Large admin dashboards unless required for launch.

## Core Features
| Feature | Goal | MVP Acceptance |
|---|---|---|
| App shell | Provide navigation and baseline theme | App opens to the main flow without dead ends |
| Core item flow | Let users create or complete the main action | User can finish the primary job in under 60 seconds |
| Persistence | Keep important user state | App restart does not lose MVP data |
| Feedback states | Make failures understandable | Empty, loading, and error states are visible and actionable |
| Basic analytics plan | Know whether the MVP works | Events are documented before release |

## User Flow
1. User opens the app.
2. User understands the main action from the first screen.
3. User creates, tracks, or completes the core item.
4. App saves state.
5. User can return later and continue.

## Functional Requirements
- The app must support the MVP flow on ${platform}.
- The app must keep UI state predictable across navigation.
- The app must avoid placeholder-only screens in the finished MVP.
- The app must include validation for required user input.

## Non-Functional Requirements
- Fast cold start for a small MVP.
- Accessible labels for tappable controls.
- Responsive layout for common phone sizes.
- No secrets committed to source control.
- Clear release build configuration.

## Analytics Events
| Event | When It Fires | Properties |
|---|---|---|
| app_opened | App becomes usable | platform, version |
| primary_action_started | User starts the main MVP flow | source_screen |
| primary_action_completed | User completes the main MVP flow | duration_bucket |
| error_seen | User sees a blocking error | screen, error_type |

## Risks
- Scope grows before the MVP proves value.
- Design decisions are too generic for the target audience.
- Persistence or API choices are made before constraints are clear.
- Release work is delayed until the end.

## Open Questions
- Who is the exact first user?
- What is the one action they must complete?
- Does the MVP need login?
- Does the MVP need offline support?
- What must be true before publishing a test build?

## Next Step
Review this PRD, answer the open questions, then run /mobile-harness and ask it to build only the first approved task.
`,

    'DESIGN.md': `# Design Plan: ${productName}

## Design Direction
Design should be chosen before implementation. Pick one direction and keep the MVP consistent:

| Direction | Best For | Notes |
|---|---|---|
| Clean utility | Productivity, finance, habit, tracker, internal tools | Dense, calm, easy to scan |
| Consumer friendly | Wellness, education, lifestyle | Warmer copy, clearer onboarding |
| Premium minimal | Paid tools, pro users | Strong typography, restrained color, polished empty states |
| Game-like | Games, learning loops, motivation | More motion, stronger feedback, richer assets |

Selected direction: To be confirmed.

## Screen List
| Screen | Purpose | Required States |
|---|---|---|
| Home | Show the primary object or action | Empty, populated, loading, error |
| Create/Edit | Capture required input | Default, validation error, saving |
| Detail/Result | Show saved item or completion | Success, missing data |
| Settings/About | Basic app controls if needed | Default |

## Wireframe Notes
- Put the primary action in the first viewport.
- Avoid marketing copy inside the app experience.
- Keep the MVP flow reachable in one or two taps.
- Use platform-native navigation patterns unless the product has a strong reason not to.

## Design System
- Color: choose one primary action color, one surface color, one danger color, and neutral text colors.
- Typography: use system fonts unless brand requirements exist.
- Spacing: use an 8-point spacing rhythm.
- Components: buttons, text fields, list rows/cards, dialogs, snackbars/toasts, empty state, loading state, error state.

## Accessibility
- Every tappable control needs a clear label.
- Text should pass contrast checks against its background.
- Important actions should not rely on color alone.
- Screens must remain usable with larger text settings.

## Screenshot Plan
Capture these once the MVP exists:

| Screenshot | What To Prove |
|---|---|
| Home populated | The app value is visible |
| Create/Edit flow | The main action works |
| Empty state | New users are guided |
| Error or validation state | Failure is understandable |
`,

    'TASKS.md': `# Tasks: ${productName}

## Implementation Rules
- Do not implement before PRD and design direction are reviewed.
- Build one task at a time.
- Compare each task against PRD.md and DESIGN.md before marking complete.
- Run available tests after each implementation task.
- Save important decisions with Mobile Memory.

## MVP Tasks
| ID | Title | Goal | Dependencies | Acceptance Criteria | QA Checklist | Complexity |
|---|---|---|---|---|---|---|
| T1 | Confirm MVP scope | Lock the first shippable flow | PRD.md | Open questions answered and one primary flow selected | PRD reviewed | S |
| T2 | Create design direction | Choose visual style and screen states | DESIGN.md | Direction selected and screen list finalized | Layout can be compared later | S |
| T3 | Build app shell | Create baseline navigation/theme | T1, T2 | App opens to Home with no placeholder dead ends | Launch app, rotate if supported | M |
| T4 | Build core flow | Implement the main user action | T3 | User can complete primary action | Manual flow test, restart test | M |
| T5 | Add persistence | Keep MVP data after restart | T4 | Data survives app restart | Create data, kill app, reopen | M |
| T6 | Add states and validation | Handle empty/loading/error/input errors | T4 | States match DESIGN.md | Trigger each state | M |
| T7 | Audit and verify | Run clean code, security, performance, UI, and PRD checks | T3-T6 | Findings are fixed or documented | Tests and screenshots captured | M |

## Current Task
T1 - Confirm MVP scope.
`,

    'ROADMAP.md': `# Roadmap: ${productName}

## Phase 0 - Product Clarity
- Review PRD.md.
- Answer open questions.
- Select design direction in DESIGN.md.
- Confirm the first MVP flow.

## Phase 1 - MVP Build
- App shell.
- Core flow.
- Persistence.
- Empty/loading/error states.
- Basic accessibility.

## Phase 2 - Verification Loop
- PRD verification.
- Clean-code audit.
- Security audit.
- Performance audit.
- UI match review.
- Device or simulator QA.

## Phase 3 - Release Prep
- Store listing draft.
- Screenshot plan.
- Privacy/data safety checklist.
- Release notes.
- Internal test build.

## Later
- Monetization experiments: ${profile.monetization}
- AI/API features only after MVP workflow is stable.
- Growth and ASO iteration.
`,

    [MOBILE_MEMORY_FILE]: `# Mobile Memory

## Instant Resume
Project: ${productName}
Idea: ${appIdea}
Platform: ${platform}
Stack: ${stack}
Team: ${profile.team}
Created: ${profile.createdAt}

## Current State
Starter planning docs were generated by:

\`\`\`bash
npx mobile-ai-agents start
\`\`\`

Generated files:
- PRD.md
- DESIGN.md
- TASKS.md
- ROADMAP.md
- MOBILE_MEMORY.md

## Decisions
| Decision | Reason |
|---|---|
| Use ${platform} | User selected or project detection inferred this platform |
| Start with docs before code | Mobile Harness should verify work against PRD and design |

## Next Action
Review PRD.md and DESIGN.md, answer open questions, then run /mobile-harness to implement T1/T2 before code work starts.

## Resume Prompt
Read MOBILE_MEMORY.md, PRD.md, DESIGN.md, TASKS.md, and ROADMAP.md. Continue from the Next Action and do not implement code until PRD and design direction are approved.
`,
  };
}

function writeStarterDocs(files, force) {
  const results = [];
  for (const [filename, content] of Object.entries(files)) {
    const dest = path.join(process.cwd(), filename);
    if (fs.existsSync(dest) && !force) {
      results.push({ filename, status: 'skipped' });
      continue;
    }
    fs.writeFileSync(dest, content);
    results.push({ filename, status: 'created' });
  }
  return results;
}

// Collect all agent/skill/workflow names and their remote paths for a platform set
function collectItems(platforms) {
  const agentNames = new Set();
  const skillNames = new Set();
  for (const p of platforms) {
    (PLATFORM_AGENTS[p] || []).forEach(a => agentNames.add(a));
    (PLATFORM_SKILLS[p] || []).forEach(s => skillNames.add(s));
  }
  return { agentNames: [...agentNames], skillNames: [...skillNames] };
}

// ─── Install targets ─────────────────────────────────────────────────────────

async function installForClaude(platforms) {
  log('Installing for Claude Code...');
  ensureDir(CLAUDE_AGENTS_DIR);
  ensureDir(CLAUDE_COMMANDS_DIR);

  const { agentNames, skillNames } = collectItems(platforms);

  // Agents → ~/.claude/agents/<name>.md AND ~/.claude/commands/<name>.md
  process.stdout.write(`\n   Agents (${agentNames.length})\n`);
  await Promise.all(agentNames.map(async (name) => {
    const meta = AGENTS[name];
    if (!meta) return;
    const agentDest   = path.join(CLAUDE_AGENTS_DIR,   `${name}.md`);
    const commandDest = path.join(CLAUDE_COMMANDS_DIR, `${name}.md`);
    await downloadFile(meta.file, [agentDest, commandDest]);
    ok(name);
  }));

  // Skills → ~/.claude/commands/<slug>.md
  process.stdout.write(`\n   Skills (${skillNames.length})\n`);
  await Promise.all(skillNames.map(async (name) => {
    const meta = SKILLS[name];
    if (!meta) return;
    const dest = path.join(CLAUDE_COMMANDS_DIR, `${name}.md`);
    await downloadFile(meta.file, [dest]);
    ok(name);
  }));

  // Workflows → ~/.claude/commands/<name>.md (always)
  process.stdout.write(`\n   Workflows (${ALL_WORKFLOWS.length})\n`);
  await Promise.all(ALL_WORKFLOWS.map(async (name) => {
    const meta = WORKFLOWS[name];
    if (!meta) return;
    const commandName = workflowCommandName(name);
    const dest = path.join(CLAUDE_COMMANDS_DIR, `${commandName}.md`);
    await downloadFile(meta.file, [dest]);
    ok(commandName === name ? name : `${name} → ${commandName}`);
  }));

  console.log('');
  log(`Agents   → ${dim(CLAUDE_AGENTS_DIR)}`);
  log(`Commands → ${dim(CLAUDE_COMMANDS_DIR)}`);
  log(`           (agents + skills + workflows as slash commands)`);
}

async function installForCursor(platforms) {
  log('Installing for Cursor (.cursor/rules/)...');
  const rulesDir = path.join(process.cwd(), '.cursor', 'rules');
  ensureDir(rulesDir);

  const { agentNames, skillNames } = collectItems(platforms);
  const total = agentNames.length + skillNames.length + ALL_WORKFLOWS.length;
  process.stdout.write(`\n   Rules (${total})\n`);

  // Agents
  await Promise.all(agentNames.map(async (name) => {
    const meta = AGENTS[name];
    if (!meta) return;
    const dest = path.join(rulesDir, `${name}.mdc`);
    await downloadFile(meta.file, [dest]);
    ok(name);
  }));

  // Skills
  await Promise.all(skillNames.map(async (name) => {
    const meta = SKILLS[name];
    if (!meta) return;
    const dest = path.join(rulesDir, `${name}.mdc`);
    await downloadFile(meta.file, [dest]);
    ok(name);
  }));

  // Workflows
  await Promise.all(ALL_WORKFLOWS.map(async (name) => {
    const meta = WORKFLOWS[name];
    if (!meta) return;
    const commandName = workflowCommandName(name);
    const dest = path.join(rulesDir, `${commandName}.mdc`);
    await downloadFile(meta.file, [dest]);
    ok(commandName === name ? name : `${name} → ${commandName}`);
  }));

  console.log('');
  log(`Rules → ${dim(rulesDir)}`);
}

async function installForWindsurf(platforms) {
  log('Installing for Windsurf (.windsurfrules)...');

  const { agentNames, skillNames } = collectItems(platforms);
  const total = agentNames.length + skillNames.length + ALL_WORKFLOWS.length;
  process.stdout.write(`\n   Fetching ${total} files...\n`);

  const parts = [];

  const agentContents = await Promise.all(
    agentNames.map(name => {
      const meta = AGENTS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  agentContents.forEach((c, i) => { if (c) { parts.push(`# Agent: ${agentNames[i]}\n\n${c}`); ok(agentNames[i]); } });

  const skillContents = await Promise.all(
    skillNames.map(name => {
      const meta = SKILLS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  skillContents.forEach((c, i) => { if (c) { parts.push(`# Skill: ${skillNames[i]}\n\n${c}`); ok(skillNames[i]); } });

  const workflowContents = await Promise.all(
    ALL_WORKFLOWS.map(name => {
      const meta = WORKFLOWS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  workflowContents.forEach((c, i) => { if (c) { parts.push(`# Workflow: ${ALL_WORKFLOWS[i]}\n\n${c}`); ok(ALL_WORKFLOWS[i]); } });

  const dest = path.join(process.cwd(), '.windsurfrules');
  fs.writeFileSync(dest, parts.join('\n\n---\n\n'));

  console.log('');
  log(`.windsurfrules → ${dim(dest)}`);
}

async function installForCopilot(platforms) {
  log('Installing for GitHub Copilot (.github/copilot-instructions.md)...');
  const githubDir = path.join(process.cwd(), '.github');
  ensureDir(githubDir);

  const { agentNames, skillNames } = collectItems(platforms);
  const total = agentNames.length + skillNames.length;
  process.stdout.write(`\n   Fetching ${total} files...\n`);

  const parts = [
    '# Mobile AI Agents — AI Dev Team Instructions',
    '',
    `> Auto-generated by mobile-ai-agents CLI from github.com/${REPO}`,
    '',
  ];

  parts.push('## Agents\n');
  const agentContents = await Promise.all(
    agentNames.map(name => {
      const meta = AGENTS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  agentContents.forEach((c, i) => {
    if (c) { parts.push(`### ${agentNames[i]}\n\n${c}`); ok(agentNames[i]); }
  });

  parts.push('\n## Skills\n');
  const skillContents = await Promise.all(
    skillNames.map(name => {
      const meta = SKILLS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  skillContents.forEach((c, i) => {
    if (c) { parts.push(`### ${skillNames[i]}\n\n${c}`); ok(skillNames[i]); }
  });

  const dest = path.join(githubDir, 'copilot-instructions.md');
  fs.writeFileSync(dest, parts.join('\n\n'));

  console.log('');
  log(`Copilot instructions → ${dim(dest)}`);
}

async function installForCodex(platforms) {
  log('Installing for Codex (AGENTS.md)...');

  const { agentNames, skillNames } = collectItems(platforms);
  const total = agentNames.length + skillNames.length + ALL_WORKFLOWS.length;
  process.stdout.write(`\n   Fetching ${total} files...\n`);

  const parts = [
    '# Mobile AI Agents — AGENTS.md',
    '',
    `> Auto-generated by mobile-ai-agents CLI from github.com/${REPO}`,
    '',
  ];

  parts.push('## Agents\n');
  const agentContents = await Promise.all(
    agentNames.map(name => {
      const meta = AGENTS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  agentContents.forEach((c, i) => {
    if (c) { parts.push(`### ${agentNames[i]}\n\n${c}`); ok(agentNames[i]); }
  });

  parts.push('\n## Skills\n');
  const skillContents = await Promise.all(
    skillNames.map(name => {
      const meta = SKILLS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  skillContents.forEach((c, i) => {
    if (c) { parts.push(`### ${skillNames[i]}\n\n${c}`); ok(skillNames[i]); }
  });

  parts.push('\n## Workflows\n');
  const workflowContents = await Promise.all(
    ALL_WORKFLOWS.map(name => {
      const meta = WORKFLOWS[name];
      return meta ? fetchRemote(meta.file) : Promise.resolve(null);
    })
  );
  workflowContents.forEach((c, i) => {
    if (c) { parts.push(`### ${ALL_WORKFLOWS[i]}\n\n${c}`); ok(ALL_WORKFLOWS[i]); }
  });

  const dest = path.join(process.cwd(), 'AGENTS.md');
  fs.writeFileSync(dest, parts.join('\n\n'));

  console.log('');
  log(`AGENTS.md → ${dim(dest)}`);
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdStart(args) {
  const profile = await collectStartProfile(args);
  const files = renderStarterDocs(profile);
  const results = writeStarterDocs(files, profile.force);

  console.log('');
  console.log(bold('Mobile AI Agents Start'));
  console.log(dim(`   Project : ${profile.projectName}`));
  console.log(dim(`   Platform: ${profile.platform}`));
  console.log('');

  for (const result of results) {
    if (result.status === 'created') {
      ok(`${result.filename} created`);
    } else {
      log(`${yellow('skipped')} ${result.filename} already exists (use --force to overwrite)`);
    }
  }

  console.log('');
  console.log(bold('Next'));
  console.log('  1. Review PRD.md and answer the open questions.');
  console.log('  2. Choose one design direction in DESIGN.md.');
  console.log('  3. Run /mobile-harness and ask it to continue from TASKS.md.');
  console.log('  4. Save important decisions with npx mobile-ai-agents memory capture.');
  console.log('');
}

async function cmdInstall(args) {
  let platform = 'all';
  let tool = 'claude';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform' || args[i] === '-p') platform = args[++i];
    if (args[i] === '--tool'     || args[i] === '-t') tool     = args[++i];
  }

  const platforms = platform === 'all'
    ? ['android', 'ios', 'flutter', 'rn', 'gaming', 'cross']
    : [platform];

  console.log('');
  console.log(bold('Mobile AI Agents'));
  console.log(dim(`   github.com/${REPO}`));
  console.log('');
  console.log(`   Platform : ${bold(platform)}`);
  console.log(`   Tool     : ${bold(tool)}`);
  console.log('');

  if (tool === 'claude'   || tool === 'all') await installForClaude(platforms);
  if (tool === 'cursor'   || tool === 'all') await installForCursor(platforms);
  if (tool === 'windsurf' || tool === 'all') await installForWindsurf(platforms);
  if (tool === 'copilot'  || tool === 'all') await installForCopilot(platforms);
  if (tool === 'codex'    || tool === 'all') await installForCodex(platforms);

  console.log('');
  console.log(green(bold('  Done. Happy shipping.')));
  console.log('');
}

async function cmdAdd(args) {
  const type = args[0]; // 'agent' | 'skill' | 'workflow'
  const name = args[1];

  if (!type || !name) {
    console.error('\nUsage: npx mobile-ai-agents add agent <name>');
    console.error('       npx mobile-ai-agents add skill <name>');
    console.error('       npx mobile-ai-agents add workflow <name>\n');
    process.exit(1);
  }

  console.log('');

  if (type === 'agent') {
    const meta = AGENTS[name];
    if (!meta) {
      err(`Unknown agent: ${name}`);
      console.log(`\n  Available agents: ${Object.keys(AGENTS).join(', ')}\n`);
      process.exit(1);
    }
    ensureDir(CLAUDE_AGENTS_DIR);
    ensureDir(CLAUDE_COMMANDS_DIR);
    const agentDest   = path.join(CLAUDE_AGENTS_DIR,   `${name}.md`);
    const commandDest = path.join(CLAUDE_COMMANDS_DIR, `${name}.md`);
    log(`Fetching ${bold(name)} agent...`);
    await downloadFile(meta.file, [agentDest, commandDest]);
    ok(`${name} → ${dim(agentDest)}`);
    ok(`${name} → ${dim(commandDest)}`);
  } else if (type === 'skill') {
    const meta = SKILLS[name];
    if (!meta) {
      err(`Unknown skill: ${name}`);
      console.log(`\n  Available skills: ${Object.keys(SKILLS).join(', ')}\n`);
      process.exit(1);
    }
    ensureDir(CLAUDE_COMMANDS_DIR);
    const dest = path.join(CLAUDE_COMMANDS_DIR, `${name}.md`);
    log(`Fetching ${bold(name)} skill...`);
    await downloadFile(meta.file, [dest]);
    ok(`${name} → ${dim(dest)}`);
  } else if (type === 'workflow') {
    const meta = WORKFLOWS[name];
    if (!meta) {
      err(`Unknown workflow: ${name}`);
      console.log(`\n  Available workflows: ${Object.keys(WORKFLOWS).join(', ')}\n`);
      process.exit(1);
    }
    ensureDir(CLAUDE_COMMANDS_DIR);
    const commandName = workflowCommandName(name);
    const dest = path.join(CLAUDE_COMMANDS_DIR, `${commandName}.md`);
    log(`Fetching ${bold(name)} workflow...`);
    await downloadFile(meta.file, [dest]);
    ok(`${commandName} → ${dim(dest)}`);
  } else {
    err(`Unknown type: ${type}. Use 'agent', 'skill', or 'workflow'.`);
    process.exit(1);
  }

  console.log('');
}

function cmdMemory(args) {
  const sub = args[0];
  const opts = parseOptions(args.slice(1));

  if (!sub || sub === 'help' || sub === '--help' || sub === '-h') {
    console.log('');
    console.log(bold('  npx mobile-ai-agents memory <command> [options]'));
    console.log('');
    console.log('  Commands:');
    console.log(`    ${bold('init')}                 Create .mobile-ai-agents/memory store`);
    console.log(`    ${bold('capture')}              Append a memory event`);
    console.log(`    ${bold('status')}               Show memory store status`);
    console.log(`    ${bold('search')} <query>        Search captured memory`);
    console.log(`    ${bold('timeline')}             Show recent memory events`);
    console.log(`    ${bold('inject')}               Print compact context for a new AI session`);
    console.log(`    ${bold('checkpoint')}           Generate MOBILE_MEMORY.md from memory events`);
    console.log('');
    console.log('  Capture options:');
    console.log('    --type    note | decision | progress | finding | qa | stage | next-action | code-state');
    console.log('    --title   Short title');
    console.log('    --text    Memory text');
    console.log('    --file    Read text from a file');
    console.log('    --tags    Comma-separated tags');
    console.log('    --files   Comma-separated related files');
    console.log('');
    console.log('  Examples:');
    console.log(dim('    npx mobile-ai-agents memory init'));
    console.log(dim('    npx mobile-ai-agents memory capture --type decision --title "Use Room" --text "Persist habits locally with Room."'));
    console.log(dim('    git diff | npx mobile-ai-agents memory capture --type code-state --title "Current diff"'));
    console.log(dim('    npx mobile-ai-agents memory search persistence'));
    console.log(dim('    npx mobile-ai-agents memory checkpoint'));
    console.log('');
    return;
  }

  if (sub === 'init') {
    ensureMemory();
    const gitignorePath = path.join(process.cwd(), MEMORY_DIR, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, [
        '# Mobile AI Agents local memory',
        '# Keep raw event history local by default. Commit MOBILE_MEMORY.md when a handoff is useful.',
        'memory/events.jsonl',
        ''
      ].join('\n'));
    }
    console.log('');
    ok(`${MEMORY_SUBDIR}/`);
    ok(MEMORY_CONFIG_FILE);
    ok(MEMORY_INDEX_FILE);
    if (MEMORY_DIR === LEGACY_MEMORY_DIR) {
      log(`Using existing legacy memory store at ${bold(LEGACY_MEMORY_DIR)}/`);
    }
    log(`Capture with ${bold('npx mobile-ai-agents memory capture --type decision --text "..."')}`);
    console.log('');
    return;
  }

  ensureMemory();
  const config = loadMemoryConfig();
  const eventsPath = path.join(process.cwd(), MEMORY_EVENTS_FILE);
  const events = readJsonl(eventsPath);

  if (sub === 'capture') {
    const event = memoryEventFromOptions(opts);
    appendJsonl(eventsPath, event);
    const nextEvents = events.concat(event);
    updateMemoryIndex(nextEvents);
    console.log('');
    ok(`Captured ${event.type}: ${event.title}`);
    log(`Events: ${nextEvents.length}`);
    console.log('');
    return;
  }

  if (sub === 'status') {
    console.log('');
    console.log(bold('Mobile AI Agents Memory'));
    console.log(`  Project : ${bold(config.project || detectProjectName())}`);
    console.log(`  Platform: ${bold(config.platform || detectPlatform())}`);
    console.log(`  Events  : ${bold(String(events.length))}`);
    console.log(`  Store   : ${dim(path.join(process.cwd(), MEMORY_SUBDIR))}`);
    if (events.length) {
      console.log('');
      console.log(bold('Recent'));
      events.slice(-5).reverse().forEach(e => console.log(`  - ${formatMemoryEvent(e)}`));
    }
    console.log('');
    return;
  }

  if (sub === 'search') {
    const query = opts._.join(' ').toLowerCase();
    if (!query) throw new Error('memory search needs a query.');
    const results = events.filter(e => JSON.stringify(e).toLowerCase().includes(query)).slice(-20).reverse();
    console.log('');
    console.log(bold(`Memory search: ${query}`));
    if (!results.length) {
      log('No matching memory events.');
    } else {
      results.forEach(e => {
        console.log(`\n${bold(e.id)}`);
        console.log(formatMemoryEvent(e, true));
      });
    }
    console.log('');
    return;
  }

  if (sub === 'timeline') {
    const limit = Number(opts.limit || 20);
    console.log('');
    console.log(bold(`Memory timeline (${Math.min(limit, events.length)} of ${events.length})`));
    events.slice(-limit).forEach(e => console.log(`  - ${formatMemoryEvent(e)}`));
    console.log('');
    return;
  }

  if (sub === 'inject') {
    const limit = Number(opts.limit || 8);
    const recent = events.slice(-limit);
    console.log(`# Mobile AI Agents Memory Context\n`);
    console.log(`Project: ${config.project || detectProjectName()}`);
    console.log(`Platform: ${config.platform || detectPlatform()}`);
    console.log(`Events: ${events.length}\n`);
    console.log('## Recent Memory');
    if (!recent.length) {
      console.log('- No memory events captured yet.');
    } else {
      recent.forEach(e => console.log(`- ${formatMemoryEvent(e)} — ${String(e.text || '').replace(/\r?\n/g, ' ').slice(0, 180)}`));
    }
    const next = [...events].reverse().find(e => e.type === 'next-action');
    console.log('\n## Next Action');
    console.log(next ? `- ${next.text}` : '- Not captured yet.');
    console.log('\nUse this as context, then read exact files before editing.');
    return;
  }

  if (sub === 'checkpoint') {
    const out = buildMobileMemoryFromEvents(config, events);
    fs.writeFileSync(path.join(process.cwd(), MOBILE_MEMORY_FILE), out);
    updateMemoryIndex(events);
    console.log('');
    ok(`${MOBILE_MEMORY_FILE} generated from ${events.length} memory events`);
    log(`Review before committing. Raw events stay local in ${MEMORY_EVENTS_FILE}.`);
    console.log('');
    return;
  }

  throw new Error(`Unknown memory command: ${sub}`);
}

function cmdList() {
  const agentCount    = Object.keys(AGENTS).length;
  const skillCount    = Object.keys(SKILLS).length;
  const workflowCount = Object.keys(WORKFLOWS).length;

  console.log('');
  console.log(bold(`Mobile AI Agents — Agents (${agentCount}), Skills (${skillCount}), Workflows (${workflowCount})`));
  console.log(dim(`   github.com/${REPO}`));
  console.log('');

  console.log(bold(`  AGENTS (${agentCount})`));
  const agentsByPlatform = {};
  for (const [name, meta] of Object.entries(AGENTS)) {
    if (!agentsByPlatform[meta.platform]) agentsByPlatform[meta.platform] = [];
    agentsByPlatform[meta.platform].push(name);
  }
  for (const [platform, names] of Object.entries(agentsByPlatform)) {
    console.log(`    ${yellow(platform.padEnd(10))} ${names.join(', ')}`);
  }

  console.log('');
  console.log(bold(`  SKILLS (${skillCount})`));
  const skillsByPlatform = {};
  for (const [name, meta] of Object.entries(SKILLS)) {
    if (!skillsByPlatform[meta.platform]) skillsByPlatform[meta.platform] = [];
    skillsByPlatform[meta.platform].push(name);
  }
  for (const [platform, names] of Object.entries(skillsByPlatform)) {
    console.log(`    ${yellow(platform.padEnd(10))} ${names.join(', ')}`);
  }

  console.log('');
  console.log(bold(`  WORKFLOWS (${workflowCount})`));
  console.log(`    ${yellow('all'.padEnd(10))} ${Object.keys(WORKFLOWS).join(', ')}`);

  console.log('');
  console.log(bold('  INSTALL'));
  console.log(dim('    npx mobile-ai-agents start                           # guided starter docs'));
  console.log(dim('    npx mobile-ai-agents install                         # everything (claude)'));
  console.log(dim('    npx mobile-ai-agents install --platform android      # android only'));
  console.log(dim('    npx mobile-ai-agents install --tool cursor           # cursor only'));
  console.log(dim('    npx mobile-ai-agents install --tool windsurf         # windsurf only'));
  console.log(dim('    npx mobile-ai-agents install --tool copilot          # github copilot'));
  console.log(dim('    npx mobile-ai-agents install --tool codex            # openai codex (AGENTS.md)'));
  console.log(dim('    npx mobile-ai-agents install --tool all              # every tool'));
  console.log(dim('    npx mobile-ai-agents add agent crasher               # one agent'));
  console.log(dim('    npx mobile-ai-agents add skill grill-mobile          # one skill'));
  console.log(dim('    npx mobile-ai-agents add workflow feature-ship       # one workflow'));
  console.log(dim('    npx mobile-ai-agents memory init                     # local Mobile Memory'));
  console.log(dim('    npx mobile-ai-agents doctor --platform android       # check Android setup'));
  console.log(dim('    npx mobile-ai-agents mcp setup --client claude       # configure Mobile MCP'));
  console.log('');
}

function cmdHelp() {
  console.log('');
  console.log(bold('  npx mobile-ai-agents <command> [options]'));
  console.log('');
  console.log('  Commands:');
  console.log(`    ${bold('start')}                           Guided setup that creates PRD/design/tasks/roadmap`);
  console.log(`    ${bold('install')}                         Install agents, skills, and workflows`);
  console.log(`    ${bold('add')} agent|skill|workflow <name>  Install a single item`);
  console.log(`    ${bold('memory')} init|capture|search|...    Local Mobile Memory store`);
  console.log(`    ${bold('doctor')} --platform android          Check SDK, adb, emulator, MCP, and project config`);
  console.log(`    ${bold('mcp')} setup|config                  Configure Mobile MCP and Android device QA`);
  console.log(`    ${bold('list')}                            List all available agents, skills, and workflows`);
  console.log(`    ${bold('help')}                            Show this help`);
  console.log('');
  console.log('  Install options:');
  console.log('    --platform  android | ios | flutter | rn | gaming | cross | all  (default: all)');
  console.log('    --tool      claude | cursor | windsurf | copilot | codex | all   (default: claude)');
  console.log('');
  console.log('  What gets installed per tool:');
  console.log('');
  console.log('    claude    Agents   → ~/.claude/agents/<name>.md');
  console.log('              Agents   → ~/.claude/commands/<name>.md  (slash commands)');
  console.log('              Skills   → ~/.claude/commands/<slug>.md  (slash commands)');
  console.log('              Workflows→ ~/.claude/commands/<name>.md  (slash commands, always)');
  console.log('');
  console.log('    cursor    Each agent/skill/workflow → .cursor/rules/<name>.mdc');
  console.log('');
  console.log('    windsurf  All files concatenated   → .windsurfrules');
  console.log('');
  console.log('    copilot   All agents + skills      → .github/copilot-instructions.md');
  console.log('');
  console.log('    codex     All agents/skills/workflows → AGENTS.md');
  console.log('');
  console.log('  Examples:');
  console.log(dim('    npx mobile-ai-agents start'));
  console.log(dim('    npx mobile-ai-agents start --platform flutter --idea "Habit tracker"'));
  console.log(dim('    npx mobile-ai-agents install'));
  console.log(dim('    npx mobile-ai-agents install --platform android'));
  console.log(dim('    npx mobile-ai-agents install --platform ios --tool cursor'));
  console.log(dim('    npx mobile-ai-agents install --tool all'));
  console.log(dim('    npx mobile-ai-agents add agent crasher'));
  console.log(dim('    npx mobile-ai-agents add skill grill-mobile'));
  console.log(dim('    npx mobile-ai-agents add workflow feature-ship'));
  console.log(dim('    npx mobile-ai-agents memory init'));
  console.log(dim('    npx mobile-ai-agents memory capture --type decision --text "Use Room for offline persistence"'));
  console.log(dim('    npx mobile-ai-agents doctor --platform android'));
  console.log(dim('    npx mobile-ai-agents doctor --platform android --json'));
  console.log(dim('    npx mobile-ai-agents mcp setup --client codex'));
  console.log(dim('    npx mobile-ai-agents mcp config init --app-id com.example.app'));
  console.log(dim('    npx mobile-ai-agents mcp config validate'));
  console.log('');
  console.log(dim(`  github.com/${REPO}`));
  console.log('');
}

// ─── Main ────────────────────────────────────────────────────────────────────

const routeCommand = createCommandRouter({
  start: cmdStart,
  install: cmdInstall,
  add: cmdAdd,
  memory: cmdMemory,
  list: cmdList,
  help: cmdHelp,
});

async function main() {
  const [,, cmd, ...args] = process.argv;

  try {
    await routeCommand(cmd, args);
  } catch (e) {
    console.error(`\n  ${e.code === 'UNKNOWN_COMMAND' ? e.message : `Error: ${e.message}`}\n`);
    if (e.code === 'UNKNOWN_COMMAND') cmdHelp();
    process.exitCode = 1;
  }
}

main();
