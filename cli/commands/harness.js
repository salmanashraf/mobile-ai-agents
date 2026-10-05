'use strict';

const fs = require('fs');
const path = require('path');
const { parseOptions } = require('../lib/options');

const DEFAULT_POLICY_PATH = 'HARNESS_POLICY.json';
const POLICY_TEMPLATE_PATH = path.resolve(__dirname, '..', '..', 'templates', 'mobile-harness-policy.json');
const SCHEMA_SOURCES = [
  'mobile-harness-policy.schema.json',
  'mobile-harness-result.schema.json',
  'mobile-harness-evidence.schema.json',
].map(name => ({ name, source: path.resolve(__dirname, '..', '..', 'templates', name) }));
const PROFILES = new Set(['startup', 'team', 'enterprise', 'regulated']);
const RISKS = ['low', 'medium', 'high', 'regulated'];
const GATES = new Set([
  'scope',
  'owner_approval',
  'platform_review',
  'static_analysis',
  'tests',
  'integration_tests',
  'prd_verification',
  'ui_verification',
  'device_qa',
  'accessibility',
  'performance',
  'security',
  'privacy',
  'supply_chain',
  'rollback',
  'release_approval',
]);
const TOP_LEVEL_KEYS = new Set([
  '$schema',
  'version',
  'profile',
  'defaultRisk',
  'riskRules',
  'gates',
  'exceptions',
  'evidence',
  'ownership',
  'commands',
  'protectedPaths',
]);

function policyFile(options = {}) {
  return path.resolve(options.cwd || process.cwd(), options.policyPath || DEFAULT_POLICY_PATH);
}

function readPolicy(file, fsImpl = fs) {
  try {
    const policy = JSON.parse(fsImpl.readFileSync(file, 'utf8'));
    if (!policy || Array.isArray(policy) || typeof policy !== 'object') {
      throw new Error('top-level value must be an object');
    }
    return policy;
  } catch (error) {
    throw new Error(`Invalid policy JSON in ${file}: ${error.message}`);
  }
}

function rejectUnknownFields(value, allowed, prefix, errors) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`Unknown field: ${prefix}${key}.`);
  }
}

