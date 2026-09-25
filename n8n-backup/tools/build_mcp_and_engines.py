from _common import *

EMPLOYEES, TASKS, DOCS, POLICIES = "rE0SYvDEpq8ZDGzR", "UrT5HV43x3HX6ZvY", "duVEApIHmfhTR5JE", "dnmeCejlY1E7SR3C"

# ---------------- MCP wrappers ----------------
mcp_wrapper("policy-lookup-mcp.json", "OnboardAI - Policy Lookup MCP", "onboardai-policy-lookup",
    'This MCP server exposes one tool, get_policy, for the OnboardAI (Aarohan Technologies) project. Given a policy topic or free-text question, it returns a structured JSON snapshot: policy_topic, title, answer (the policy text), source_document, and status (Found / Not Found). If status is "Not Found", no matching Aarohan policy exists for that topic — tell the user rather than inventing an answer. Always cite source_document when presenting the answer.',
    "get_policy",
    'Given a policy topic or a free-text question (e.g. "remote_work", "how many PTO days do I get", "grievance process"), looks up the matching Aarohan Technologies policy from the OnboardAI Policies Data Table. Returns policy_topic, title, answer (the policy text), source_document, and status ("Found" or "Not Found"). If status is "Not Found", tell the user no matching policy exists rather than inventing an answer.',
    "0S2phE22QitULuk9", [("topic", 'Policy topic or question to look up (for example "remote_work" or "how many PTO days do I get")')],
    "82ae5a4c-4c29-4ab7-8bd8-17e27fc93c1d", "MCP Server Trigger exposing get_policy -> Policy Lookup Engine.", "9gzB5ufnnosPrS9b")

mcp_wrapper("policy-intelligence-mcp.json", "OnboardAI - Policy Intelligence MCP", "onboardai-policy-intelligence",
    "This MCP server exposes one tool, answer_policy_question, for the OnboardAI (Aarohan Technologies) project. Use it to answer employee/HR policy questions from the existing synthetic policy corpus. It returns a structured JSON result (answer, source_document, source_section, similarity, confidence, human_review_required, reason). If human_review_required is true, tell the user to contact People Ops rather than treating the answer as final.",
    "answer_policy_question",
    "Answers employee HR/policy questions about Aarohan Technologies using the existing synthetic policy corpus and Supabase vector index (RAG). Returns a structured result with the answer text, its source document/section, a similarity score, a confidence rating (high/medium/low), and a human_review_required flag. Refuses to invent an answer and recommends contacting People Ops when the policy corpus does not adequately cover the question.",
    "GVPn10p2N8LBXQ4n", [("question", 'The employee HR/policy question to answer, e.g. "What happens if an employee takes leave during probation?"')],
    "8554cbcc-3571-4d69-a5a5-82d5710eff9d", "Custom MCP #1. MCP Server Trigger exposing answer_policy_question -> Policy Intelligence Engine.", "dP1Gxsv0tGFe6Dww")

mcp_wrapper("onboarding-progress-mcp.json", "OnboardAI - Onboarding Progress MCP", "onboardai-onboarding-progress",
    'This MCP server exposes one tool, get_onboarding_status, for the OnboardAI (Aarohan Technologies) project. Given an employee_id, it returns a structured JSON snapshot of that employee\'s onboarding progress: completion_percentage, status (On Track / Needs Attention / Blocked / Complete), completed/pending/overdue task counts, a blockers list, next_priorities, bgv_status and payroll_status. If status is "Not Found", the employee_id does not exist in the OnboardAI onboarding data — tell the user rather than inventing a status. If status is "Blocked" or "Needs Attention", surface the blockers list to the user rather than just the top-line status.',
    "get_onboarding_status",
    'Given an employee_id (e.g. "EMP-1001"), computes that employee\'s current onboarding status from the OnboardAI onboarding Data Tables: completion percentage, an overall status (On Track / Needs Attention / Blocked / Complete), completed/pending/overdue task counts, a list of blockers (BGV/payroll holds, missing or under-review documents, overdue tasks), the top 3 next priorities, and current BGV/payroll status. Returns status "Not Found" if the employee_id does not exist.',
    "Y0QrAkmB5sG9b0K6", [("employee_id", "Employee ID to look up (for example EMP-1001)")],
    "2ddb6c12-6071-4031-b879-98d323e2693d", "Custom MCP #2. MCP Server Trigger exposing get_onboarding_status -> Onboarding Progress Engine.", "Ro337tsktn1htrRR")

