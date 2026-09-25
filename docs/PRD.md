# PRD — OnboardAI: AI Employee Pre-boarding & Onboarding Command Center

| | |
|---|---|
| Company | Aarohan Technologies (fictional, capstone) |
| Owner | Amol Parbat |
| Version | 1.0 — 25 Sep 2026 (capstone submission) |
| Status | Demo / MVP |

## 1. Problem
Onboarding is spread across many tools and people:
- offer and document collection,
- background verification (BGV) and payroll setup,
- policy documents in a shared drive,
- welcome emails and orientation invites sent by hand.

This causes three problems:
- **People Ops time goes into repetitive work.** They answer the same policy questions and chase status by hand.
- **New hires get inconsistent answers.** Generic HR bots answer confidently but not from *Aarohan's* actual policies.
- **Managers can't see what is blocked.** A BGV discrepancy or a missing bank form isn't noticed until payroll is delayed.

## 2. Objective
Give People Ops and managers one command center that:
1. welcomes each new hire in a personal, consistent way (email + calendar invite for virtual roles),
2. answers policy questions **only** from company policy, citing the source and showing confidence,
3. shows onboarding progress and blockers for each hire, and
4. escalates sensitive topics to a human instead of answering.

**Success measures for the demo:**
- All 4 MCP tools can be called from the UI.
- 0 secrets in the browser or in the repo.
- Every policy answer shows its source.
- Sensitive questions are always escalated.

## 3. Users
| User | Need |
|---|---|
| People Ops coordinator (primary) | Welcome hires, track progress, answer policy questions fast |
| Hiring manager | "Is my new hire ready for Day 1? What's blocking them?" |
| New hire (secondary, via the assistant) | Quick, trustworthy policy answers |

## 4. User journeys
1. **Welcome a hire.** Dashboard → New Hire Welcome → pick or add a hire → *Generate* (Groq drafts the note) → *Send* (MCP sends a Gmail email and, for virtual roles, a Calendar invite) → the dashboard shows "Sent".
2. **Answer a policy question.** Policy Assistant → type a question or click a chip:
   - *Quick Lookup* returns the exact policy + Drive link.
   - *Policy Intelligence* returns a RAG answer with confidence and source section.
3. **Check progress.** Onboarding Progress → pick a hire → see %, status, pending/completed tasks, blockers and next priorities.
4. **Ask the assistant.** Type "How is EMP-1003 doing?" → Groq calls `get_onboarding_status` → the reply lists blockers → "Tools used" shows the MCP call.
5. **Sensitive question.** "Can I get a salary hike?" → the question is escalated to People Ops and no LLM answer is given.

## 5. Features & functional requirements
| ID | Requirement | Priority |
|---|---|---|
| F1 | Dashboard cards: new hires, average progress, pending tasks, a policy assistant shortcut, and a new-hire table | Must |
| F2 | Add a new hire (name, email, department, role, joining date, virtual flag). A default task checklist is created. | Must |
| F3 | Generate a personalised welcome note (Groq) | Must |
| F4 | Send the welcome email via MCP. Create a calendar event only if the role is virtual. Record it in Supabase. | Must |
| F5 | Policy Lookup via MCP, with a source link | Must |
| F6 | Policy Intelligence via MCP, with confidence, similarity and human-review flag, plus a Groq plain-English summary | Must |
| F7 | Onboarding progress via MCP, with a Supabase fallback for hires added in the app | Must |
| F8 | Chat assistant using Groq tool-calling over the MCP tools, showing which tools were used | Must |
| F9 | Escalate pay, legal, grievance and termination questions | Must |
| F10 | `/api/selftest` health check covering all integrations (no side effects) | Should |
| F11 | Proactive day-3 nudge for incomplete tasks | Could (future) |

## 6. Non-functional requirements
- **Security:** keys only in server env vars; no secrets in git; HTML-escaped output; input validation; RLS enabled.
- **Simplicity:** no framework, no build step, zero npm dependencies, one serverless function.
- **Performance:** a single tool call responds in under ~5 seconds; chat in under ~15 seconds.
- **Usability:** plain English, responsive down to phone width, colours taken from the Aarohan logo.
- **Portability:** the n8n workflows are backed up as JSON and a migration path is documented.

## 7. AI capabilities
| Capability | How |
|---|---|
| Personalised writing | Groq, with a warm-tone system prompt (mirrors the `onboardai-warm-tone` skill) |
| Grounded Q&A | Retrieval over Supabase pgvector + deterministic confidence gating. The LLM only rephrases the evidence. |
| Agentic tool use | A Groq tool-calling loop with 4 tools, up to 4 rounds |
| Guardrails | A keyword escalation check before the LLM runs, plus system-prompt rules for privacy and "never guess" |

## 8. MCP / tool integrations
| MCP server (n8n) | Tool | Side effects |
|---|---|---|
| onboardai-policy-lookup | get_policy | none |
| onboardai-policy-intelligence | answer_policy_question | none |
| onboardai-onboarding-progress | get_onboarding_status | none |
| onboardai-new-hire-welcome | onboard_new_hire | sends a Gmail email, creates a Google Calendar event |

The Cowork side of the capstone uses the same 4 MCP servers plus Gmail, Google Calendar, Google Drive, Supabase, n8n and Render/Netlify connectors. It also includes the **onboardai-concierge** plugin with 5 skills: policy-answers, warm-tone, escalate-sensitive, progress-summary and employee-data-privacy.

## 9. Data sources
- **Supabase:** onboarding_employees, onboarding_tasks, onboarding_activity, policy_documents, policy_chunks (38 chunks, 768-dimension vectors).
- **n8n Data Tables:** Employees, Tasks, Documents, Policies (backed up in `n8n-backup/data-tables/`).
- **Google Drive:** source policy PDFs and markdown, linked in the answers.
- All people and policies are **fictional**.

## 10. Architecture
Browser (static) → Netlify Function `/api/*` → Groq · Supabase REST · n8n MCP servers (Streamable HTTP). See the README for the diagram.

## 11. Security
- `GROQ_API_KEY` is stored as a Netlify secret env var. The Supabase key is also server-side only.
- The MCP endpoints have no authentication. This is acceptable for fictional data (the assignment allows it). Before any real use, add header auth (`MCP_AUTH_HEADER` is already supported).
- The RLS demo policies allow anon read and insert. These must be tightened, and Supabase Auth added, before any real data is used.

## 12. Deployment
Netlify: publish `public/`, functions in `netlify/functions/`, no build command. The env vars are listed in the README. After deploying, check `/api/selftest`.

## 13. Limitations
- n8n trial expiry (backups are done).
- No authentication or roles.
- Employee data is split between n8n Data Tables and Supabase.
- Gemini is used for embeddings inside n8n (the stored vectors depend on it).
- The welcome email template is fixed in n8n; the Groq-written note is shown in the app.

## 14. Future roadmap
1. **Week 1:** Move the 4 tools to Supabase Edge Functions and a single data store.
2. **Week 2:** Supabase Auth with roles (new hire sees only their own record).
3. **Week 3:** Day-3 proactive Slack/email nudges; manager weekly digest (progress-summary skill).
4. **Later:** Document upload with verification status; buddy assignment in Slack; analytics on time-to-productive.