function validateHarnessPolicy(policy) {
  const errors = [];
  if (!policy || Array.isArray(policy) || typeof policy !== 'object') return ['Policy must be a JSON object.'];
  for (const key of Object.keys(policy)) {
    if (!TOP_LEVEL_KEYS.has(key)) errors.push(`Unknown top-level field: ${key}.`);
  }
  if (policy.$schema !== undefined && typeof policy.$schema !== 'string') errors.push('$schema must be a string.');
  if (policy.version !== 1) errors.push('version must be 1.');
  if (!PROFILES.has(policy.profile)) errors.push('profile must be startup, team, enterprise, or regulated.');
  if (!RISKS.includes(policy.defaultRisk)) errors.push('defaultRisk must be low, medium, high, or regulated.');
  if (!Array.isArray(policy.riskRules)) {
    errors.push('riskRules must be an array.');
  } else {
    policy.riskRules.forEach((rule, index) => {
      if (!rule || Array.isArray(rule) || typeof rule !== 'object') {
        errors.push(`riskRules[${index}] must be an object.`);
        return;
      }
      rejectUnknownFields(rule, new Set(['name', 'paths', 'risk']), `riskRules[${index}].`, errors);
      if (typeof rule.name !== 'string' || !rule.name.trim()) errors.push(`riskRules[${index}].name must be non-empty.`);
      if (!Array.isArray(rule.paths) || !rule.paths.length || rule.paths.some(item => typeof item !== 'string' || !item.trim())) {
        errors.push(`riskRules[${index}].paths must contain non-empty paths.`);
      }
      if (!RISKS.includes(rule.risk)) errors.push(`riskRules[${index}].risk is invalid.`);
    });
  }
  rejectUnknownFields(policy.gates, new Set(RISKS), 'gates.', errors);
  for (const risk of RISKS) {
    const gates = policy.gates?.[risk];
    if (!Array.isArray(gates)) {
      errors.push(`gates.${risk} must be an array.`);
    } else {
      gates.forEach(gate => {
        if (!GATES.has(gate)) errors.push(`gates.${risk} contains unsupported gate: ${gate}.`);
      });
      if (new Set(gates).size !== gates.length) errors.push(`gates.${risk} must not contain duplicates.`);
    }
  }
  if (policy.evidence?.hashAlgorithm !== 'sha256') errors.push('evidence.hashAlgorithm must be sha256.');
  if (!Number.isInteger(policy.evidence?.retentionDays) || policy.evidence.retentionDays <= 0) {
    errors.push('evidence.retentionDays must be a positive integer.');
  }
  if (typeof policy.evidence?.root !== 'string' || !policy.evidence.root.trim()) errors.push('evidence.root must be non-empty.');
  if (!Array.isArray(policy.evidence?.redactPatterns) || policy.evidence.redactPatterns.some(item => typeof item !== 'string')) {
    errors.push('evidence.redactPatterns must be an array of strings.');
  }
  rejectUnknownFields(policy.evidence, new Set(['root', 'hashAlgorithm', 'retentionDays', 'redactPatterns']), 'evidence.', errors);
  if (!Array.isArray(policy.protectedPaths) || policy.protectedPaths.some(item => typeof item !== 'string' || !item.trim())) {
    errors.push('protectedPaths must be an array of non-empty paths.');
  }
  if (!policy.exceptions || Array.isArray(policy.exceptions) || typeof policy.exceptions !== 'object') {
    errors.push('exceptions must be an object.');
  } else {
    rejectUnknownFields(policy.exceptions, new Set([
      'allowed',
      'requireOwner',
      'requireReason',
      'requireTicket',
      'maxAgeDays',
      'forbiddenGates',
    ]), 'exceptions.', errors);
    for (const field of ['allowed', 'requireOwner', 'requireReason', 'requireTicket']) {
      if (typeof policy.exceptions[field] !== 'boolean') errors.push(`exceptions.${field} must be boolean.`);
    }
    if (!Number.isInteger(policy.exceptions.maxAgeDays) || policy.exceptions.maxAgeDays <= 0) {
      errors.push('exceptions.maxAgeDays must be a positive integer.');
    }
    if (!Array.isArray(policy.exceptions.forbiddenGates)) {
      errors.push('exceptions.forbiddenGates must be an array.');
    } else {
      policy.exceptions.forbiddenGates.forEach(gate => {
        if (!GATES.has(gate)) errors.push(`exceptions.forbiddenGates contains unsupported gate: ${gate}.`);
      });
    }
  }
  rejectUnknownFields(policy.ownership, new Set(['product', 'engineering', 'security', 'release']), 'ownership.', errors);
  for (const owner of ['product', 'engineering', 'security', 'release']) {
    const owners = policy.ownership?.[owner];
    if (!Array.isArray(owners) || owners.some(item => typeof item !== 'string' || !item.trim())) {
      errors.push(`ownership.${owner} must be an array of non-empty owners.`);
    }
  }
  for (const command of ['build', 'staticAnalysis', 'unitTests', 'integrationTests']) {
    const commands = policy.commands?.[command];
    if (!Array.isArray(commands) || commands.some(item => typeof item !== 'string' || !item.trim())) {
      errors.push(`commands.${command} must be an array of non-empty commands.`);
    }
  }
  rejectUnknownFields(policy.commands, new Set(['build', 'staticAnalysis', 'unitTests', 'integrationTests']), 'commands.', errors);
  return errors;
}

