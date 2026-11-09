'use strict';
// Same business flow as network-demo; transport is injected from the existing app.
function createClient({ baseUrl, transport = fetch }) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Use an explicit HTTP(S) test-server origin.');
  async function request(route, { signal, ...options } = {}) {
    const response = await transport(new URL(route, base).href, { ...options, signal });
    if (response.status === 401) throw Object.assign(new Error('Session expired'), { kind: 'auth-expired' });
    if (!response.ok) throw Object.assign(new Error('Request failed'), { kind: response.status === 422 ? 'validation' : 'http' });
    return response.json();
  }
  return {
    list: signal => request('/api/items', { signal }),
    detail: async signal => {
      const [item, options] = await Promise.all([request('/api/detail', { signal }), request('/api/options', { signal })]);
      return { item, options };
    },
    save: (title, signal) => {
      if (!title.trim()) throw Object.assign(new Error('Title required'), { kind: 'validation' });
      // The owned demo does not require auth. Never copy its captured bearer token.
      return request('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim() }), signal });
    },
  };
}
module.exports = { createClient };
