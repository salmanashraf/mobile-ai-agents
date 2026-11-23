#!/usr/bin/env node
'use strict';

const { cmdMobileTest } = require('./commands/mobile-test');

cmdMobileTest(process.argv.slice(2)).catch(error => {
  console.error(`\n  Error: ${error.message}\n`);
  process.exitCode = 1;
});
