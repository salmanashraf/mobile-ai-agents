'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseOptions } = require('../lib/options');
const SOURCE = path.resolve(__dirname, '../../tools/figma-spec');
const FILES = ['README.md', 'requirements.txt', 'page_index.js', 'text_dump.js', 'node_dump.js',
  'yaml_io.py', 'dump_to_yaml.py', 'crosscheck.py', 'compare_screens.py', 'validate_spec.py'];

function initFigmaTools(cwd = process.cwd()) {
  const realRoot = fs.realpathSync(cwd);
  const destination = path.join(realRoot, 'tools/figma-spec');
  // Check existing ancestors before creating anything; never follow redirected paths.
  for (const relative of ['tools', 'tools/figma-spec']) {
    const candidate = path.join(realRoot, relative);
    if (fs.existsSync(candidate) || (() => { try { return fs.lstatSync(candidate).isSymbolicLink(); } catch { return false; } })()) {
      if (fs.lstatSync(candidate).isSymbolicLink()) throw new Error('Tools directory must be inside the project without symlink redirects');
      if (!fs.statSync(candidate).isDirectory()) throw new Error(`Expected directory: ${candidate}`);
    }
  }
  fs.mkdirSync(destination, { recursive: true });
  return FILES.map(name => {
    const target = path.join(destination, name);
    try {
      fs.copyFileSync(path.join(SOURCE, name), target, fs.constants.COPYFILE_EXCL);
      return { name, status: 'created' };
    } catch (error) {
      if (error.code === 'EEXIST') return { name, status: 'preserved' };
      throw error;
    }
  });
}

function cmdFigma(args) {
  const options = parseOptions(args);
  if (options._.join(' ') !== 'tools init' || Object.keys(options).some(key => key !== '_')) {
    throw new Error('Usage: mobile-ai-agents figma tools init (run in the target project)');
  }
  const results = initFigmaTools();
  for (const { name, status } of results) console.log(`${status}: tools/figma-spec/${name}`);
  console.log('Helpers installed. Connect/authenticate Figma separately; see tools/figma-spec/README.md.');
}
module.exports = { initFigmaTools, cmdFigma };
