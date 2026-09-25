// Offline end-to-end tests for every /api route, using mocked external services.
// Run: npm test
import assert from 'node:assert/strict';
import { installMocks, calls } from './mocks.mjs';
installMocks();
const { default: handler } = await import('../netlify/functions/api.mjs');

const call = async (method, path, body) => {
  const res = await handler(new Request('http://localhost/api' + path, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  }));
  return { status: res.status, data: await res.json() };
};
let passed = 0;
const test = async (name, fn) => {
  try { await fn(); passed++; console.log('  ✓', name); }
  catch (e) { console.error('  ✗', name, '\n    ', e.message); process.exitCode = 1; }
};

console.log('OnboardAI API tests');
await test('health reports configuration without leaking secrets', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.data.groq_configured, true);
  assert.ok(!JSON.stringify(r.data).includes('test-key-not-real'));
  assert.equal(Object.keys(r.data.mcp_endpoints).length, 4);
});
await test('employees list comes from Supabase with progress', async () => {
  const r = await call('GET', '/employees');
  assert.equal(r.status, 200);
  const sarah = r.data.employees.find(e => e.employee_id === 'EMP-1001');
  assert.equal(sarah.progress, 33);
});
await test('progress uses Onboarding Progress MCP (SSE + session)', async () => {
  const r = await call('GET', '/progress?id=EMP-1003');
  assert.equal(r.data.progress.status, 'Blocked');
  assert.match(r.data.source, /MCP/);
  assert.ok(r.data.tasks.length > 0);
});
await test('progress falls back to Supabase for employees not in n8n', async () => {
  await call('POST', '/employees', { employee_id: 'EMP-4444', employee_name: 'Test Hire', email: 't@example.com', is_virtual: true, joining_date: '2026-10-10' });
  const r = await call('GET', '/progress?id=EMP-4444');
  assert.match(r.data.source, /Supabase/);
  assert.equal(r.data.progress.completion_percentage, 0);
});
await test('progress rejects bad ids', async () => {
  assert.equal((await call('GET', '/progress?id=DROP TABLE')).status, 400);
});
await test('policy lookup via Policy Lookup MCP', async () => {
  const r = await call('POST', '/policy', { question: 'What are the working hours?', mode: 'lookup' });
  assert.equal(r.data.result.status, 'Found');
  assert.match(r.data.result.title, /Working Hours/);
});
await test('policy intelligence via MCP + Groq summary', async () => {
  const r = await call('POST', '/policy', { question: 'What is the Day-1 schedule for remote hires?', mode: 'intelligence' });
  assert.equal(r.data.result.confidence, 'high');
  assert.ok(r.data.summary.length > 20);
});
await test('sensitive questions are escalated, not answered', async () => {
  const r = await call('POST', '/policy', { question: 'Can I get a salary hike?', mode: 'lookup' });
  assert.equal(r.data.escalated, true);
  const c = await call('POST', '/chat', { messages: [{ role: 'user', content: 'I want to file a harassment complaint' }] });
  assert.equal(c.data.escalated, true);
});
await test('welcome preview uses Groq', async () => {
  const r = await call('POST', '/welcome/preview', { employee_id: 'EMP-2001' });
  assert.match(r.data.message, /Welcome/);
});
await test('welcome send calls New Hire Welcome MCP and marks Supabase', async () => {
  const r = await call('POST', '/welcome/send', { employee_id: 'EMP-2001' });
  assert.equal(r.data.result.overall_status, 'Success');
  assert.equal(r.data.result.calendar_status, 'Created');
  assert.ok(calls.some(c => c.method === 'PATCH' && c.url.includes('EMP-2001')));
  const mcpCall = calls.find(c => c.body?.params?.name === 'onboard_new_hire');
  assert.equal(mcpCall.body.params.arguments.isVirtual, 'true');
});
await test('welcome send refuses employee without email', async () => {
  assert.equal((await call('POST', '/welcome/send', { employee_id: 'EMP-1001' })).status, 400);
});
await test('chat agent calls MCP tools via Groq tool-calling', async () => {
  const r = await call('POST', '/chat', { messages: [{ role: 'user', content: 'How is EMP-1003 doing?' }] });
  assert.equal(r.data.trace[0].tool, 'get_onboarding_status');
  assert.equal(r.data.trace[0].ok, true);
  assert.match(r.data.reply, /Blocked/);
});
await test('selftest reports all integrations', async () => {
  const r = await call('GET', '/selftest');
  assert.equal(r.data.ok, true, JSON.stringify(r.data.results.filter(x => !x.ok)));
  assert.equal(r.data.results.length, 6);
});
await test('unknown route returns 404', async () => {
  assert.equal((await call('GET', '/nope')).status, 404);
});
console.log(`\n${passed} tests passed`);
