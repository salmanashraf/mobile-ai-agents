'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseOptions } = require('../lib/options');
const { capture } = require('../lib/network-capture');
const { readJson, buildContract, writeContract } = require('../lib/api-contract');

async function cmdNetwork(args) {
  const opts = parseOptions(args);
  if (opts._.join(' ') === 'contract') {
    if ((!opts.capture && !opts.har) || (opts.capture && opts.har) || !opts.out || Object.keys(opts).some(key => !['_', 'capture', 'har', 'openapi', 'out'].includes(key))) throw new Error('Usage: network contract --capture capture.json | --har session.har --out NEW_DIRECTORY [--openapi openapi.json]');
    for (const key of Object.keys(opts)) if (key !== '_' && typeof opts[key] !== 'string') throw new Error(`--${key} needs a value.`);
    const contract = buildContract(readJson(opts.capture || opts.har), { format: opts.har ? 'har' : 'capture', openapi: opts.openapi ? readJson(opts.openapi) : undefined });
    writeContract(contract, path.resolve(opts.out));
    console.log(`needs-review: ${contract.touchpoints.length} touchpoints, ${contract.requests.length} requests, ${contract.findings.length} findings. ${path.resolve(opts.out)}`);
    console.log('Observed/documented/inferred sources remain separate. Mobile verification: unverified.');
    return;
  }
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