mcp_wrapper("new-hire-welcome-mcp.json", "OnboardAI - New Hire Welcome MCP", "onboardai-new-hire-welcome",
    'This MCP server exposes one tool, onboard_new_hire, for the OnboardAI (Aarohan Technologies) project. Given an employee_id, it looks up the employee in the OnboardAI Employees Data Table; if not found there, it uses the employee_name/email/isVirtual arguments passed directly instead. It sends the new hire a welcome email via Gmail, and — if the role is virtual — creates an onboarding/orientation Google Calendar event. It returns employee_id, employee_name, email_status, calendar_status, and overall_status. overall_status is "Not Found" only if the employee is not in the Data Table AND no employee_name/email were passed.',
    "onboard_new_hire",
    'Given an employee_id (e.g. "EMP-2001") and, for employees not already in the Employees Data Table, their employee_name, email and isVirtual (true/false), sends the new hire a welcome email via Gmail. If the role is virtual (isVirtual true, either from the Data Table or the passed-in value), also creates an onboarding/orientation Google Calendar event. Returns employee_id, employee_name, email_status, calendar_status, and overall_status (Success / Not Found).',
    "ZsmzKDtgO204aioS",
    [("employee_id", "Employee ID of the new hire to onboard (for example EMP-2001)"),
     ("employee_name", "Full name of the new hire, used if the employee is not already in the Employees Data Table"),
     ("email", "Email address of the new hire, used if the employee is not already in the Employees Data Table"),
     ("isVirtual", "Whether the role is virtual/remote (true or false), used if the employee is not already in the Employees Data Table")],
    "477c946d-c3d3-4930-9756-415c2945e918", "MCP Server Trigger exposing onboard_new_hire -> New Hire Welcome Engine (Gmail + Google Calendar).", "h4YO9sqOB2o3jG2q")

# ---------------- Policy Lookup Engine ----------------
POLICY_JS = r"""const topicInput = ($('Policy Lookup Trigger').item.json.topic || '').toString().trim();
const exactRows = $('Get Policy By Topic').all().map(i => i.json).filter(r => r.topic);
const allRows = $('Get All Policies').all().map(i => i.json).filter(r => r.topic);

const DOC_LINKS = {
  'Aarohan_Remote_Work_Policy_v2.3.pdf': 'https://drive.google.com/file/d/1sNCdocmQk3utnF8t_xuSjyHCsR9pK0ZT/view?usp=drivesdk',
  'Aarohan_Leave_Policy_v4.1.pdf': 'https://drive.google.com/file/d/1Mlll2CpBbO6lfPXd-ks7FWGZ5FqWmrRk/view?usp=drivesdk',
  'Aarohan_Benefits_Enrollment_Policy_v1.8.pdf': 'https://drive.google.com/file/d/1zcWU6n-zvz0acofh215IVLuWJxlGbqfP/view?usp=drivesdk',
  'Aarohan_Working_Hours_Policy_v2.0.pdf': 'https://drive.google.com/file/d/16hEZo_cQZUdpGupv3aRn2eIVPbWS4Qlh/view?usp=drivesdk',
  'Aarohan_Grievance_Escalation_Policy_v1.5.pdf': 'https://drive.google.com/file/d/1qkB3IoeJQCUzuppe7qdQdsmN2NNYnjYV/view?usp=drivesdk'
};

function toResult(row) {
  return {
    json: {
      policy_topic: row.topic,
      title: row.title,
      answer: row.body,
      source_document: DOC_LINKS[row.sourceDocument] || row.sourceDocument,
      status: 'Found'
    }
  };
}

if (exactRows.length) {
  return [toResult(exactRows[0])];
}

const stopwords = ['the','a','an','is','are','do','does','did','i','my','me','to','of','for','in','on','at','and','or','how','what','when','where','why','can','get','many','much','you','your','need','about'];
const needleWords = topicInput
  .toLowerCase()
  .replace(/[^a-z0-9\s_]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length >= 3 && stopwords.indexOf(w) === -1);

let bestRow = null;
let bestScore = 0;
for (const row of allRows) {
  const haystack = ((row.topic || '') + ' ' + (row.title || '') + ' ' + (row.body || '')).toLowerCase();
  let score = 0;
  for (const w of needleWords) {
    const occurrences = haystack.split(w).length - 1;
    score = score + occurrences;
  }
  if (score > bestScore) {
    bestScore = score;
    bestRow = row;
  }
}

if (bestRow && bestScore > 0) {
  return [toResult(bestRow)];
}

return [{
  json: {
    policy_topic: topicInput || null,
    title: null,
    answer: null,
    source_document: null,
    status: 'Not Found'
  }
}];
"""
T = "Policy Lookup Trigger"
save("policy-lookup.json", "OnboardAI - Policy Lookup Engine (Logic)", [
    exec_trigger(T, ["topic"]),
    data_table_get("Get Policy By Topic", POLICIES, "topic", T, "topic", (224, 0)),
    data_table_get("Get All Policies", POLICIES, "topic", T, "topic", (448, 0), condition="isNotEmpty"),
    code("Compute Policy Answer", POLICY_JS, (672, 0)),
], main_conn([(T, "Get Policy By Topic"), ("Get Policy By Topic", "Get All Policies"), ("Get All Policies", "Compute Policy Answer")]),
    "Exact topic match, then keyword-scored fallback over the OnboardAI Policies Data Table. Returns policy + Google Drive source link.", "0S2phE22QitULuk9")

