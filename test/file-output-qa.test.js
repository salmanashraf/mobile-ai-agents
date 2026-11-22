'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('file-output QA keeps UI flow proof separate from artifact proof', () => {
  const skill = fs.readFileSync(
    path.join(root, 'skills/cross-platform/file-output-qa.md'),
    'utf8',
  );

  for (const required of [
    'STRUCTURE',
    'CONTENT',
    'SIZE',
    'QUALITY',
    'METADATA',
    'Missing evidence is BLOCKED, not PASS',
    'A smaller file is not automatically a pass',
    '/mobile-mcp-qa',
    '/prd-verification',
  ]) {
    assert.match(skill, new RegExp(required.replaceAll('/', '\\/')));
  }
});

test('file-output QA is included by every platform installer', () => {
  const cli = fs.readFileSync(path.join(root, 'cli/index.js'), 'utf8');

  assert.match(
    cli,
    /'file-output-qa':\s*\{ file: 'skills\/cross-platform\/file-output-qa\.md',\s+platform: 'cross'/,
  );
  assert.match(cli, /const UNIVERSAL_QA_SKILLS = \['file-output-qa'\]/);
  assert.match(cli, /android:\s*\[\s*\.\.\.FIGMA_SKILLS,\s*\.\.\.UNIVERSAL_QA_SKILLS/);
  assert.match(cli, /ios:\s*\[\s*\.\.\.FIGMA_SKILLS,\s*\.\.\.UNIVERSAL_QA_SKILLS/);
  assert.match(cli, /flutter:\s*\[\s*\.\.\.FIGMA_SKILLS,\s*\.\.\.UNIVERSAL_QA_SKILLS/);
  assert.match(cli, /rn:\s*\[\s*\.\.\.FIGMA_SKILLS,\s*\.\.\.UNIVERSAL_QA_SKILLS/);
  assert.match(cli, /gaming:\s*\[\s*\.\.\.FIGMA_SKILLS,\s*\.\.\.UNIVERSAL_QA_SKILLS/);
  assert.match(cli, /cross:\s*\[\s*\.\.\.FIGMA_SKILLS,\s*\.\.\.UNIVERSAL_QA_SKILLS/);
});

