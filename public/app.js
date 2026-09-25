// OnboardAI frontend — plain JavaScript, no framework, no secrets.
// All data/AI calls go to /api/* (Netlify Function), which holds the keys.
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let employees = [];
let chatHistory = [];
let draftMessage = '';
const secs = (ms) => (ms ? ` · ${(ms / 1000).toFixed(1)} s` : '');
const TOOL_NAMES = {
  get_policy: 'Policy Lookup (n8n MCP)', answer_policy_question: 'Policy Intelligence (n8n MCP)',
  get_onboarding_status: 'Onboarding Progress (n8n MCP)', list_new_hires: 'New-hire list (Supabase)',
  escalate_to_human: 'Escalated to People Ops',
};

async function api(path, body) {
  const res = await fetch('/api' + path, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {});
  const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Working…'; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}

const statusPill = (s) => {
  const cls = { 'On Track': 'ok', Complete: 'ok', 'Needs Attention': 'warn', Blocked: 'bad' }[s] || '';
  return `<span class="pill ${cls}">${esc(s)}</span>`;
};
const errorBox = (msg) => `<div class="result error"><b>Something went wrong:</b> ${esc(msg)}</div>`;

// ---------- Tabs ----------
function showTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => showTab(el.dataset.goto)));

// ---------- Dashboard ----------
async function loadEmployees() {
  const tbody = $('#emp-table tbody');
  try {
    employees = (await api('/employees')).employees;
    const pending = employees.reduce((n, e) => n + (e.tasks_total - e.tasks_done), 0);
    const avg = employees.length ? Math.round(employees.reduce((n, e) => n + e.progress, 0) / employees.length) : 0;
    $('#stat-hires').textContent = employees.length;
    $('#stat-progress').textContent = avg + '%';
    $('#stat-pending').textContent = pending;
    tbody.innerHTML = employees.map((e) => `<tr>
      <td>${esc(e.employee_id)}</td><td>${esc(e.employee_name)}</td><td>${esc(e.department)}</td>
      <td>${e.is_virtual ? 'Virtual' : 'Office'}</td><td>${esc(e.joining_date)}</td>
      <td><div class="progress-cell"><div class="bar"><span style="width:${e.progress}%"></span></div>${e.progress}%</div></td>
      <td>${e.welcome_sent_at ? '<span class="pill ok">Sent</span>' : '<span class="pill muted">Not yet</span>'}</td></tr>`).join('')
      || '<tr><td colspan="7" class="muted">No new hires yet.</td></tr>';
    const opts = employees.map((e) => `<option value="${esc(e.employee_id)}">${esc(e.employee_id)} — ${esc(e.employee_name)}</option>`).join('');
    const keep = (sel) => { const v = sel.value; sel.innerHTML = opts; if (v) sel.value = v; };
    keep($('#welcome-emp')); keep($('#progress-emp'));
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7">${errorBox(e.message)}</td></tr>`;
  }
}
$('#refresh').addEventListener('click', loadEmployees);

async function loadHealth() {
  const el = $('#health');
  try {
    const h = await api('/health');
    const ok = h.groq_configured && h.supabase_configured;
    el.className = 'pill ' + (ok ? 'ok' : 'warn');
    el.textContent = ok ? 'Groq · Supabase · 4 MCP servers configured' : 'Setup incomplete: ' + [!h.groq_configured && 'GROQ_API_KEY', !h.supabase_configured && 'Supabase'].filter(Boolean).join(', ');
  } catch { el.className = 'pill bad'; el.textContent = 'API unavailable'; }
}

// ---------- New Hire Welcome ----------
$('#btn-preview').addEventListener('click', async (ev) => {
  const id = $('#welcome-emp').value; if (!id) return;
  busy(ev.target, true, 'Writing with Groq…');
  $('#send-out').innerHTML = '';
  try {
    const r = await api('/welcome/preview', { employee_id: id });
    $('#welcome-out').classList.remove('muted');
    draftMessage = r.message;
    $('#welcome-out').textContent = r.message;
    const emp = r.employee;
    $('#btn-send').disabled = !emp.email;
    $('#send-out').innerHTML = `<span class="mcp-badge">${esc(r.source)}</span><p class="hint">Will email <b>${esc(emp.email || 'no email on file')}</b>${emp.is_virtual ? ' and create a Google Calendar orientation invite (virtual role)' : ' (office role — no calendar invite)'}.</p>`;
  } catch (e) { $('#welcome-out').innerHTML = errorBox(e.message); }
  busy(ev.target, false);
});

