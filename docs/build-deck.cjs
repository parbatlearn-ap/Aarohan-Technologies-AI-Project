// Builds docs/OnboardAI-Presentation.pptx  (run: node docs/build-deck.cjs)
const pptxgen = require('pptxgenjs');
const path = require('path');
const D = (f) => path.join(__dirname, f);
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.title = 'OnboardAI — Aarohan Technologies';

const C = { navy: '0D2552', blue: '1565D8', teal: '1AA39A', green: '4CC57A', sun: 'F7A823', bg: 'F4F7FB', text: '13213D', muted: '5D6B84', line: 'DFE6F0', white: 'FFFFFF' };
const FONT = 'Calibri';
const logo = D('../public/logo.png'); // 640x268

function header(s, n, title, kicker) {
  s.background = { color: C.bg };
  s.addShape(pres.shapes.OVAL, { x: 0.45, y: 0.32, w: 0.5, h: 0.5, fill: { color: C.navy } });
  s.addText(String(n), { x: 0.45, y: 0.32, w: 0.5, h: 0.5, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 14, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText(title, { x: 1.1, y: 0.28, w: 7.4, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: C.navy, margin: 0, valign: 'middle', isTextBox: true });
  if (kicker) s.addText(kicker, { x: 1.1, y: 0.82, w: 8.2, h: 0.35, fontFace: FONT, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });
  s.addImage({ path: logo, x: 8.55, y: 0.3, w: 1.05, h: 0.44 });
}
function card(s, x, y, w, h, title, body, color = C.blue) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: x + 0.02, y: y + 0.02, w: w - 0.04, h: 0.07, fill: { color }, line: { color, width: 0 } });
  s.addText(title, { x: x + 0.18, y: y + 0.18, w: w - 0.36, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: C.navy, margin: 0, isTextBox: true });
  s.addText(body, { x: x + 0.18, y: y + 0.55, w: w - 0.36, h: h - 0.7, fontFace: FONT, fontSize: 11, color: C.text, margin: 0, valign: 'top', isTextBox: true });
}
function bullets(s, items, x, y, w, h, size = 13) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x, y, w, h, fontFace: FONT, fontSize: size, color: C.text, paraSpaceAfter: 6, valign: 'top', margin: 0, isTextBox: true });
}
function shot(s, file, x, y, w) {
  const h = w * (860 / 1366);
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  s.addImage({ path: D('screenshots/' + file), x, y, w, h });
}

// 0. Title
let s = pres.addSlide();
s.background = { color: C.navy };
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.6, w: 3.3, h: 1.45, rectRadius: 0.1, fill: { color: C.white }, line: { color: C.white } });
s.addImage({ path: logo, x: 0.75, y: 0.72, w: 3.0, h: 1.26 });
s.addText('OnboardAI', { x: 0.6, y: 2.3, w: 8.8, h: 0.9, fontFace: FONT, fontSize: 44, bold: true, color: C.white, margin: 0, isTextBox: true });
s.addText('AI Employee Pre-boarding & Onboarding Command Center', { x: 0.6, y: 3.15, w: 8.8, h: 0.5, fontFace: FONT, fontSize: 20, color: 'CFE0FA', margin: 0, isTextBox: true });
s.addText('AI For All 2.0 · Cowork Capstone · Use Case 2 — People Ops & Onboarding Concierge', { x: 0.6, y: 3.75, w: 8.8, h: 0.4, fontFace: FONT, fontSize: 13, color: C.sun, margin: 0, isTextBox: true });
s.addText('Amol Parbat · 25 Sep 2026', { x: 0.6, y: 4.75, w: 8.8, h: 0.4, fontFace: FONT, fontSize: 12, color: 'AFC3E6', margin: 0, isTextBox: true });

// 1. Problem
s = pres.addSlide(); header(s, 1, 'The problem', 'A new hire\'s first two weeks are scattered across people, tools and documents');
card(s, 0.5, 1.4, 2.9, 1.9, 'Repetitive questions', 'People Ops answers the same leave, hours and document questions again and again — by hand.', C.blue);
card(s, 3.55, 1.4, 2.9, 1.9, 'Generic answers', 'HR bots answer confidently but not from THIS company\'s policies — so answers can be wrong.', C.teal);
card(s, 6.6, 1.4, 2.9, 1.9, 'Blockers found late', 'A BGV discrepancy or missing bank form is noticed only when payroll slips.', C.sun);
s.addText('Result: slow, inconsistent onboarding and a poor first impression for the new hire.', { x: 0.5, y: 3.65, w: 9, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: C.navy, margin: 0, isTextBox: true });

