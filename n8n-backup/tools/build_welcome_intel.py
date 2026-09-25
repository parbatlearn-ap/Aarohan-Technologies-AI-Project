from _common import *

EMPLOYEES = "rE0SYvDEpq8ZDGzR"

# ---------------- New Hire Welcome Engine ----------------
PREP_JS = r"""const trigger = $('New Hire Onboarding Trigger').item.json;
const employeeId = trigger.employee_id;
const rows = $('Get Employee Row').all().map(i => i.json).filter(r => r.employeeId);

if (rows.length) {
  const emp = rows[0];
  const isVirtual = emp.isVirtual === true || emp.isVirtual === 'true' || emp.isVirtual === '1' || emp.isVirtual === 1;
  return [{
    json: {
      employee_id: emp.employeeId,
      employee_name: emp.employeeName,
      email: emp.email,
      isVirtual: isVirtual,
      found: true
    }
  }];
}

// Not in the pre-seeded Employees Data Table (e.g. an employee created
// live through the OnboardAI app, which is a separate data store).
// Fall back to the details passed directly by the caller so the
// automation still works instead of failing 'Not Found'.
if (trigger.employee_name && trigger.email) {
  const isVirtual = trigger.isVirtual === true || trigger.isVirtual === 'true' || trigger.isVirtual === '1' || trigger.isVirtual === 1;
  return [{
    json: {
      employee_id: employeeId,
      employee_name: trigger.employee_name,
      email: trigger.email,
      isVirtual: isVirtual,
      found: true
    }
  }];
}

return [{ json: { employee_id: employeeId, employee_name: null, email: null, isVirtual: null, found: false } }];
"""
EMAIL_HTML = ('=<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">'
    '<div style="background:linear-gradient(135deg,#1a5fb4,#4c8fdb);padding:24px 28px;text-align:center;"><img src="https://onboarding-ai-ueri.onrender.com/aarohan-logo.webp" alt="Aarohan Technologies" style="height:40px;" /></div>'
    '<div style="padding:28px;color:#0f172a;"><p style="font-size:15px;line-height:1.6;margin:0 0 14px;">Hi {{ $json.employee_name }},</p>'
    '<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">Welcome to Aarohan Technologies! We\'re excited to have you join us.</p>'
    '<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Your onboarding coordinator will reach out shortly with next steps.</p>'
    '<p style="font-size:14px;line-height:1.6;margin:0;color:#334155;">Best regards,<br>People Operations Team &middot; Aarohan Technologies</p></div></div>')
CTX = "$('Prepare Employee Context').item.json"

def result(name, email, cal, overall, pos, src="const ctx = $('Prepare Employee Context').item.json;"):
    return code(name, src + "\nreturn [{\n  json: {\n    employee_id: ctx.employee_id,\n    employee_name: ctx.employee_name,\n    email_status: '%s',\n    calendar_status: '%s',\n    overall_status: '%s'\n  }\n}];\n" % (email, cal, overall), pos)