$('#welcome-emp').addEventListener('change', () => { draftMessage = ''; $('#btn-send').disabled = true; });

$('#btn-send').addEventListener('click', async (ev) => {
  const id = $('#welcome-emp').value; if (!id) return;
  busy(ev.target, true, 'Calling New Hire Welcome MCP…');
  try {
    const r = await api('/welcome/send', { employee_id: id, message: draftMessage });
    const d = r.result || {};
    $('#send-out').innerHTML = `<div class="result"><h3>${statusPill(d.overall_status === 'Success' ? 'Complete' : d.overall_status)} ${esc(d.employee_name || id)}</h3>
      Email: <b>${esc(d.email_status)}</b><br>Calendar: <b>${esc(d.calendar_status)}</b>
      <span class="mcp-badge">${esc(r.source)}${secs(r.ms)}</span></div>`;
    loadEmployees();
  } catch (e) { $('#send-out').innerHTML = errorBox(e.message); }
  busy(ev.target, false);
});

$('#add-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const body = Object.fromEntries(f.entries());
  body.is_virtual = f.get('is_virtual') === 'on';
  const btn = ev.target.querySelector('button');
  busy(btn, true, 'Saving to Supabase…');
  try {
    const r = await api('/employees', body);
    ev.target.reset();
    await loadEmployees();
    $('#welcome-emp').value = r.employee.employee_id;
    $('#welcome-out').textContent = `Saved ${r.employee.employee_name} as ${r.employee.employee_id}. Click “Generate welcome message”.`;
  } catch (e) { $('#welcome-out').innerHTML = errorBox(e.message); }
  busy(btn, false);
});

// ---------- Policy ----------
async function askPolicy(mode, btn) {
  const q = $('#policy-q').value.trim(); if (!q) return;
  const out = $('#policy-out');
  busy(btn, true, mode === 'intelligence' ? 'Searching policy corpus…' : 'Looking up…');
  try {
    const r = await api('/policy', { question: q, mode });
    if (r.escalated) {
      out.innerHTML = `<div class="result error"><h3>Escalated to a human</h3>${esc(r.answer)}</div>`;
    } else if (mode === 'intelligence') {
      const d = r.result || {};
      const conf = { high: 'ok', medium: 'warn', low: 'bad' }[d.confidence] || '';
      out.innerHTML = `<div class="result"><h3>Answer <span class="pill ${conf}">confidence: ${esc(d.confidence)}</span>
        ${d.human_review_required ? '<span class="pill warn">human review advised</span>' : ''}</h3>
        ${r.summary ? `<p>${esc(r.summary)}</p><details><summary>Policy evidence</summary><p>${esc(d.answer)}</p></details>` : `<p>${esc(d.answer)}</p>`}
        <span class="source">Source: ${esc(d.source_document || '—')} ${d.source_section ? '· ' + esc(d.source_section) : ''} · similarity ${esc(d.similarity)}</span>
        <span class="mcp-badge">${esc(r.source)}${secs(r.ms)}</span></div>`;
    } else {
      const d = r.result || {};
      out.innerHTML = d.status === 'Found'
        ? `<div class="result"><h3>${esc(d.title)}</h3><p>${esc(d.answer)}</p>
           <span class="source">Source: ${/^https?:/.test(d.source_document) ? `<a href="${esc(d.source_document)}" target="_blank" rel="noopener">policy document (Google Drive)</a>` : esc(d.source_document)}</span>
           <span class="mcp-badge">${esc(r.source)}${secs(r.ms)}</span></div>`
        : `<div class="result error"><h3>No matching policy found</h3>Try Policy Intelligence, or contact People Ops.<span class="mcp-badge">${esc(r.source)}</span></div>`;
    }
  } catch (e) { out.innerHTML = errorBox(e.message); }
  busy(btn, false);
}
$('#btn-lookup').addEventListener('click', (e) => askPolicy('lookup', e.target));
$('#btn-intel').addEventListener('click', (e) => askPolicy('intelligence', e.target));
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
  $('#policy-q').value = c.dataset.q;
  askPolicy(c.dataset.mode || 'lookup', c.dataset.mode === 'intelligence' ? $('#btn-intel') : $('#btn-lookup'));
}));

