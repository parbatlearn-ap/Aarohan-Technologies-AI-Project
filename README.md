# OnboardAI — AI Employee Pre-boarding & Onboarding Command Center

**Aarohan Technologies** · AI For All 2.0 Cowork Capstone · Use Case 2 (People Ops & Onboarding Concierge)

OnboardAI is a simple web app for People Ops teams and hiring managers. It lets them:
- send a new hire a personalised welcome email, plus a calendar invite if the role is virtual,
- answer policy questions using only Aarohan's real policy documents, and
- see where every new hire stands in onboarding.

Every AI answer comes from a tool: a custom **n8n MCP server** or **Supabase**. The LLM does not answer from its own memory.


## 📄 Project documents (for reviewers)

| Document | View in browser | Editable original |
|---|---|---|
| Presentation (16 slides) | [OnboardAI-Presentation.pdf](OnboardAI-Presentation.pdf) | [docs/OnboardAI-Presentation.pptx](docs/OnboardAI-Presentation.pptx) — click **Download raw file**, open in PowerPoint |
| Product Requirements Document | [docs/PRD.md](docs/PRD.md) | [OnboardAI-PRD.pdf](OnboardAI-PRD.pdf) |
| n8n workflow backups & migration plan | [n8n-backup/README.md](n8n-backup/README.md) | — |
| Screenshots | [docs/screenshots/](docs/screenshots/) | — |

---

## Problem
A new hire's first two weeks involve a dozen scattered things:
- documents, background checks (BGV) and payroll setup,
- policies buried in a shared drive,
- orientation invites nobody remembers to send.

People Ops answers the same questions again and again and chases status by hand. Generic HR bots make this worse: they give confident answers that are wrong for *this* company.

## Solution
One dashboard with four capabilities:

| Capability | What it does | Powered by |
|---|---|---|
| **New Hire Welcome** | Groq drafts a personal note. Clicking Send runs the MCP tool, which emails the hire via **Gmail** and, for virtual roles, creates a **Google Calendar** orientation event. | Groq + `onboard_new_hire` MCP |
| **Policy Lookup** | Returns the exact policy record with a Google Drive source link. | `get_policy` MCP |
| **Policy Intelligence** | Semantic search (RAG) over 38 policy chunks in Supabase pgvector, with confidence and human-review flags. Groq rewrites the evidence into plain English. | `answer_policy_question` MCP + Groq |
| **Onboarding Progress** | Completion %, status, blockers, next priorities, and completed vs pending tasks. | `get_onboarding_status` MCP + Supabase |
| **AI Assistant (chat)** | Groq decides which tool to call (tool-calling loop) and shows which tools it used. Pay, legal, grievance and termination questions are escalated to a human. | Groq + all MCP tools |

## Architecture

```
Browser (public/: HTML + CSS + vanilla JS — no secrets)
   │  fetch /api/*
   ▼
Netlify Function  netlify/functions/api.mjs   (holds all keys in env vars)
   ├── Groq API  (llama-3.3-70b-versatile) — drafting, summarising, tool-calling agent
   ├── Supabase REST — onboarding_employees, onboarding_tasks, onboarding_activity
   └── MCP client (Streamable HTTP) ──► n8n MCP Server Triggers
          ├── onboardai-policy-lookup        → Policy Lookup Engine → n8n Data Table
          ├── onboardai-policy-intelligence  → Gemini embedding → Supabase pgvector → evidence/confidence logic
          ├── onboardai-onboarding-progress  → Employees/Tasks/Documents Data Tables → status rules
          └── onboardai-new-hire-welcome     → Gmail send + Google Calendar event (virtual roles)
```

It is one serverless function with a small router, and there is no build step. The app has **zero npm dependencies** and uses Node's built-in `fetch`.

## Technology stack
- **Frontend:** static HTML/CSS/JavaScript. The colours come from the Aarohan logo.
- **Backend:** Netlify Functions v2 (Node 18+).
- **LLM:** Groq only. There are no fallback providers.
- **Data:** Supabase Postgres (+ pgvector for policy chunks).
- **Tools:** 4 custom n8n MCP servers, backed up as JSON in [`n8n-backup/`](n8n-backup/README.md).
- **Documents:** policy PDFs in Google Drive, linked from the answers.

## Repository layout
```
public/                 index.html, app.js, style.css, logo.png
netlify/functions/api.mjs   all /api routes
netlify/lib/            config.mjs, mcp.mjs (MCP client), groq.mjs (LLM + agent + guardrails), supabase.mjs
tests/                  run-tests.mjs (offline API tests), mocks.mjs, local-server.mjs, screenshots.py, check-secrets.mjs
n8n-backup/             all n8n workflows + data tables as JSON, restore + migration guide
docs/                   PRD.md, OnboardAI-Presentation.pptx, screenshots/
netlify.toml, .env.example
```