# ---------------- Onboarding Progress Engine ----------------
PROGRESS_JS = r"""const employeeRows = $('Get Employee Row').all().map(i => i.json).filter(r => r.employeeId);
const taskRows = $('Get Task Rows').all().map(i => i.json).filter(r => r.employeeId);
const documentRows = $('Get Document Rows').all().map(i => i.json).filter(r => r.employeeId);
const employeeId = $('Onboarding Progress Trigger').item.json.employee_id;

if (!employeeRows.length) {
  return [{
    json: {
      employee_id: employeeId,
      employee_name: null,
      completion_percentage: null,
      status: 'Not Found',
      completed: 0,
      pending: 0,
      overdue: 0,
      blockers: [],
      next_priorities: [],
      bgv_status: null,
      payroll_status: null,
      reason: 'No onboarding record found for employee_id "' + employeeId + '".'
    }
  }];
}

const employee = employeeRows[0];
const todayISO = $now.toISODate();
const priorityRank = { high: 0, medium: 1, low: 2 };
const isOverdue = (t) => t.status !== 'done' && t.dueDate < todayISO;

const completedTasks = taskRows.filter(t => t.status === 'done');
const overdueTasks = taskRows.filter(isOverdue);
const pendingTasks = taskRows.filter(t => t.status !== 'done' && !isOverdue(t));
const totalTasks = taskRows.length;
const completionPercentage = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

const missingDocs = documentRows.filter(d => d.status === 'missing');
const underReviewDocs = documentRows.filter(d => d.status === 'under_review');

const blockers = [];
if (employee.bgvStatus === 'Discrepancy' || employee.bgvStatus === 'Blocked') {
  blockers.push('BGV ' + employee.bgvStatus.toLowerCase() + ' — verification is stalled and needs People Ops / TrustVerify follow-up.');
}
if (employee.payrollStatus === 'Not Started' && employee.bgvStatus !== 'Cleared') {
  blockers.push('Payroll setup cannot start until BGV clears.');
}
for (const d of missingDocs) blockers.push('Missing document: ' + d.documentName);
for (const d of underReviewDocs) blockers.push('Document under review: ' + d.documentName);
for (const t of overdueTasks) blockers.push('Overdue task (' + t.priority + ' priority, due ' + t.dueDate + '): ' + t.taskName);

const prioritized = [...overdueTasks, ...pendingTasks].sort((a, b) => {
  const overdueA = isOverdue(a) ? 0 : 1;
  const overdueB = isOverdue(b) ? 0 : 1;
  if (overdueA !== overdueB) return overdueA - overdueB;
  const prA = priorityRank[a.priority] ?? 3;
  const prB = priorityRank[b.priority] ?? 3;
  if (prA !== prB) return prA - prB;
  return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
});
const nextPriorities = prioritized.slice(0, 3).map(t => t.taskName + ' (due ' + t.dueDate + (isOverdue(t) ? ', overdue' : '') + ')');

let status;
if (completionPercentage === 100 && employee.bgvStatus === 'Cleared' && employee.payrollStatus === 'Active') {
  status = 'Complete';
} else if (employee.bgvStatus === 'Discrepancy' || employee.bgvStatus === 'Blocked') {
  status = 'Blocked';
} else if (overdueTasks.length > 0 || missingDocs.length > 0 || underReviewDocs.length > 0) {
  status = 'Needs Attention';
} else {
  status = 'On Track';
}

return [{
  json: {
    employee_id: employee.employeeId,
    employee_name: employee.employeeName,
    completion_percentage: completionPercentage,
    status,
    completed: completedTasks.length,
    pending: pendingTasks.length,
    overdue: overdueTasks.length,
    blockers,
    next_priorities: nextPriorities,
    bgv_status: employee.bgvStatus,
    payroll_status: employee.payrollStatus
  }
}];
"""
T = "Onboarding Progress Trigger"
save("onboarding-progress.json", "OnboardAI - Onboarding Progress Engine (Logic)", [
    exec_trigger(T, ["employee_id"]),
    data_table_get("Get Employee Row", EMPLOYEES, "employeeId", T, "employee_id", (224, 0)),
    data_table_get("Get Task Rows", TASKS, "employeeId", T, "employee_id", (448, 0)),
    data_table_get("Get Document Rows", DOCS, "employeeId", T, "employee_id", (672, 0)),
    code("Compute Onboarding Status", PROGRESS_JS, (896, 0)),
], main_conn([(T, "Get Employee Row"), ("Get Employee Row", "Get Task Rows"), ("Get Task Rows", "Get Document Rows"), ("Get Document Rows", "Compute Onboarding Status")]),
    "Given employee_id, computes completion %, status, blockers and next priorities from the OnboardAI Data Tables.", "Y0QrAkmB5sG9b0K6")
