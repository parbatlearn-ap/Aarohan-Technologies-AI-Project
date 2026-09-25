// Offline mocks for Supabase, n8n MCP (Streamable HTTP / SSE) and Groq.
// Used by the automated tests and the local preview server — NOT by production.
const employees = [
  { employee_id: 'EMP-2001', employee_name: 'Devika Rao', email: 'devika@example.com', department: 'Product Design', role_title: 'UX Designer', is_virtual: true, joining_date: '2026-09-29', bgv_status: 'Cleared', payroll_status: 'Not Started', welcome_sent_at: null },
  { employee_id: 'EMP-2002', employee_name: 'Karan Mehta', email: 'karan@example.com', department: 'People Operations', role_title: 'HR Generalist', is_virtual: false, joining_date: '2026-09-29', bgv_status: 'Cleared', payroll_status: 'Not Started', welcome_sent_at: null },
  { employee_id: 'EMP-1001', employee_name: 'Sarah Sharma', email: null, department: 'Engineering', role_title: 'Software Engineer', is_virtual: true, joining_date: '2026-09-28', bgv_status: 'In Progress', payroll_status: 'Not Started', welcome_sent_at: null },
  { employee_id: 'EMP-1003', employee_name: 'Arjun Verma', email: null, department: 'Sales', role_title: 'Account Executive', is_virtual: true, joining_date: '2026-09-15', bgv_status: 'Discrepancy', payroll_status: 'Not Started', welcome_sent_at: null },
  { employee_id: 'EMP-1002', employee_name: 'Priya Nair', email: null, department: 'Finance', role_title: 'Financial Analyst', is_virtual: false, joining_date: '2026-09-01', bgv_status: 'Cleared', payroll_status: 'Active', welcome_sent_at: '2026-08-25T10:00:00Z' },
];
const tasks = [
  ['EMP-1001', 'Accept offer letter', 'done', 'high', '2026-09-08'], ['EMP-1001', 'Submit education certificates', 'done', 'high', '2026-09-12'],
  ['EMP-1001', 'Submit bank details form for payroll', 'pending', 'high', '2026-09-19'], ['EMP-1001', 'Upload updated address proof', 'in_progress', 'high', '2026-09-20'],
  ['EMP-1001', 'Confirm remote equipment shipping address', 'pending', 'medium', '2026-09-23'], ['EMP-1001', 'Schedule manager intro call', 'pending', 'medium', '2026-09-22'],
  ['EMP-1002', 'Accept offer letter', 'done', 'high', '2026-08-20'], ['EMP-1002', 'Complete Day-1 orientation', 'done', 'high', '2026-09-01'],
  ['EMP-1002', 'Complete timesheet training', 'done', 'medium', '2026-09-05'], ['EMP-1002', 'Enroll in benefits', 'done', 'medium', '2026-09-10'],
  ['EMP-1002', 'Prepare for First 2 Weeks check-in', 'pending', 'low', '2026-09-25'],
  ['EMP-1003', 'Accept offer letter', 'done', 'high', '2026-08-25'], ['EMP-1003', 'Resolve BGV discrepancy with TrustVerify', 'pending', 'high', '2026-09-16'],
  ['EMP-1003', 'Submit bank details form for payroll', 'pending', 'high', '2026-09-18'],
  ['EMP-2001', 'Accept offer letter', 'done', 'high', '2026-09-20'], ['EMP-2001', 'Submit identity documents', 'done', 'high', '2026-09-24'],
  ['EMP-2001', 'Submit bank details form for payroll', 'pending', 'high', '2026-09-27'], ['EMP-2001', 'Complete VPN / remote access setup', 'pending', 'medium', '2026-09-28'],
  ['EMP-2001', 'Attend virtual orientation', 'pending', 'medium', '2026-09-29'],
  ['EMP-2002', 'Accept offer letter', 'done', 'high', '2026-09-20'], ['EMP-2002', 'Submit identity documents', 'pending', 'high', '2026-09-26'],
].map(([employee_id, task_name, status, priority, due_date], i) => ({ id: i + 1, employee_id, task_name, status, priority, due_date }));