// 2. Solution
s = pres.addSlide(); header(s, 2, 'The solution: one AI command center', 'Grounded in company data — every answer comes from a tool, not LLM memory');
const sol = [['Welcome', 'Personal note (Groq) + Gmail email + Calendar invite for virtual roles', C.blue], ['Answer', 'Policy answers from Aarohan\'s own policies, with source & confidence', C.teal], ['Track', 'Progress %, blockers and next priorities per new hire', C.green], ['Protect', 'Pay / legal / grievance questions escalated to a human', C.sun]];
sol.forEach(([t, b, c], i) => card(s, 0.5 + i * 2.28, 1.45, 2.13, 2.2, t, b, c));
s.addText('Users: People Ops coordinators (primary) · Hiring managers · New hires (via assistant)', { x: 0.5, y: 3.95, w: 9, h: 0.4, fontFace: FONT, fontSize: 13, color: C.muted, margin: 0, isTextBox: true });

// 3. Overview
s = pres.addSlide(); header(s, 3, 'OnboardAI overview', 'Four tabs — simple enough for a non-technical HR user');
shot(s, '1-dashboard.png', 0.5, 1.3, 5.2);
bullets(s, ['Dashboard — new hires, average progress, pending tasks', 'New Hire Welcome — generate, review, send', 'Policy Assistant — Quick Lookup, Policy Intelligence, AI chat', 'Onboarding Progress — status, tasks, blockers', 'Colours taken from the Aarohan logo; works on mobile'], 6.0, 1.35, 3.6, 3.4, 12);

// 4. Architecture
s = pres.addSlide(); header(s, 4, 'Architecture', 'Simplest thing that works: static page + one serverless function');
const box = (x, y, w, h, t, sub, col) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: col }, line: { color: col } });
  s.addText([{ text: t, options: { bold: true, fontSize: 12, breakLine: true } }, { text: sub, options: { fontSize: 9 } }], { x, y, w, h, align: 'center', valign: 'middle', fontFace: FONT, color: C.white, margin: 2, isTextBox: true });
};
const arrow = (x1, y1, x2, y2) => s.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: C.muted, width: 1.5, endArrowType: 'triangle' } });
box(0.4, 2.3, 1.7, 1.0, 'Browser', 'HTML/CSS/JS · no keys', C.navy);
box(2.8, 2.3, 2.0, 1.0, 'Netlify Function', '/api/* · keys in env vars', C.blue);
arrow(2.1, 2.8, 2.8, 2.8);
box(5.6, 1.25, 1.7, 0.8, 'Groq', 'Llama 3.3 70B', C.sun);
box(5.6, 2.35, 1.7, 0.8, 'Supabase', 'employees · tasks · pgvector', C.green);
box(5.6, 3.45, 1.7, 0.8, 'n8n MCP ×4', 'Streamable HTTP', C.teal);
arrow(4.8, 2.6, 5.6, 1.65); arrow(4.8, 2.8, 5.6, 2.75); arrow(4.8, 3.0, 5.6, 3.85);
['Policy Lookup', 'Policy Intelligence', 'Onboarding Progress', 'New Hire Welcome'].forEach((t, i) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.8, y: 1.25 + i * 0.78, w: 1.85, h: 0.62, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.teal, width: 1 } });
  s.addText(t, { x: 7.8, y: 1.25 + i * 0.78, w: 1.85, h: 0.62, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 10, bold: true, color: C.navy, margin: 0, isTextBox: true });
});
arrow(7.3, 3.85, 7.8, 3.85);
s.addText('Gmail · Google Calendar · Google Drive · Gemini embeddings (inside n8n)', { x: 5.6, y: 4.55, w: 4.05, h: 0.35, fontFace: FONT, fontSize: 10, color: C.muted, margin: 0, align: 'right', isTextBox: true });

// 5. AI capabilities
s = pres.addSlide(); header(s, 5, 'AI capabilities', 'The LLM writes and decides — tools supply the facts');
card(s, 0.5, 1.35, 4.4, 1.5, 'Personalised writing', 'Groq drafts a warm, human welcome note using the hire\'s role, department, start date and work mode.', C.blue);
card(s, 5.1, 1.35, 4.4, 1.5, 'Grounded Q&A (RAG)', 'Semantic search over 38 policy chunks; confidence gating decides; Groq only rephrases the evidence.', C.teal);
card(s, 0.5, 3.05, 4.4, 1.5, 'Agentic tool use', 'Chat uses Groq tool-calling: it picks get_policy, answer_policy_question, get_onboarding_status or list_new_hires.', C.green);
card(s, 5.1, 3.05, 4.4, 1.5, 'Guardrails', 'Pay, legal, grievance, termination → escalated to a human before the LLM runs. No cross-employee data sharing.', C.sun);

