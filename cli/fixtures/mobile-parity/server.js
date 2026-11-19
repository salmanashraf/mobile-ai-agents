'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

function createParityServer() {
  let saves = 0;
  return http.createServer(async (request, response) => {
    const send = (status, value) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(value));
    };
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/api/items') return send(200, { items: [{ id: 101, title: 'Parity item' }] });
    if (url.pathname === '/api/auth-expired') return send(401, { code: 'session_expired' });
    if (url.pathname === '/api/save' && request.method === 'POST') {
      for await (const _chunk of request) { /* consume the bounded fixture body */ }
      saves += 1;
      return send(201, { saved: true, count: saves });
    }
    if (url.pathname === '/api/save-count') return send(200, { count: saves });
    if (url.pathname === '/favicon.ico') { response.writeHead(204); return response.end(); }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>Mobile parity fixture</title><button id="load">Load items</button><p id="status">Ready</p><script>document.querySelector("#load").onclick=async()=>{const r=await fetch("/api/items?build=web");const j=await r.json();document.querySelector("#status").textContent=j.items[0].title}</script></html>');
  });
}

if (require.main === module) {
  const directory = process.argv[2];
  if (!directory) throw new Error('Usage: node server.js OUTPUT_DIRECTORY');
  const server = createParityServer();
  server.listen(0, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    fs.writeFileSync(path.join(directory, 'server-url.txt'), url, { flag: 'wx' });
    process.stdout.write(`${url}\n`);
  });
}

module.exports = { createParityServer };