## Environment variables
| Name | Required | Notes |
|---|---|---|
| `GROQ_API_KEY` | Yes | Mark it as a **secret** in Netlify. It is read only on the server. |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile`. The live site uses `openai/gpt-oss-120b`. |
| `SUPABASE_URL` | Yes | `https://<project>.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | The anon/publishable key. It is still kept server-side. |
| `MCP_POLICY_LOOKUP_URL`, `MCP_POLICY_INTELLIGENCE_URL`, `MCP_ONBOARDING_PROGRESS_URL`, `MCP_NEW_HIRE_WELCOME_URL` | No | Default to the current n8n cloud endpoints. |
| `MCP_AUTH_HEADER` | No | `Header-Name: value`, used if you add header auth to the MCP triggers. |

## Run locally
1. Install Node 18 or newer.
2. Run the offline tests (they mock Groq, Supabase and n8n; no keys needed): `npm test`
3. Open a local preview with mocked services: `node tests/local-server.mjs`, then go to http://localhost:8888
4. Run locally against the real services:
   - `cp .env.example .env`, then fill in the values.
   - Run `npx netlify-cli dev`, or run `node --env-file=.env tests/local-server.mjs --live`.

## Deploy to Netlify
1. In Netlify, go to **Add new project → Import an existing project → GitHub** and pick this repository. If the `aarohan-onboardai` project already exists, go to *Project configuration → Build & deploy → Link repository* instead.
2. Build settings are read from `netlify.toml`: publish `public`, functions `netlify/functions`, and no build command.
3. Under **Project configuration → Environment variables**, add `GROQ_API_KEY` (secret), `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4. Deploy. Then open `https://<site>.netlify.app/api/selftest`. It checks Supabase, all 4 MCP servers and Groq, and it **does not** send any email.
5. Make sure visitor access is not locked to your Netlify team (*Project configuration → Access & security*) so reviewers can open the site.

## MCP integrations
| Endpoint | Tool | Arguments | Returns |
|---|---|---|---|
| `…/mcp/onboardai-policy-lookup` | `get_policy` | `topic` | policy_topic, title, answer, source_document, status |
| `…/mcp/onboardai-policy-intelligence` | `answer_policy_question` | `question` | answer, source_document, source_section, similarity, confidence, human_review_required |
| `…/mcp/onboardai-onboarding-progress` | `get_onboarding_status` | `employee_id` | completion_percentage, status, counts, blockers, next_priorities |
| `…/mcp/onboardai-new-hire-welcome` | `onboard_new_hire` | employee_id, employee_name, email, isVirtual, department, role_title, joining_date, welcome_message | email_status, calendar_status, overall_status |

The app speaks MCP directly (`netlify/lib/mcp.mjs`). Each call runs initialize → notifications/initialized → tools/call over Streamable HTTP, and the client handles both JSON and SSE responses. The same endpoints are also added to Claude Cowork as custom connectors.

## Supabase usage
- `onboarding_employees`, `onboarding_tasks`: the new-hire list and task checklist. The app can add new hires.
- `onboarding_activity`: an audit log of welcomes sent and chat tool usage.
- `policy_documents`, `policy_chunks` (pgvector, 768 dimensions): used by the Policy Intelligence MCP through the SQL function `match_policy_chunks` ([`supabase/match_policy_chunks.sql`](supabase/match_policy_chunks.sql)).
- Progress for a hire who exists only in Supabase (added through the app) is calculated in the function using the same rules as the MCP engine. The page labels which source was used.

## Groq integration
- `POST /api/welcome/preview` drafts the personalised welcome note.
- `POST /api/policy` (intelligence mode) turns the retrieved evidence into a plain-English answer. It only runs when the MCP returns a confident answer.
- `POST /api/chat` is a tool-calling agent. It can call up to 4 tool rounds, then gives its final answer.

## Security
- The Groq key and Supabase key exist only in Netlify environment variables. The browser never receives them, and `/api/health` reports only true/false for each.
- `.env` is git-ignored. `.env.example` contains variable names only. `npm run check-secrets` scans the repo for key patterns.
- The n8n backups have all credentials stripped.
- Input is validated: employee IDs must match `EMP-\d+` and question length is capped. All output is HTML-escaped in the browser.
- Guardrails: questions about pay, legal matters, grievances or termination are escalated to a human and never answered by the LLM. The assistant is told never to share one employee's data with another employee.
- RLS is on for every table. The demo policies allow the anon role to read and insert onboarding data (fictional data only). **Tighten these before using real employee data.**

## Known limitations
- The n8n cloud trial ends in about 8 days. The workflows are backed up and a migration plan is written up.
- The MCP endpoints have no authentication (the course allows this). Only fictional data is exposed.
- There is no user login. Anyone with the URL can view the fictional demo data and trigger welcome emails.
- The progress MCP reads n8n Data Tables. New hires added in the app use a Supabase-based calculation until the data is unified.
- Policy Intelligence uses Gemini embeddings inside n8n, because the stored vectors were made with that model. Groq is the only *chat* LLM.
- There is no Slack or task-tool connector in the web app itself. Those are used through Cowork.

## Future improvements
- Move the MCP tools to Supabase Edge Functions (see [`n8n-backup/README.md`](n8n-backup/README.md)).
- Add login (Supabase Auth) with roles: new hire, manager, People Ops.
- Send a day-3 proactive nudge (scheduled function) to hires with incomplete tasks.
- Add a Slack welcome and buddy assignment. Let new hires upload documents.

See [`docs/PRD.md`](docs/PRD.md) for the full product requirements.