// 6. MCP integration
s = pres.addSlide(); header(s, 6, 'MCP integration', '4 custom MCP servers — used by the web app AND by Claude Cowork');
const rows = [['MCP endpoint (n8n)', 'Tool', 'What it returns'],
  ['onboardai-policy-lookup', 'get_policy', 'Policy text + Google Drive source link'],
  ['onboardai-policy-intelligence', 'answer_policy_question', 'Answer, source section, similarity, confidence, human-review flag'],
  ['onboardai-onboarding-progress', 'get_onboarding_status', '% complete, status, blockers, next priorities'],
  ['onboardai-new-hire-welcome', 'onboard_new_hire', 'Email sent / calendar created (virtual only)']];
s.addTable(rows.map((r, i) => r.map(t => ({ text: t, options: { bold: i === 0, color: i === 0 ? C.white : C.text, fill: { color: i === 0 ? C.navy : (i % 2 ? C.white : 'EEF3FA') } } }))),
  { x: 0.5, y: 1.35, w: 9, colW: [2.8, 2.2, 4.0], fontFace: FONT, fontSize: 11, border: { type: 'solid', color: C.line, pt: 1 }, rowH: 0.45 });
s.addText('The app speaks MCP directly: initialize → tools/call over Streamable HTTP (JSON or SSE). Every result in the UI shows which MCP tool answered.', { x: 0.5, y: 4.15, w: 9, h: 0.6, fontFace: FONT, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });

// 7. n8n
s = pres.addSlide(); header(s, 7, 'n8n integration', 'Each tool = thin MCP wrapper + a Logic workflow that does the real work');
bullets(s, ['MCP Server Trigger → "Call n8n Workflow Tool" → Engine (Logic) sub-workflow', 'Engines read n8n Data Tables (Employees, Tasks, Documents, Policies)', 'Welcome engine: Gmail send → IF virtual → Google Calendar event', 'Intelligence engine: Gemini embedding → Supabase pgvector top-5 → deterministic evidence & confidence rules', 'All 9 workflows + data exported to n8n-backup/ (credentials stripped) before the trial ends'], 0.5, 1.35, 5.4, 3.6, 13);
card(s, 6.2, 1.35, 3.3, 2.7, 'Why this matters', 'Business rules (what counts as "Blocked", when to ask a human) live in visible, auditable workflows — not hidden inside a prompt.', C.teal);

// 8. Supabase
s = pres.addSlide(); header(s, 8, 'Supabase', 'Persistent data + vector search');
card(s, 0.5, 1.35, 2.9, 1.9, 'onboarding_employees / tasks', 'New-hire list and task checklist. New hires added in the app get a default checklist automatically.', C.blue);
card(s, 3.55, 1.35, 2.9, 1.9, 'policy_chunks (pgvector)', '38 chunks from 8 Google Drive policy docs, 768-dim embeddings, cosine search via the Intelligence MCP.', C.teal);
card(s, 6.6, 1.35, 2.9, 1.9, 'onboarding_activity', 'Audit log: welcome sent (email + calendar status), chat tool usage.', C.green);
s.addText('Row-Level Security on every table · accessed only from the server function', { x: 0.5, y: 3.5, w: 9, h: 0.4, fontFace: FONT, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });

// 9. Groq
s = pres.addSlide(); header(s, 9, 'Groq', 'The only LLM provider — fast, free tier, key never leaves the server');
bullets(s, ['Model: llama-3.3-70b-versatile (configurable via GROQ_MODEL)', 'Welcome drafting · evidence → plain-English answers · tool-calling chat agent (max 4 tool rounds)', 'GROQ_API_KEY stored as a Netlify secret env var; browser only calls /api/*', 'No fallback providers — one predictable, low-cost dependency'], 0.5, 1.4, 9, 3, 14);

// 10. Screens
s = pres.addSlide(); header(s, 10, 'UI flow', 'Screens from the local test run (same UI as deployed)');
shot(s, '2-welcome.png', 0.4, 1.3, 2.95); shot(s, '3-policy-assistant.png', 3.52, 1.3, 2.95); shot(s, '4-progress.png', 6.64, 1.3, 2.95);
['Welcome: draft → send', 'Policy answers + chat with tool trace', 'Progress: status, tasks, blockers'].forEach((t, i) =>
  s.addText(t, { x: 0.4 + i * 3.12, y: 3.3, w: 2.95, h: 0.4, fontFace: FONT, fontSize: 11, bold: true, color: C.navy, align: 'center', margin: 0, isTextBox: true }));

