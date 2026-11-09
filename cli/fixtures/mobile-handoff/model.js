'use strict';
function createModel(client) {
  let state = { status: 'idle', data: null, error: null }, active, generation = 0;
  const listeners = new Set();
  function set(next) { state = next; listeners.forEach(fn => fn(state)); }
  async function run(operation, value) {
    if (!['list', 'detail', 'save'].includes(operation)) throw new Error('Unknown operation');
    if (state.status === 'loading') return; // No duplicate submission, no automatic retries.
    const current = ++generation;
    active = new AbortController();
    set({ status: 'loading', data: null, error: null });
    try {
      const data = await (operation === 'save' ? client.save(value, active.signal) : client[operation](active.signal));
      if (current === generation) set({ status: 'success', data, error: null });
    } catch (error) {
      if (current === generation) set({ status: 'error', data: null, error: error.kind || 'network' });
    } finally { if (current === generation) active = null; }
  }
  function cancel() { ++generation; active?.abort(); active = null; set({ status: 'cancelled', data: null, error: null }); }
  return { getState: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, run, cancel, dispose: () => { ++generation; active?.abort(); active = null; listeners.clear(); } };
}
module.exports = { createModel };
