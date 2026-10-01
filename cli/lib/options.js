'use strict';

function parseOptions(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      out._.push(arg);
      continue;
    }

    const key = arg.slice(2);
    const next = args[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

module.exports = { parseOptions };