// 11. Demo flow
s = pres.addSlide(); header(s, 11, 'Live demo flow (5 minutes)', null);
const steps = ['Dashboard: 5 new hires, average progress, pending tasks', 'Welcome Devika (virtual): Groq note → Send → Gmail email + Calendar invite', 'Ask "What is the leave policy?" → Quick Lookup with Drive link', 'Ask "Day-1 schedule for remote hires" → Intelligence: high confidence + source', 'Progress for Arjun (EMP-1003): Blocked — BGV discrepancy', 'Chat "Can I get a salary hike?" → escalated to a human'];
steps.forEach((t, i) => {
  const y = 1.05 + i * 0.66;
  s.addShape(pres.shapes.OVAL, { x: 0.6, y, w: 0.45, h: 0.45, fill: { color: [C.blue, C.teal, C.green, C.sun][i % 4] } });
  s.addText(String(i + 1), { x: 0.6, y, w: 0.45, h: 0.45, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 13, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText(t, { x: 1.25, y, w: 8.2, h: 0.45, valign: 'middle', fontFace: FONT, fontSize: 14, color: C.text, margin: 0, isTextBox: true });
});

// 12. Business value
s = pres.addSlide(); header(s, 12, 'Business value', 'Expected impact — to be measured in a pilot, not yet proven');
card(s, 0.5, 1.35, 2.9, 2.2, 'Time back for People Ops', 'Routine policy questions and status checks answered self-serve; welcome + invite in one click.', C.blue);
card(s, 3.55, 1.35, 2.9, 2.2, 'Consistent, correct answers', 'Only from company policy, with source; low-confidence answers flagged for a human.', C.teal);
card(s, 6.6, 1.35, 2.9, 2.2, 'Earlier risk detection', 'BGV, document and overdue-task blockers surfaced before Day 1 — protects first payroll.', C.green);
s.addText('Pilot metrics to track: % questions answered without HR · time from offer to "ready for Day 1" · # hires with payroll delayed', { x: 0.5, y: 3.85, w: 9, h: 0.6, fontFace: FONT, fontSize: 12, color: C.muted, margin: 0, isTextBox: true });

// 13. Security
s = pres.addSlide(); header(s, 13, 'Security', null);
bullets(s, ['API keys only in Netlify environment variables — never in the browser or GitHub (.env.example has names only; automated secret scan)', 'n8n backups exported with all credentials stripped', 'Input validation (employee ID format, question length) and HTML-escaped output', 'Row-Level Security enabled on all Supabase tables', 'Human escalation for pay, legal, grievance and termination topics', 'Fictional data only — demo RLS and open MCP endpoints must be tightened before real use'], 0.5, 1.2, 9, 3.8, 14);

// 14. Limitations
s = pres.addSlide(); header(s, 14, 'Honest limitations', 'What it does not do yet');
bullets(s, ['n8n cloud trial ends in about 8 days — workflows backed up, migration planned', 'No login or roles yet: anyone with the link can view demo data and send test welcomes', 'Employee data split between n8n Data Tables and Supabase', 'Policy Intelligence embeddings use Gemini inside n8n (stored vectors depend on it)', 'Welcome email body is a fixed n8n template; the Groq note is shown in the app', 'Limitation I would fix next: unify data + add Supabase Auth'], 0.5, 1.35, 9, 3.6, 14);

// 15. Roadmap
s = pres.addSlide();
s.background = { color: C.navy };
s.addText('15  Future roadmap', { x: 0.6, y: 0.4, w: 8.8, h: 0.6, fontFace: FONT, fontSize: 26, bold: true, color: C.white, margin: 0, isTextBox: true });
[['Week 1', 'Move the 4 MCP tools to Supabase Edge Functions; one data store'], ['Week 2', 'Supabase Auth with roles: new hire / manager / People Ops'], ['Week 3', 'Day-3 proactive nudges (Slack/email) + weekly manager digest'], ['Later', 'Document upload & verification, Slack buddy assignment, time-to-productive analytics']].forEach(([w, t], i) => {
  const x = 0.6 + i * 2.25;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.4, w: 2.05, h: 2.4, rectRadius: 0.08, fill: { color: '17336B' }, line: { color: [C.blue, C.teal, C.green, C.sun][i], width: 2 } });
  s.addText(w, { x: x + 0.15, y: 1.55, w: 1.75, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: [C.sky || '13A3E8', C.teal, C.green, C.sun][i], margin: 0, isTextBox: true });
  s.addText(t, { x: x + 0.15, y: 2.0, w: 1.75, h: 1.7, fontFace: FONT, fontSize: 12, color: C.white, margin: 0, valign: 'top', isTextBox: true });
});
s.addText('Thank you · OnboardAI by Amol Parbat', { x: 0.6, y: 4.6, w: 8.8, h: 0.4, fontFace: FONT, fontSize: 13, color: 'AFC3E6', margin: 0, isTextBox: true });

pres.writeFile({ fileName: D('OnboardAI-Presentation.pptx') }).then(f => console.log('wrote', f));
