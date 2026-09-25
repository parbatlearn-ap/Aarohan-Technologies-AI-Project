// Minimal MCP client (Streamable HTTP transport) for n8n MCP Server Trigger endpoints.
// Flow: initialize -> notifications/initialized -> tools/call (or tools/list).
import { config } from './config.mjs';

let rpcId = 0;

function parseBody(text, contentType = '') {
  // Responses may be plain JSON or Server-Sent Events ("data: {...}").
  if (contentType.includes('text/event-stream') || /^\s*(event:|data:)/m.test(text)) {
    const msgs = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('data:')) {
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try { msgs.push(JSON.parse(payload)); } catch { /* ignore partial */ }
      }
    }
    return msgs.find(m => m && (m.result !== undefined || m.error)) || msgs[0] || null;
  }
  if (!text.trim()) return null;
  return JSON.parse(text);
}

async function post(url, body, sessionId, timeoutMs = 25000) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const auth = config.mcpAuthHeader();
  if (auth && auth.includes(':')) {
    const i = auth.indexOf(':');
    headers[auth.slice(0, i).trim()] = auth.slice(i + 1).trim();
  }
  const res = await fetch(url, {
    method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok && res.status !== 202) {
    throw new Error(`MCP HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return {
    sessionId: res.headers.get('mcp-session-id') || sessionId,
    message: parseBody(text, res.headers.get('content-type') || ''),
  };
}

async function openSession(url) {
  const init = await post(url, {
    jsonrpc: '2.0', id: ++rpcId, method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'onboardai-command-center', version: '1.0.0' },
    },
  });
  if (init.message?.error) throw new Error('MCP initialize failed: ' + init.message.error.message);
  await post(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, init.sessionId).catch(() => {});
  return init.sessionId;
}

// Turn MCP tool result content into plain JS data where possible.
export function unwrapContent(result) {
  const content = result?.content || [];
  const texts = content.filter(c => c.type === 'text').map(c => c.text);
  const joined = texts.join('\n');
  try {
    let data = JSON.parse(joined);
    if (Array.isArray(data) && data.length === 1) data = data[0];
    if (data && typeof data === 'object' && data.json && Object.keys(data).length === 1) data = data.json;
    if (data && typeof data === 'object' && typeof data.response === 'string') {
      try { data = JSON.parse(data.response); } catch { /* keep */ }
    }
    return data;
  } catch {
    return joined;
  }
}

export async function listTools(url) {
  const sid = await openSession(url);
  const r = await post(url, { jsonrpc: '2.0', id: ++rpcId, method: 'tools/list', params: {} }, sid);
  if (r.message?.error) throw new Error(r.message.error.message);
  return (r.message?.result?.tools || []).map(t => ({ name: t.name, description: t.description }));
}

export async function callTool(url, name, args) {
  const started = Date.now();
  const sid = await openSession(url);
  const r = await post(url, {
    jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args },
  }, sid);
  if (r.message?.error) throw new Error(`MCP tool ${name} error: ${r.message.error.message}`);
  const result = r.message?.result;
  if (result?.isError) throw new Error(`MCP tool ${name} returned an error: ${JSON.stringify(result.content).slice(0, 300)}`);
  return { data: unwrapContent(result), ms: Date.now() - started, endpoint: url, tool: name };
}

// Named wrappers for the four OnboardAI MCP servers.
export const mcpTools = {
  policyLookup: (topic) => callTool(config.mcp.policyLookup(), 'get_policy', { topic }),
  policyIntelligence: (question) => callTool(config.mcp.policyIntelligence(), 'answer_policy_question', { question }),
  onboardingProgress: (employee_id) => callTool(config.mcp.onboardingProgress(), 'get_onboarding_status', { employee_id }),
  newHireWelcome: (emp) => callTool(config.mcp.newHireWelcome(), 'onboard_new_hire', {
    employee_id: emp.employee_id,
    employee_name: emp.employee_name || '',
    email: emp.email || '',
    isVirtual: String(!!emp.is_virtual),
    department: emp.department || '',
    role_title: emp.role_title || '',
    joining_date: emp.joining_date || '',
    welcome_message: emp.welcome_message || '',
  }),
};
