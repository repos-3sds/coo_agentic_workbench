/**
 * Draft Builder Sign-off Agents — Connectivity Test
 *
 * Runs only if the 5 sign-off agent keys are configured on the running API.
 *
 * Usage:
 *   API_URL=http://localhost:3000/api node --test server/tests/signoff-agents.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.API_URL || 'http://localhost:3000/api';

const SIGNOFF_AGENTS = ['AG_NPA_BIZ', 'AG_NPA_TECH_OPS', 'AG_NPA_FINANCE', 'AG_NPA_RMG', 'AG_NPA_LCS'];

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

describe('Sign-off agents configured', () => {
  it('should list agent status', async () => {
    const { status, data } = await api('GET', '/dify/agents/status');
    assert.equal(status, 200, `status endpoint failed: ${JSON.stringify(data)}`);
  });
});

describe('Sign-off agents connectivity', () => {
  it('should respond for configured agents', async () => {
    const { data } = await api('GET', '/dify/agents/status');
    const agents = Array.isArray(data?.agents) ? data.agents : Array.isArray(data) ? data : [];
    // /dify/agents/status returns {status:'ready'|'unconfigured'} per agent (not a boolean flag)
    const configured = new Set(agents.filter(a => a?.status === 'ready').map(a => String(a.id)));

    const missing = SIGNOFF_AGENTS.filter(id => !configured.has(id));
    if (missing.length) {
      console.log(`SKIP: Unconfigured agents: ${missing.join(', ')}`);
      assert.ok(true);
      return;
    }

    for (const id of SIGNOFF_AGENTS) {
      const { status, data: resp } = await api('POST', '/dify/chat', {
        agent_id: id,
        query: 'Connection test: reply with OK.',
        inputs: {},
        response_mode: 'blocking'
      });
      assert.equal(status, 200, `${id} call failed: ${JSON.stringify(resp)}`);
      assert.ok(resp?.answer && String(resp.answer).trim().length > 0, `${id} empty answer`);
      console.log(`${id}: OK`);
    }
  });
});
