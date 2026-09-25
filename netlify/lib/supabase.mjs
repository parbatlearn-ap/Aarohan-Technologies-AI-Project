// Tiny Supabase REST (PostgREST) helper — no SDK dependency.
import { config } from './config.mjs';

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const url = config.supabaseUrl();
  const key = config.supabaseKey();
  if (!url || !key) throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_ANON_KEY).');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

export const db = {
  listEmployees: () => sb('onboarding_employees?select=*&order=joining_date.desc'),
  getEmployee: async (id) => (await sb(`onboarding_employees?select=*&employee_id=eq.${encodeURIComponent(id)}`))[0] || null,
  listTasks: (id) => sb(`onboarding_tasks?select=*&order=due_date.asc${id ? `&employee_id=eq.${encodeURIComponent(id)}` : ''}`),
  createEmployee: (row) => sb('onboarding_employees', { method: 'POST', body: row, prefer: 'return=representation' }),
  createTasks: (rows) => sb('onboarding_tasks', { method: 'POST', body: rows, prefer: 'return=minimal' }),
  markWelcomed: (id) => sb(`onboarding_employees?employee_id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', body: { welcome_sent_at: new Date().toISOString() }, prefer: 'return=minimal',
  }),
  logActivity: (employee_id, action, detail) => sb('onboarding_activity', {
    method: 'POST', body: { employee_id, action, detail }, prefer: 'return=minimal',
  }).catch(() => null), // logging must never break the main flow
  recentActivity: () => sb('onboarding_activity?select=*&order=created_at.desc&limit=8'),
};

// Same rules as the n8n Onboarding Progress Engine — used only when an
// employee exists in Supabase but not yet in the n8n Data Tables.
export function computeProgress(emp, tasks, today = new Date().toISOString().slice(0, 10)) {
  const done = tasks.filter(t => t.status === 'done');
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today);
  const pending = tasks.filter(t => t.status !== 'done' && !overdue.includes(t));
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const blockers = overdue.map(t => `Overdue task (${t.priority} priority, due ${t.due_date}): ${t.task_name}`);
  let status = 'On Track';
  if (pct === 100) status = 'Complete';
  else if (['Discrepancy', 'Blocked'].includes(emp.bgv_status)) status = 'Blocked';
  else if (overdue.length) status = 'Needs Attention';
  return {
    employee_id: emp.employee_id, employee_name: emp.employee_name, completion_percentage: pct, status,
    completed: done.length, pending: pending.length, overdue: overdue.length, blockers,
    next_priorities: [...overdue, ...pending].slice(0, 3).map(t => `${t.task_name} (due ${t.due_date})`),
    bgv_status: emp.bgv_status, payroll_status: emp.payroll_status,
  };
}