function initHarnessPolicy(options = {}) {
  const fsImpl = options.fsImpl || fs;
  const file = policyFile(options);
  const cwd = options.cwd || process.cwd();
  const schemaDir = path.resolve(cwd, options.schemaDir || path.join('.mobile-ai-agents', 'harness', 'schemas'));
  const template = readPolicy(POLICY_TEMPLATE_PATH, fsImpl);
  const profile = options.profile || template.profile;
  if (!PROFILES.has(profile)) throw new Error('Unsupported profile. Use startup, team, enterprise, or regulated.');
  const policySchemaFile = path.join(schemaDir, 'mobile-harness-policy.schema.json');
  let schemaReference = path.relative(path.dirname(file), policySchemaFile).split(path.sep).join('/');
  if (!schemaReference.startsWith('./') && !schemaReference.startsWith('../')) schemaReference = `./${schemaReference}`;
  const next = { ...template, $schema: schemaReference, profile };
  const serialized = `${JSON.stringify(next, null, 2)}\n`;
  let policyChanged = true;

  if (fsImpl.existsSync(file)) {
    const current = fsImpl.readFileSync(file, 'utf8');
    policyChanged = current !== serialized;
    if (policyChanged && !options.force) throw new Error(`${file} already exists. Use --force to replace it.`);
  }

  if (policyChanged) {
    fsImpl.mkdirSync(path.dirname(file), { recursive: true });
    fsImpl.writeFileSync(file, serialized);
  }

  fsImpl.mkdirSync(schemaDir, { recursive: true });
  let schemasChanged = false;
  const schemaFiles = SCHEMA_SOURCES.map(({ name, source }) => {
    const target = path.join(schemaDir, name);
    const desired = fsImpl.readFileSync(source, 'utf8');
    const current = fsImpl.existsSync(target) ? fsImpl.readFileSync(target, 'utf8') : '';
    if (current !== desired) {
      fsImpl.writeFileSync(target, desired);
      schemasChanged = true;
    }
    return target;
  });

  return { changed: policyChanged || schemasChanged, file, schemaFiles, policy: next };
}

function loadHarnessPolicy(options = {}) {
  const fsImpl = options.fsImpl || fs;
  const file = policyFile(options);
  if (!fsImpl.existsSync(file)) return { file, policy: null, errors: ['Policy file does not exist.'] };
  const policy = readPolicy(file, fsImpl);
  return { file, policy, errors: validateHarnessPolicy(policy) };
}

function printHarnessHelp() {
  console.log('');
  console.log('  Mobile Harness policy');
  console.log('');
  console.log('  Commands:');
  console.log('    mobile-ai-agents harness policy init [--profile enterprise] [--force]');
  console.log('    mobile-ai-agents harness policy validate [--policy path] [--json]');
  console.log('');
}

async function cmdHarness(args) {
  const opts = parseOptions(args);
  const [subject, action] = opts._;
  if (!subject || subject === 'help') return printHarnessHelp();
  if (subject !== 'policy') throw new Error('Unknown harness command. Use harness help.');
  if (opts.policy === true) throw new Error('--policy requires a path.');
  const policyPath = opts.policy;

  if (action === 'init') {
    if (opts.profile === true) throw new Error('--profile requires a value.');
    if (opts.force !== undefined && opts.force !== true) throw new Error('--force does not accept a value.');
    const profile = opts.profile;
    const result = initHarnessPolicy({ policyPath, profile, force: Boolean(opts.force) });
    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`\n  ✓ ${result.changed ? 'Wrote' : 'Already configured'} ${result.file}\n`);
    return result;
  }

  if (action === 'validate') {
    const result = loadHarnessPolicy({ policyPath });
    if (opts.json) console.log(JSON.stringify({ valid: result.errors.length === 0, ...result }, null, 2));
    else if (result.errors.length) {
      console.log(`\n  ✗ Invalid ${result.file}`);
      result.errors.forEach(error => console.log(`    - ${error}`));
      console.log('');
    } else console.log(`\n  ✓ Valid ${result.file}\n`);
    if (result.errors.length) process.exitCode = 1;
    return result;
  }

  throw new Error('Unknown harness policy command. Use harness help.');
}

module.exports = {
  DEFAULT_POLICY_PATH,
  cmdHarness,
  initHarnessPolicy,
  loadHarnessPolicy,
  validateHarnessPolicy,
};
