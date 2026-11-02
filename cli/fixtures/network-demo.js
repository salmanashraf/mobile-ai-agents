'use strict';
const http = require('node:http');

const flow = [
  { action: 'click', selector: '#load' },
  { action: 'click', selector: '#detail' },
  { action: 'click', selector: '#validate' },
  { action: 'fill', selector: '#title', value: 'Test listing' },
  { action: 'click', selector: '#save' },
];

function createDemo() {
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => { res.writeHead(status, { 'content-type': 'application/json', 'x-test-secret': 'demo-secret' }); res.end(JSON.stringify(data)); };
    if (req.url === '/api/items') return send(200, { items: [{ id: 1, title: 'Test listing', email: 'private@example.test' }] });
    if (req.url === '/api/detail') return send(200, { id: 1, title: 'Test listing' });
    if (req.url === '/api/options') return send(200, { categories: ['Books', 'Other'] });
    if (req.url === '/api/save') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      return send(201, { id: 2, saved: !!JSON.parse(raw).title });
    }
    if (req.url === '/api/error') return send(422, { errors: { title: 'Required' } });
    if (req.url === '/api/fail') return req.socket.destroy();
    if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Website API discovery demo</title>
      <h1>List → detail → form</h1><button id="load">Load listings</button><button id="detail">Open detail</button>
      <label>Title <input id="title" required></label><button id="validate">Validate locally</button><button id="save">Save test listing</button>
      <button id="error">Server error</button><button id="fail">Network failure</button><button id="external">External request</button>
      <p id="state" role="status">Ready</p><script>
      const show = text => document.querySelector('#state').textContent = text;
      document.querySelector('#load').onclick = async () => { await fetch('/api/items'); show('Listings loaded'); };
      document.querySelector('#detail').onclick = async () => { await Promise.all([fetch('/api/detail'),fetch('/api/options')]); show('Detail loaded'); };
      document.querySelector('#validate').onclick = () => show(document.querySelector('#title').value ? 'Valid' : 'Title required');
      document.querySelector('#save').onclick = async () => { await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer demo-secret'},body:JSON.stringify({title:document.querySelector('#title').value,password:'private-password'})}); show('Saved'); };
      document.querySelector('#error').onclick = () => fetch('/api/error');
      document.querySelector('#fail').onclick = () => fetch('/api/fail').catch(() => show('Failed'));
      document.querySelector('#external').onclick = () => fetch('http://127.0.0.1:1/private?token=secret').catch(() => show('Blocked'));
      </script></html>`);
  });
  return server;
}

if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const directory = process.argv[2];
  if (!directory) throw new Error('Usage: node cli/fixtures/network-demo.js NEW_FLOW_FILE');
  fs.writeFileSync(path.resolve(directory), JSON.stringify(flow, null, 2), { flag: 'wx' });
  createDemo().listen(4173, '127.0.0.1', () => console.log('Owned test site: http://127.0.0.1:4173. Stop with Ctrl+C.'));
}
module.exports = { createDemo, flow };