export const calls = [];
const sse = (obj, headers = {}) => new Response(`event: message\ndata: ${JSON.stringify(obj)}\n\n`, {
  status: 200, headers: { 'content-type': 'text/event-stream', 'mcp-session-id': 'sess-123', ...headers },
});
const jres = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

function mcpToolResult(tool, args) {
  switch (tool) {
    case 'get_policy':
      return /hour/i.test(args.topic)
        ? { policy_topic: 'working_hours', title: 'Working Hours Policy', answer: 'Standard working hours at Aarohan Technologies are 9:00 AM to 6:00 PM IST, Monday through Friday, with core collaboration hours of 10:00 AM-4:00 PM.', source_document: 'https://drive.google.com/file/d/16hEZo_cQZUdpGupv3aRn2eIVPbWS4Qlh/view', status: 'Found' }
        : { policy_topic: 'time_off', title: 'Time Off / Leave Policy', answer: 'Aarohan Technologies provides 18 days of Paid Time Off (PTO) per calendar year, accrued monthly at 1.5 days/month, plus 12 public holidays and 7 sick days.', source_document: 'https://drive.google.com/file/d/1Mlll2CpBbO6lfPXd-ks7FWGZ5FqWmrRk/view', status: 'Found' };
    case 'answer_policy_question':
      return { answer: 'Remote hires follow the same four sessions (HR Induction, Manager 1:1, Team Introduction, plus an IT setup call) held virtually. Desk setup does not apply.', source_document: 'day1_office_policy', source_section: '3. Day-1 Schedule (Remote Hires)', similarity: 0.781, confidence: 'high', human_review_required: false, reason: 'clear margin' };
    case 'get_onboarding_status':
      if (!['EMP-1001', 'EMP-1002', 'EMP-1003', 'EMP-2001', 'EMP-2002'].includes(args.employee_id)) return { employee_id: args.employee_id, status: 'Not Found' };
      return args.employee_id === 'EMP-1003'
        ? { employee_id: 'EMP-1003', employee_name: 'Arjun Verma', completion_percentage: 40, status: 'Blocked', completed: 2, pending: 1, overdue: 2, blockers: ['BGV discrepancy — verification is stalled and needs People Ops / TrustVerify follow-up.', 'Missing document: Bank details form'], next_priorities: ['Resolve BGV discrepancy with TrustVerify (due 2026-09-16, overdue)'], bgv_status: 'Discrepancy', payroll_status: 'Not Started' }
        : { employee_id: args.employee_id, employee_name: 'Sarah Sharma', completion_percentage: 33, status: 'Needs Attention', completed: 2, pending: 0, overdue: 4, blockers: ['Missing document: Bank details form', 'Document under review: Address proof (updated)'], next_priorities: ['Submit bank details form for payroll (due 2026-09-19, overdue)'], bgv_status: 'In Progress', payroll_status: 'Not Started' };
    case 'onboard_new_hire':
      return { employee_id: args.employee_id, employee_name: args.employee_name, email_status: 'Sent', calendar_status: args.isVirtual === 'true' ? 'Created' : 'Skipped (role not virtual)', overall_status: 'Success' };
  }
  return null;
}