T = "New Hire Onboarding Trigger"
not_found = code("Build Result - Not Found", "const employeeId = $('New Hire Onboarding Trigger').item.json.employee_id;\nreturn [{\n  json: {\n    employee_id: employeeId,\n    employee_name: null,\n    email_status: 'Not sent (employee not found)',\n    calendar_status: 'Not created (employee not found)',\n    overall_status: 'Not Found'\n  }\n}];\n", (896, 160))
nodes = [
    exec_trigger(T, ["employee_id", "employee_name", "email", "isVirtual"]),
    data_table_get("Get Employee Row", EMPLOYEES, "employeeId", T, "employee_id", (224, 0)),
    code("Prepare Employee Context", PREP_JS, (448, 0)),
    {"id": "employee-found", "name": "Employee Found?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [672, 0],
     "parameters": {"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [{"leftValue": "={{ $json.found }}", "operator": {"type": "boolean", "operation": "equals"}, "rightValue": True}], "combinator": "and"}}},
    {"id": "send-welcome-email", "name": "Send Welcome Email", "type": "n8n-nodes-base.gmail", "typeVersion": 2.2, "position": [896, -80],
     "parameters": {"resource": "message", "operation": "send", "sendTo": "={{ $json.email }}", "subject": "=Welcome to Aarohan Technologies, {{ $json.employee_name }}!",
                    "emailType": "html", "message": EMAIL_HTML, "options": {"appendAttribution": False}},
     "credentials": cred("gmailOAuth2", "Gmail OAuth2")},
    {"id": "is-virtual", "name": "Is Virtual Role?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [1120, -80],
     "parameters": {"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [{"leftValue": "={{ %s.isVirtual }}" % CTX, "operator": {"type": "boolean", "operation": "equals"}, "rightValue": True}], "combinator": "and"}}},
    {"id": "create-orientation-event", "name": "Create Orientation Event", "type": "n8n-nodes-base.googleCalendar", "typeVersion": 1.3, "position": [1344, -160],
     "parameters": {"resource": "event", "operation": "create", "calendar": {"__rl": True, "mode": "list", "value": "primary", "cachedResultName": "primary"},
                    "start": "={{ $now.plus(1, 'days').set({ hour: 10, minute: 0, second: 0 }).toISO() }}",
                    "end": "={{ $now.plus(1, 'days').set({ hour: 11, minute: 0, second: 0 }).toISO() }}",
                    "additionalFields": {"summary": "=Onboarding Orientation - {{ %s.employee_name }}" % CTX,
                                         "description": "=Welcome orientation session for {{ %s.employee_name }} (Aarohan Technologies). Virtual onboarding session — join link to be shared by People Ops." % CTX,
                                         "attendees": ["={{ %s.email }}" % CTX]}},
     "credentials": cred("googleCalendarOAuth2Api", "Google Calendar OAuth2")},
    result("Build Result - Virtual", "Sent", "Created", "Success", (1568, -160)),
    result("Build Result - Non-Virtual", "Sent", "Skipped (role not virtual)", "Success", (1344, 0)),
    not_found,
]
conns = main_conn([(T, "Get Employee Row"), ("Get Employee Row", "Prepare Employee Context"), ("Prepare Employee Context", "Employee Found?"),
                   ("Send Welcome Email", "Is Virtual Role?"), ("Create Orientation Event", "Build Result - Virtual")])
conns["Employee Found?"] = {"main": [[{"node": "Send Welcome Email", "type": "main", "index": 0}], [{"node": "Build Result - Not Found", "type": "main", "index": 0}]]}
conns["Is Virtual Role?"] = {"main": [[{"node": "Create Orientation Event", "type": "main", "index": 0}], [{"node": "Build Result - Non-Virtual", "type": "main", "index": 0}]]}
save("new-hire-welcome.json", "OnboardAI - New Hire Welcome Engine (Logic)", nodes, conns,
     "Sends Gmail welcome email; creates Google Calendar orientation event for virtual roles.", "ZsmzKDtgO204aioS")

# ---------------- Policy Intelligence Engine ----------------
NORMALIZE_Q = r"""const embeddingObj = $json.embedding || {};
const nativeValues = embeddingObj.values || [];
let sumSq = 0;
for (const v of nativeValues) { sumSq += v * v; }
const norm = Math.sqrt(sumSq);
const normalized = norm > 0 ? nativeValues.map((v) => v / norm) : nativeValues;

const question = $('Receive Question').item.json.question;

return {
  json: {
    question: question,
    native_dimension: nativeValues.length,
    embedding_vector_literal: '[' + normalized.join(',') + ']'
  }
};"""
EVIDENCE_JS = open(__file__.replace("build_welcome_intel.py", "evidence_confidence_logic.js")).read()

def gemini(name, text_expr, pos, batching=False):
    opts = {"batching": {"batch": {"batchSize": 1, "batchInterval": 1200}}} if batching else {}
    return {"id": name.lower().replace(' ', '-').replace('(', '').replace(')', ''), "name": name, "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.5, "position": list(pos),
            "parameters": {"method": "POST", "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
                           "authentication": "predefinedCredentialType", "nodeCredentialType": "googlePalmApi", "sendBody": True, "contentType": "json", "specifyBody": "json",
                           "jsonBody": '={{ { "model": "models/gemini-embedding-001", "content": { "parts": [ { "text": %s } ] }, "outputDimensionality": 768 } }}' % text_expr,
                           "options": opts},
            "credentials": cred("googlePalmApi", "Google Gemini (PaLM) API")}

nodes = [
    exec_trigger("Receive Question", ["question"]),
    gemini("Embed Question (Gemini)", "$json.question", (224, 0)),
    code("Normalize Question Embedding", NORMALIZE_Q, (448, 0), mode="runOnceForEachItem"),
    {"id": "query-policy-chunks", "name": "Query Policy Chunks (Supabase)", "type": "n8n-nodes-base.postgres", "typeVersion": 2.7, "position": [672, 0],
     "parameters": {"operation": "executeQuery", "query": "SELECT document_id, section, chunk_text, (embedding <=> $1::vector) AS distance FROM policy_chunks ORDER BY distance LIMIT 5;",
                    "options": {"queryReplacement": "={{ $json.embedding_vector_literal }}"}},
     "credentials": cred("postgres", "Supabase Postgres (session pooler)")},
    code("Evidence & Confidence Logic", EVIDENCE_JS, (896, 0)),
]
save("policy-intelligence.json", "OnboardAI - Policy Intelligence Engine (Logic)", nodes,
     main_conn([("Receive Question", "Embed Question (Gemini)"), ("Embed Question (Gemini)", "Normalize Question Embedding"),
                ("Normalize Question Embedding", "Query Policy Chunks (Supabase)"), ("Query Policy Chunks (Supabase)", "Evidence & Confidence Logic")]),
     "RAG: Gemini embedding -> Supabase pgvector top-5 -> deterministic evidence/confidence gating.", "GVPn10p2N8LBXQ4n")
