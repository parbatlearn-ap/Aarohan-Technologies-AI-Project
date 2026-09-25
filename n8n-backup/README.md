# n8n Workflow Backup — OnboardAI

Backed up **25 Sep 2026** from `aparbatlearn.app.n8n.cloud` (trial ends in about 8 days).
**No credentials, API keys or tokens are in these files.** Every credential is replaced with `"REPLACE_ME - <type>"`.

## What each file is

| File | n8n workflow name | Original ID | MCP endpoint (path) | Tool exposed |
|---|---|---|---|---|
| `policy-lookup-mcp.json` | OnboardAI - Policy Lookup MCP | 9gzB5ufnnosPrS9b | `/mcp/onboardai-policy-lookup` | `get_policy` |
| `policy-lookup.json` | OnboardAI - Policy Lookup Engine (Logic) | 0S2phE22QitULuk9 | — (called by the MCP above) | — |
| `policy-intelligence-mcp.json` | OnboardAI - Policy Intelligence MCP | dP1Gxsv0tGFe6Dww | `/mcp/onboardai-policy-intelligence` | `answer_policy_question` |
| `policy-intelligence.json` | OnboardAI - Policy Intelligence Engine (Logic) | GVPn10p2N8LBXQ4n | — | — |
| `onboarding-progress-mcp.json` | OnboardAI - Onboarding Progress MCP | Ro337tsktn1htrRR | `/mcp/onboardai-onboarding-progress` | `get_onboarding_status` |
| `onboarding-progress.json` | OnboardAI - Onboarding Progress Engine (Logic) | Y0QrAkmB5sG9b0K6 | — | — |
| `new-hire-welcome-mcp.json` | OnboardAI - New Hire Welcome MCP | h4YO9sqOB2o3jG2q | `/mcp/onboardai-new-hire-welcome` | `onboard_new_hire` |
| `new-hire-welcome.json` | OnboardAI - New Hire Welcome Engine (Logic) | ZsmzKDtgO204aioS | — | — |
| `policy-embedding-ingestion.json` | OnboardAI - Policy Embedding Ingestion | BQbUszddFMJ6IhtT | — (manual run) | — |
| `data-tables/*.json` | n8n Data Tables: Employees, Tasks, Documents, Policies | see file | — | — |
| `data-tables/policy-chunks.json` | 8 policy docs + 38 chunks (text only) | — | — | — |

Full URL = `https://aparbatlearn.app.n8n.cloud` + path.

**Pattern:** each capability has two parts:
- a thin **MCP wrapper** (MCP Server Trigger + "Call n8n Workflow Tool"), and
- an **Engine (Logic)** sub-workflow that does the real work.

## How to restore into a new n8n instance

1. **Recreate the Data Tables.** Create 4 Data Tables named `OnboardAI Employees`, `OnboardAI Tasks`, `OnboardAI Documents` and `OnboardAI Policies`. Give each one the columns in its `data-tables/*.json` file (all strings), then import the rows.
2. **Import the Engine workflows first.** Go to Workflows → Import from File and import `policy-lookup.json`, `policy-intelligence.json`, `onboarding-progress.json` and `new-hire-welcome.json`.
3. In each Engine, **re-point every Data Table node** to your new table IDs. The old IDs are `rE0SYvDEpq8ZDGzR` (Employees), `UrT5HV43x3HX6ZvY` (Tasks), `duVEApIHmfhTR5JE` (Documents) and `dnmeCejlY1E7SR3C` (Policies).
4. **Re-attach credentials.** Look for any node showing `REPLACE_ME`:
   - Gmail OAuth2 and Google Calendar OAuth2 (New Hire Welcome).
   - Google Gemini API and Postgres (Policy Intelligence). For Postgres, use the Supabase session-pooler connection string.
5. **Import the 4 `*-mcp.json` wrappers.** In each one, open the tool node and change **Workflow** to the new ID of its Engine.
6. **Activate** the 4 MCP wrappers. The endpoint paths stay the same, so only the hostname changes. Put the new URLs in the app's `MCP_*_URL` environment variables.
7. `policy-embedding-ingestion.json` only needs a re-run if the policy text changes. The embeddings already live in Supabase (`policy_chunks`, 38 rows, 768 dimensions).

## Migration plan away from n8n (after the hackathon)

The goal is to run the same 4 tools on free, permanent infrastructure. Suggested target: **Supabase Edge Functions + Supabase Postgres (pgvector)**.

| Today (n8n) | Target | Notes |
|---|---|---|
| Data Tables (Employees/Tasks/Documents/Policies) | Supabase tables | Employees and tasks are already in `onboarding_employees` / `onboarding_tasks`. Add `onboarding_documents` and `policies`, then load the JSON files in `data-tables/`. |
| Policy Lookup Engine | Edge Function `policy-lookup` or a SQL function | The JS in the "Compute Policy Answer" node ports almost line-for-line. |
| Onboarding Progress Engine | Edge Function `onboarding-progress` | Port "Compute Onboarding Status" and replace `$now` with `new Date()`. `netlify/lib/supabase.mjs → computeProgress()` already has a simplified port. |
| Policy Intelligence Engine | Edge Function + SQL `match_policy_chunks(query_embedding vector(768))` | Keep the "Evidence & Confidence Logic" as-is (`tools/evidence_confidence_logic.js`). The query embedding still needs an embedding API: keep Gemini `gemini-embedding-001` at 768 dims so it matches the stored vectors, or re-embed every chunk with a different model. |
| New Hire Welcome Engine | Edge Function using the Gmail API + Google Calendar API (OAuth refresh token stored as a Supabase secret) | Or a free-tier email API. The calendar invite still needs Google Calendar. |
| MCP Server Trigger | An MCP server on Supabase Edge Functions (e.g. the `mcp-lite` / `@modelcontextprotocol/sdk` streamable-HTTP pattern) exposing the same tool names and arguments | Keeping the tool names means the Netlify app and Cowork need **only a URL change**. |

Order of work: data → Progress → Lookup → Intelligence → Welcome (it has OAuth, so it is the hardest). Test each one with the app's `/api/selftest` endpoint after switching its `MCP_*_URL`.

## Regenerating these files

The `tools/*.py` scripts rebuild every JSON file from the workflow definitions. Run `python3 build_mcp_and_engines.py`, `python3 build_ingestion.py` and `python3 build_data_tables.py`.