// ---------- Chat ----------
function addMsg(role, text, tools) {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  div.textContent = text;
  if (tools?.length) {
    const t = document.createElement('span');
    t.className = 'tools';
    t.textContent = 'Answered using: ' + tools.map((x) => `${TOOL_NAMES[x.tool] || x.tool}${x.ok ? '' : ' (failed)'}`).join(', ') + (tools.some((x) => x.tool === 'escalate_to_human' || x.tool.startsWith('Groq')) ? '' : ' · Groq AI');
    div.appendChild(t);
  }
  $('#chat-log').appendChild(div);
  $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
  return div;
}
$('#chat-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = $('#chat-in').value.trim(); if (!text) return;
  $('#chat-in').value = '';
  addMsg('user', text);
  chatHistory.push({ role: 'user', content: text });
  const thinking = addMsg('bot', 'Thinking…');
  const btn = ev.target.querySelector('button'); btn.disabled = true;
  try {
    const r = await api('/chat', { messages: chatHistory });
    thinking.remove();
    addMsg('bot', r.reply || '(no reply)', r.trace.length ? r.trace : [{ tool: 'Groq AI only (no tool needed)', ok: true }]);
    chatHistory.push({ role: 'assistant', content: r.reply || '' });
  } catch (e) { thinking.textContent = 'Sorry — ' + e.message; }
  btn.disabled = false;
});

// ---------- Progress ----------
$('#btn-progress').addEventListener('click', async (ev) => {
  const id = $('#progress-emp').value; if (!id) return;
  const out = $('#progress-out');
  busy(ev.target, true, 'Calling Onboarding Progress MCP…');
  try {
    const r = await api('/progress?id=' + encodeURIComponent(id));
    const p = r.progress, e = r.employee || {};
    const done = r.tasks.filter((t) => t.status === 'done');
    const open = r.tasks.filter((t) => t.status !== 'done');
    const li = (arr, cls = '') => arr.length ? `<ul class="clean">${arr.map((x) => `<li class="${cls}">${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">None</p>';
    out.innerHTML = `
      <div class="cards">
        <div class="card stat"><span class="label">Employee</span><span class="value small">${esc(p.employee_name || e.employee_name)}</span><span class="sub">${esc(id)} · ${esc(e.department || '')}</span></div>
        <div class="card stat"><span class="label">Status</span><span class="value small">${statusPill(p.status)}</span><span class="sub">BGV: ${esc(p.bgv_status)} · Payroll: ${esc(p.payroll_status)}</span></div>
        <div class="card stat"><span class="label">Overall progress</span><span class="value">${esc(p.completion_percentage)}%</span><div class="bar"><span style="width:${p.completion_percentage}%"></span></div></div>
        <div class="card stat"><span class="label">Tasks</span><span class="value small">${p.completed} done · ${p.pending} pending · ${p.overdue} overdue</span></div>
      </div>
      <div class="grid2">
        <div class="card"><h2>Pending tasks</h2>${li(open.map((t) => `${t.task_name} — due ${t.due_date} (${t.priority})`))}
          <h2 style="margin-top:14px">Completed tasks</h2>${li(done.map((t) => t.task_name), 'task-done')}</div>
        <div class="card"><h2>Blockers</h2>${li(p.blockers || [])}
          <h2 style="margin-top:14px">Next priorities</h2>${li(p.next_priorities || [])}</div>
      </div>
      <span class="mcp-badge">${esc(r.source)}</span>`;
  } catch (e) { out.innerHTML = errorBox(e.message); }
  busy(ev.target, false);
});

loadHealth();
loadEmployees();
