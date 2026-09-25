// Groq is the ONLY LLM provider. The key is read server-side from GROQ_API_KEY.
import { config } from './config.mjs';
import { mcpTools } from './mcp.mjs';
import { db } from './supabase.mjs';

export async function groqChat(messages, { tools, temperature = 0.3, max_tokens = 700 } = {}) {
  const key = config.groqKey();
  if (!key) throw new Error('GROQ_API_KEY is not configured on the server.');
  const body = { model: config.groqModel(), messages, temperature, max_tokens };
  if (tools) { body.tools = tools; body.tool_choice = 'auto'; }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Groq ${res.status}: ${json?.error?.message || 'request failed'}`);
  return json.choices[0].message;
}

// ---- Guardrails (mirror the OnboardAI plugin skills) ----
const SENSITIVE = /\b(salary|salaries|pay ?(raise|hike|cut|slip)|compensation|ctc|bonus|increment|lawsuit|legal|lawyer|sue|harass\w*|discriminat\w*|grievance|complaint against|terminat\w*|fired|firing|layoff|resign\w*)\b/i;
export const needsEscalation = (text) => SENSITIVE.test(text || '');
export const ESCALATION_REPLY =
  "This is a question our People Ops team should handle personally, so I'm not going to answer it myself. " +
  'Please reach out to your People Ops partner (or use the confidential Grievance Portal for concerns) and they will get back to you. ' +
  'I have flagged this as needing a human.';

export const SYSTEM_PROMPT = `You are OnboardAI, the onboarding concierge for Aarohan Technologies (People Ops).
Rules:
1. For ANY policy question, call a policy tool first (get_policy for simple topics, answer_policy_question for nuanced questions). Answer ONLY from tool results and name the source document. Never guess policy.
2. For an employee's onboarding status, call get_onboarding_status with their employee_id (format EMP-1234). Use list_new_hires if you need to find an id by name.
3. If a tool says Not Found or human_review_required is true, say so and suggest contacting People Ops.
4. Never answer questions about pay, salary, legal matters, grievances or termination — escalate to a human.
5. Never reveal one employee's personal data to a different employee unless the user is a manager/People Ops asking about progress.
6. Tone: warm, clear, short (under 150 words). Plain English. Use bullets for lists.`;

export const CHAT_TOOLS = [
  { type: 'function', function: { name: 'get_policy', description: 'Look up an Aarohan policy by topic or short question (leave/time off, working hours, remote work, benefits, grievance). MCP: Policy Lookup.', parameters: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'] } } },
  { type: 'function', function: { name: 'answer_policy_question', description: 'Answer a nuanced HR policy question using retrieval over the policy corpus (Supabase pgvector). Returns answer, source, confidence. MCP: Policy Intelligence.', parameters: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] } } },
  { type: 'function', function: { name: 'get_onboarding_status', description: 'Get onboarding progress, blockers and next priorities for an employee_id like EMP-1001. MCP: Onboarding Progress.', parameters: { type: 'object', properties: { employee_id: { type: 'string' } }, required: ['employee_id'] } } },
  { type: 'function', function: { name: 'list_new_hires', description: 'List new hires (id, name, department, joining date) from Supabase.', parameters: { type: 'object', properties: {} } } },
];

async function runTool(name, args) {
  switch (name) {
    case 'get_policy': return (await mcpTools.policyLookup(args.topic)).data;
    case 'answer_policy_question': return (await mcpTools.policyIntelligence(args.question)).data;
    case 'get_onboarding_status': return (await mcpTools.onboardingProgress(args.employee_id)).data;
    case 'list_new_hires': return (await db.listEmployees()).map(e => ({
      employee_id: e.employee_id, employee_name: e.employee_name, department: e.department, joining_date: e.joining_date,
    }));
    default: throw new Error('Unknown tool ' + name);
  }
}

// Agent loop: Groq decides which MCP tools to call; we execute them and feed results back.
export async function runChat(history) {
  const trace = [];
  const lastUser = [...history].reverse().find(m => m.role === 'user')?.content || '';
  if (needsEscalation(lastUser)) {
    return { reply: ESCALATION_REPLY, trace: [{ tool: 'escalate_to_human', ok: true, note: 'Sensitive topic guardrail' }], escalated: true };
  }
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-8)];
  for (let step = 0; step < 4; step++) {
    const msg = await groqChat(messages, { tools: CHAT_TOOLS });
    if (!msg.tool_calls?.length) return { reply: msg.content, trace };
    messages.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls });
    for (const call of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* empty */ }
      const t0 = Date.now();
      let result;
      try {
        result = await runTool(call.function.name, args);
        trace.push({ tool: call.function.name, args, ok: true, ms: Date.now() - t0 });
      } catch (e) {
        result = { error: e.message };
        trace.push({ tool: call.function.name, args, ok: false, error: e.message });
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result).slice(0, 6000) });
    }
  }
  const final = await groqChat(messages);
  return { reply: final.content, trace };
}