let groqStep = 0;
export async function mockFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const body = init.body ? JSON.parse(init.body) : null;
  calls.push({ url, method: init.method || 'GET', body });

  if (url.includes('.supabase.co/rest/v1/')) {
    const u = new URL(url);
    const table = u.pathname.split('/').pop();
    const eq = [...u.searchParams.entries()].find(([k, v]) => k === 'employee_id' && v.startsWith('eq.'));
    const id = eq?.[1].slice(3);
    if ((init.method || 'GET') === 'GET') {
      if (table === 'onboarding_employees') return jres(id ? employees.filter(e => e.employee_id === id) : employees);
      if (table === 'onboarding_tasks') return jres(id ? tasks.filter(t => t.employee_id === id) : tasks);
      return jres([]);
    }
    if (init.method === 'POST' && table === 'onboarding_employees') { employees.unshift({ ...body }); return jres([body], 201); }
    if (init.method === 'PATCH') { const e = employees.find(x => x.employee_id === id); if (e) Object.assign(e, body); return new Response(null, { status: 204 }); }
    if (init.method === 'POST' && table === 'onboarding_tasks') { body.forEach(t => tasks.push({ id: tasks.length + 1, ...t })); return new Response('', { status: 201 }); }
    return new Response('', { status: 201 });
  }

  if (url.includes('/mcp/onboardai-')) {
    if (body.method === 'initialize') return sse({ jsonrpc: '2.0', id: body.id, result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'n8n' } } });
    if (body.method === 'notifications/initialized') return new Response('', { status: 202 });
    if (init.headers['mcp-session-id'] !== 'sess-123') return jres({ error: 'missing session' }, 400);
    if (body.method === 'tools/list') return sse({ jsonrpc: '2.0', id: body.id, result: { tools: [{ name: url.includes('welcome') ? 'onboard_new_hire' : 'x', description: 'd' }] } });
    if (body.method === 'tools/call') {
      const data = mcpToolResult(body.params.name, body.params.arguments);
      // n8n wraps the sub-workflow output as a JSON array in a text content block
      return sse({ jsonrpc: '2.0', id: body.id, result: { content: [{ type: 'text', text: JSON.stringify([data]) }] } });
    }
  }

  if (url.startsWith('https://api.groq.com/')) {
    if (!init.headers.Authorization?.startsWith('Bearer ')) return jres({ error: { message: 'no key' } }, 401);
    const last = body.messages[body.messages.length - 1];
    if (body.tools && last.role === 'user') {
      groqStep++;
      const m = last.content.match(/EMP-\d+/);
      const call = m
        ? { name: 'get_onboarding_status', arguments: JSON.stringify({ employee_id: m[0] }) }
        : { name: 'get_policy', arguments: JSON.stringify({ topic: last.content }) };
      return jres({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_' + groqStep, type: 'function', function: call }] } }] });
    }
    if (last.role === 'tool') {
      const data = JSON.parse(last.content);
      const text = data.status && data.completion_percentage !== undefined
        ? `${data.employee_name} is ${data.completion_percentage}% through onboarding and currently ${data.status}.\n• Blocker: ${data.blockers?.[0] || 'none'}\n• Next: ${data.next_priorities?.[0] || '—'}`
        : `${data.answer}\n\nSource: ${data.title || data.source_document}`;
      return jres({ choices: [{ message: { role: 'assistant', content: text } }] });
    }
    const sys = body.messages[0]?.content || '';
    if (sys.includes('onboarding messages')) {
      return jres({ choices: [{ message: { role: 'assistant', content: 'Dear Devika,\n\nWelcome to Aarohan Technologies! We are so glad you are joining our Product Design team as a UX Designer on 29 September. Since your role is remote, IT will courier your laptop to your registered address, and a virtual orientation invite will land on your calendar shortly.\n\nIf anything is unclear before Day 1, just reply to this email.\n\nPeople Operations, Aarohan Technologies' } }] });
    }
    if (sys.includes('Rewrite')) return jres({ choices: [{ message: { role: 'assistant', content: 'On Day 1, remote hires attend four virtual sessions: HR Induction, a 1:1 with their manager, a team introduction and an IT setup call. Desk setup does not apply to them.' } }] });
    return jres({ choices: [{ message: { role: 'assistant', content: 'ready' } }] });
  }
  throw new Error('Unmocked URL: ' + url);
}

export function installMocks() {
  process.env.GROQ_API_KEY = 'test-key-not-real';
  process.env.SUPABASE_URL = 'https://mock-project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'mock-anon';
  globalThis.fetch = mockFetch;
}
