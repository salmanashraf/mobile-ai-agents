'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseOptions } = require('../lib/options');
const { capture } = require('../lib/network-capture');

async function cmdNetwork(args) {
  const opts = parseOptions(args);
  if (opts._.join(' ') !== 'capture' || !opts.url || !opts.out || Object.keys(opts).some(key => !['_', 'url', 'out', 'flow', 'allow-origin', 'allow-writes', 'headed', 'channel'].includes(key))) {
    throw new Error('Usage: mobile-ai-agents network capture --url URL --out NEW_DIRECTORY [--flow flow.json] [--allow-origin ORIGIN,ORIGIN] [--allow-writes] [--headed] [--channel chrome]');
  }
  for (const name of ['url', 'out', 'flow', 'allow-origin', 'channel']) if (opts[name] !== undefined && typeof opts[name] !== 'string') throw new Error(`--${name} needs a value.`);
  for (const name of ['allow-writes', 'headed']) if (opts[name] !== undefined && opts[name] !== true) throw new Error(`--${name} is a flag without a value.`);
  const report = await capture({ url: opts.url, output: path.resolve(opts.out), flow: opts.flow ? JSON.parse(fs.readFileSync(opts.flow, 'utf8')) : [], allowedOrigins: opts['allow-origin']?.split(',') || [], allowWrites: !!opts['allow-writes'], headless: !opts.headed, channel: opts.channel });
  console.log(`${report.status}: ${report.touchpoints.length} touchpoints, ${report.requests.length} requests. ${path.resolve(opts.out)}`);
  console.log('API shapes observed; mobile parity is unverified. Review capture.json and report.md.');
  if (report.status !== 'captured') process.exitCode = 1;
}
module.exports = { cmdNetwork };
