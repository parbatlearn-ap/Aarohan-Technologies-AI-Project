// Single Netlify Function that serves every /api/* route for OnboardAI.
// The browser never sees GROQ_API_KEY or Supabase keys — everything goes through here.
import { config as cfg } from '../lib/config.mjs';
import { mcpTools, listTools } from '../lib/mcp.mjs';
import { db, computeProgress } from '../lib/supabase.mjs';
import { groqChat, runChat, needsEscalation, ESCALATION_REPLY } from '../lib/groq.mjs';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const EMP_ID = /^EMP-\d{3,6}$/;

async function readBody(req) {
  try { return await req.json(); } catch { return {}; }
}

const routes = {
  'GET /health': async () => json({
    ok: true,
    groq_configured: !!cfg.groqKey(),
    supabase_configured: !!(cfg.supabaseUrl() && cfg.supabaseKey()),
    mcp_endpoints: Object.fromEntries(Object.entries(cfg.mcp).map(([k, f]) => [k, f()])),
    model: cfg.groqModel(),
  }),

  // Runs every integration once (read-only — does NOT send emails) and reports pass/fail.
  'GET /selftest': async () => {
    const check = async (name, fn) => {
      const t0 = Date.now();
      try { const detail = await fn(); return { name, ok: true, ms: Date.now() - t0, detail }; }
      catch (e) { return { name, ok: false, ms: Date.now() - t0, error: e.message }; }
    };
    const results = await Promise.all([
      check('supabase_employees', async () => `${(await db.listEmployees()).length} employees`),
      check('mcp_policy_lookup', async () => (await mcpTools.policyLookup('working hours')).data?.status),
      check('mcp_policy_intelligence', async () => (await mcpTools.policyIntelligence('What equipment will I receive if I am a remote hire?')).data?.confidence),
      check('mcp_onboarding_progress', async () => (await mcpTools.onboardingProgress('EMP-1001')).data?.status),
      check('mcp_new_hire_welcome_tools_list', async () => (await listTools(cfg.mcp.newHireWelcome())).map(t => t.name).join(',')),
      check('groq', async () => (await groqChat([{ role: 'user', content: 'Reply with the single word: ready' }], { max_tokens: 5 })).content),
    ]);
    return json({ ok: results.every(r => r.ok), results });
  },

  'GET /employees': async () => {
    const [emps, tasks] = await Promise.all([db.listEmployees(), db.listTasks()]);
    const rows = emps.map(e => {
      const t = tasks.filter(x => x.employee_id === e.employee_id);
      const done = t.filter(x => x.status === 'done').length;
      return { ...e, tasks_total: t.length, tasks_done: done, progress: t.length ? Math.round(done * 100 / t.length) : 0 };
    });
    return json({ employees: rows });
  },

  'POST /employees': async (req) => {
    const b = await readBody(req);
    if (!b.employee_name || !b.email) return json({ error: 'Name and email are required.' }, 400);
    const id = b.employee_id && EMP_ID.test(b.employee_id) ? b.employee_id : `EMP-${Math.floor(3000 + Math.random() * 6000)}`;
    const joining = b.joining_date || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const [emp] = await db.createEmployee({
      employee_id: id, employee_name: b.employee_name, email: b.email, department: b.department || 'General',
      role_title: b.role_title || '', is_virtual: !!b.is_virtual, joining_date: joining,
    });
    const due = (d) => new Date(new Date(joining).getTime() - d * 864e5).toISOString().slice(0, 10);
    const std = [
      ['Accept offer letter', 'high', 6], ['Submit identity documents', 'high', 4],
      ['Submit bank details form for payroll', 'high', 2],
      [b.is_virtual ? 'Complete VPN / remote access setup' : 'Collect ID badge on Day 1', 'medium', b.is_virtual ? 1 : 0],
      ['Attend orientation', 'medium', 0],
    ];
    await db.createTasks(std.map(([task_name, priority, d]) => ({ employee_id: id, task_name, priority, status: 'pending', due_date: due(d) })));
    await db.logActivity(id, 'employee_created', { department: emp.department });
    return json({ employee: emp });
  },

  'GET /progress': async (req, url) => {
    const id = url.searchParams.get('id') || '';
    if (!EMP_ID.test(id)) return json({ error: 'Valid employee id required (e.g. EMP-1001).' }, 400);
    const [emp, tasks] = await Promise.all([db.getEmployee(id), db.listTasks(id)]);
    let progress, source = 'MCP: onboardai-onboarding-progress (get_onboarding_status)', mcpError = null;
    try {
      progress = (await mcpTools.onboardingProgress(id)).data;
      if (!progress || progress.status === 'Not Found') throw new Error('Employee not in n8n Data Tables');
    } catch (e) {
      mcpError = e.message;
      if (!emp) return json({ error: 'Employee not found.' }, 404);
      progress = computeProgress(emp, tasks);
      source = 'Supabase (local fallback — same rules as MCP engine)';
    }
    return json({ employee: emp, tasks, progress, source, mcp_note: mcpError });
  },

  'POST /welcome/preview': async (req) => {
    const { employee_id } = await readBody(req);
    const emp = await db.getEmployee(employee_id);
    if (!emp) return json({ error: 'Employee not found.' }, 404);
    const msg = await groqChat([
      { role: 'system', content: 'You write warm, human onboarding messages for Aarohan Technologies People Ops. No corporate jargon, no emojis, under 120 words. Sign off as "People Operations, Aarohan Technologies".' },
      { role: 'user', content: `Write a personalised welcome note for ${emp.employee_name}, joining as ${emp.role_title || 'a new team member'} in ${emp.department} on ${emp.joining_date}. Work mode: ${emp.is_virtual ? 'remote/virtual — mention a virtual orientation invite will arrive on their calendar and IT will courier the laptop' : 'office-based at Pune HQ — mention Day-1 check-in with People Ops and ID badge'}.` },
    ], { temperature: 0.6, max_tokens: 300 });
    return json({ employee: emp, message: msg.content });
  },

  'POST /welcome/send': async (req) => {
    const { employee_id } = await readBody(req);
    const emp = await db.getEmployee(employee_id);
    if (!emp) return json({ error: 'Employee not found.' }, 404);
    if (!emp.email) return json({ error: 'This employee has no email on file, so no welcome email can be sent.' }, 400);
    const r = await mcpTools.newHireWelcome(emp);
    if (r.data?.overall_status === 'Success') await db.markWelcomed(employee_id);
    await db.logActivity(employee_id, 'welcome_sent', r.data);
    return json({ result: r.data, source: 'MCP: onboardai-new-hire-welcome (onboard_new_hire)', ms: r.ms });
  },

  'POST /policy': async (req) => {
    const { question, mode } = await readBody(req);
    if (!question || question.length > 500) return json({ error: 'Please enter a question (max 500 characters).' }, 400);
    if (needsEscalation(question)) return json({ escalated: true, answer: ESCALATION_REPLY });
    if (mode === 'intelligence') {
      const r = await mcpTools.policyIntelligence(question);
      let summary = null;
      if (r.data?.answer && !r.data.human_review_required) {
        summary = (await groqChat([
          { role: 'system', content: 'Rewrite the policy evidence as a direct, plain-English answer to the question in 2-4 sentences. Use ONLY the evidence. Do not add facts.' },
          { role: 'user', content: `Question: ${question}\n\nEvidence (${r.data.source_document} / ${r.data.source_section}):\n${r.data.answer}` },
        ], { temperature: 0.1, max_tokens: 220 })).content;
      }
      return json({ mode, result: r.data, summary, source: 'MCP: onboardai-policy-intelligence (answer_policy_question) + Groq', ms: r.ms });
    }
    const r = await mcpTools.policyLookup(question);
    return json({ mode: 'lookup', result: r.data, source: 'MCP: onboardai-policy-lookup (get_policy)', ms: r.ms });
  },

  'POST /chat': async (req) => {
    const { messages } = await readBody(req);
    if (!Array.isArray(messages) || !messages.length) return json({ error: 'messages[] required' }, 400);
    const clean = messages.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
    const out = await runChat(clean);
    await db.logActivity(null, 'chat', { tools: out.trace.map(t => t.tool) });
    return json(out);
  },

  'GET /activity': async () => json({ activity: await db.recentActivity() }),
};

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(\.netlify\/functions\/api|api)/, '') || '/';
  const handler = routes[`${req.method} ${path}`];
  if (!handler) return json({ error: `No route ${req.method} ${path}` }, 404);
  try {
    return await handler(req, url);
  } catch (e) {
    console.error(path, e);
    return json({ error: e.message }, 502);
  }
};

// Netlify Functions v2 routing: this function answers every /api/* request.
export const config = { path: '/api/*' };
