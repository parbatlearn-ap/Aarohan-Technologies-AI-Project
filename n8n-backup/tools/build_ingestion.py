from _common import *
import json

DOCS = [("employee_handbook", "Employee Handbook", "1PAUKAy1-Qbex5hOKPACxPjhUtH4BRl26"),
        ("preboarding_documentation_policy", "Pre-boarding & Documentation Policy", "1-GIwXc_qwLTwLwdMDw_fPo0Jw_Hxxif4"),
        ("bgv_policy", "Background Verification (BGV) Policy", "1BbqnmLanNj21hpreNU5FYA5swZk5uwd2"),
        ("payroll_benefits_policy", "Payroll & Benefits Policy", "1lPl7qaAX2fHu3sb2qH4LjZnLjXjk685f"),
        ("remote_work_policy", "Remote Work Policy", "1JDajHPe0Sh747NopoJFd5YZnbHlQNs1l"),
        ("day1_office_policy", "Day-1 / Office Policy", "1kdMzakCVY3bALTutrdYWF77EqV67gD0l"),
        ("it_security_policy", "IT & Security Policy", "1Rnc-Pw_iZPlipG5-6LMUmIfKLcWrlhNI"),
        ("leave_policy", "Leave Policy", "1pzf0vp7vYm_o1uQgEpHGGNqDJBy5i9_p")]
TITLE = {d: t for d, t, _ in DOCS}
DRIVE = {d: f for d, _, f in DOCS}

# (chunk_id, document_id, section, body)
C = [
("e17a1902-edda-5e20-a4ef-9d64fd526651","employee_handbook","1. Welcome","Welcome to Aarohan Technologies. This handbook summarizes the basic expectations,\nconduct standards, and resources available to all employees, whether office-based\nor remote."),
("1ab2af5f-e722-5bb1-9346-04a7420f841f","employee_handbook","2. Working Hours","Standard working hours are 9:30 AM–6:30 PM IST, Monday to Friday, with flexibility\nfor remote employees to align with team meeting schedules."),
("4622ca4c-cacf-5263-8826-a4352f2efde3","employee_handbook","3. Code of Conduct","All employees are expected to act with integrity, treat colleagues respectfully,\nand avoid conflicts of interest. A signed Code of Conduct Acknowledgment\n(REQ-COMP-02) is required during onboarding."),
("27e97b07-da9c-53ff-9dd2-23c07257858f","employee_handbook","4. Confidentiality","Employees must protect confidential company and customer information at all times.\nA signed NDA (REQ-COMP-03) is a mandatory onboarding requirement."),
("91046430-dcfc-54fe-87d3-226928d171d5","employee_handbook","5. Probation Period","New employees serve a 90-day probation period, during which structured 30-60-90 day\ncheck-ins are held with their manager and People Ops partner."),
("fb6b4a40-1b4e-55ac-b441-b231a92c2ed5","employee_handbook","6. Grievance Process","Employees can raise concerns with their People Ops partner or through the (fictional)\ninternal Aarohan People Portal. All concerns are handled confidentially."),
("5b1b8ad9-f338-5874-ba8a-b21f2506d44b","employee_handbook","7. Related Policies","See also: Pre-boarding & Documentation Policy, BGV Policy, Payroll & Benefits Policy,\nRemote Work Policy, Day-1/Office Policy, IT & Security Policy, and Leave Policy."),
("bd54aa4d-6156-5443-94dd-b329ba214d31","preboarding_documentation_policy","1. Purpose","Defines the documents every new hire must submit before or on their joining date,\nand the timeline for doing so."),
("2c8632a6-2c50-58ca-b46d-4bed442475b2","preboarding_documentation_policy","2. Standard Timeline","Pre-boarding begins immediately after offer acceptance and should conclude by the\njoining date (typically a 15-day window). Documents are grouped into the categories\ndefined in `data/onboarding/onboarding_requirements.json`: Personal Information,\nIdentity Documents, Education, Current Employment, Previous Employment,\nPayroll/Bank Information, PF/UAN, Benefits/Insurance, and Compliance."),
("7d950f8a-9b8e-527a-af20-5fc2e7e31072","preboarding_documentation_policy","3. Fresher vs. Experienced Hire","- **Freshers** are not required to submit Current/Previous Employment documents\n  (REQ-CUR-*, REQ-PREV-*) or a UAN (REQ-PF-01), since they have no prior employment.\n- **Experienced hires** must submit all Current Employment documents, and Previous\n  Employment documents if they have more than one prior employer."),
("6e460ba3-c2f1-50a6-b069-a95def597496","preboarding_documentation_policy","4. Escalation","If a mandatory document is not submitted within 3 business days of its due date,\nthe assigned People Ops partner sends a reminder. If still outstanding within\n2 business days of the joining date, the case is escalated to the People Ops\nManager, and the joining date review is flagged."),
("0dd098eb-4224-543b-a427-948f0fbd565a","preboarding_documentation_policy","5. Document Review Statuses","Each submitted document is tracked as one of: **Complete**, **Missing**,\n**Under Review** (submitted but flagged for clarification), or **Incomplete\nInformation** (partially submitted, e.g. some but not all required pages/months)."),
("aca4e32a-3997-5b66-83a0-2b0d0734646b","bgv_policy","1. Purpose","All new hires undergo background verification (BGV) before or shortly after\njoining, run by our fictional third-party vendor, **TrustVerify Screening\nServices**."),
("47045b4c-c88a-54a1-b32d-85a8ae2a7eb9","bgv_policy","2. Scope","- **Experienced hires**: employment history verification (current and previous\n  employers), education verification, and identity verification.\n- **Freshers**: education verification and identity verification only."),
("a498282f-a32b-57ab-86ef-2f0030eb9acb","bgv_policy","3. Process","1. Employee signs the BGV Consent Form (REQ-COMP-01).\n2. TrustVerify Screening Services requests supporting documents (relieving\n   letters, experience certificates, payslips, education certificates).\n3. TrustVerify cross-checks dates and details across documents.\n4. Any discrepancy (e.g., mismatched employment dates, mismatched names across\n   documents) is flagged as **Under Review** and escalated to the assigned\n   People Ops partner.\n5. BGV is marked **Completed** only when all checks pass with no open flags."),
("6dc8f725-2a64-5c03-9f54-624b8c7fa903","bgv_policy","4. Discrepancy Handling","A flagged discrepancy does not automatically block employment, but it does:\n\n- Pause final BGV sign-off until resolved.\n- Get logged as a follow-up task owned by People Ops.\n- Get escalated to the People Ops Manager if unresolved for more than 10\n  business days after joining."),
("70a1e381-30df-541d-90a9-2c82f996b8dc","bgv_policy","5. Payroll Interaction","If BGV is unresolved past the second payroll cycle, Finance flags the employee's\npayroll file for review, but continues to run payroll unless directed otherwise\nby People Ops leadership."),
("8391cb94-dd38-53d1-b736-573101322754","payroll_benefits_policy","1. Payroll Cycle","Salary is credited monthly, on the last working day of each month, via bank\ntransfer."),
("1017e9d1-19e1-5659-b51e-14a81281608f","payroll_benefits_policy","2. Requirements to Set Up Payroll","Payroll cannot be configured for a new hire until:\n\n- Bank Account Details Form (REQ-PAY-01) is submitted and verified.\n- Bank Proof (REQ-PAY-02) is submitted.\n- PF Nomination Form (REQ-PF-02) is submitted (all employees).\n- UAN Number (REQ-PF-01) is submitted, for experienced hires with prior PF history.\n\nIf any of the above is missing by the joining date, the employee's first payroll\ncycle is delayed until the following cycle."),
("1356987a-93b6-5db4-92b0-972de8d5ee41","payroll_benefits_policy","3. Benefits Enrollment","All employees are enrolled in the group health insurance plan through\n**SecureHealth Insurance** (fictional provider) after submitting the Health\nInsurance Enrollment Form (REQ-BEN-01). Dependent details (REQ-BEN-02) are\noptional and can be added at any time during the year."),
("3345ad1d-78ba-543b-ba35-10c7cf32cec6","payroll_benefits_policy","4. Compensation Confidentiality","Compensation details are confidential between the employee, People Ops, and\nFinance, and are not shared with managers unless required for approvals."),
("1576b334-9c37-5bed-9e07-c91d5da23290","remote_work_policy","1. Remote Hub Cities","Aarohan Technologies currently supports fully remote employees based in three hub\ncities: Bangalore, Hyderabad, and Mumbai. These cities have no physical Aarohan\noffice; employees work from home or a co-working space of their choice."),
("997663bc-571b-5eba-9cfd-e808f476fc50","remote_work_policy","2. Onboarding Differences for Remote Hires","Remote hires complete the same document and compliance requirements as office\nhires, with these differences:\n\n- IT ships a laptop and accessories to the employee's registered address instead\n  of handing it over in person.\n- VPN / Remote Access Setup (REQ-IT-03) is mandatory (not required for office\n  hires, who connect via the office network).\n- HR Induction, Manager 1:1, and Team Introduction (REQ-DAY1-01 to 03) are held\n  virtually instead of in person.\n- Workstation/Desk Setup (REQ-DAY1-04) does not apply."),
("fdc18861-2e68-55e7-95f3-46bdc7ed7aab","remote_work_policy","3. Equipment","Remote employees are responsible for a stable internet connection. Aarohan\nprovides a laptop, headset, and a one-time home-office setup allowance\n(amount defined separately by Finance, not detailed in this fictional dataset)."),
("934e2481-56c8-5bb3-a521-7e723e9d5ead","remote_work_policy","4. Working Hours & Availability","Remote employees are expected to be reachable during core hours (11:00 AM–4:00 PM\nIST) for team collaboration, with flexibility outside that window."),
("caa30150-2077-556f-8557-124e12ae2d39","day1_office_policy","1. Office Location","Aarohan Technologies' only physical office is at the Pune Headquarters. Employees\nbased there are expected onsite on Day 1 and follow the standard office schedule\nthereafter (hybrid flexibility is decided team-by-team, not detailed in this\nfictional dataset)."),
("a4d9f2f0-a54b-57cc-b0c4-414d39b27113","day1_office_policy","2. Day-1 Schedule (Office-Based Hires)","1. Check-in with People Ops, ID badge issuance.\n2. Workstation / Desk Setup (REQ-DAY1-04).\n3. HR Induction session (REQ-DAY1-01).\n4. Manager 1:1 (REQ-DAY1-02).\n5. Team Introduction (REQ-DAY1-03)."),
("8f96ae32-32b2-5c35-a264-eb9a25cbc0ab","day1_office_policy","3. Day-1 Schedule (Remote Hires)","Remote hires follow the same four sessions (HR Induction, Manager 1:1, Team\nIntroduction, plus an IT setup call) held virtually — see the Remote Work Policy\nfor details. Desk setup does not apply."),
("1dc3a756-0660-5c22-8bfb-38f8fed6dd2f","day1_office_policy","4. Rescheduling","If a new hire's Day 1 falls on a company holiday or the assigned People Ops\npartner is unavailable, HR reschedules the induction session within 2 business\ndays and notifies the employee's manager."),
("2766b503-084e-53d1-b8f9-57046ef9a8d9","it_security_policy","1. Asset Provisioning","Every new hire is issued a company laptop (REQ-IT-01) and company email plus core\nsystem access (REQ-IT-02) before or on Day 1. Office-based hires receive their\nlaptop in person; remote hires receive it by courier (see Remote Work Policy)."),
("0f263d10-c793-5fbf-8ae2-03e2e01ceb3c","it_security_policy","2. Access Control","System access follows least-privilege by default: employees receive access only\nto the systems required for their role, expanded on request with manager approval."),
("1e77a20b-3556-5362-8f6d-015e1146f978","it_security_policy","3. VPN & Remote Access","Remote employees must complete VPN / Remote Access Setup (REQ-IT-03) before\naccessing internal systems. Office employees connect via the office network and\ndo not require VPN setup for standard access."),
("475674a8-d3c4-5c7b-bacc-a3e40dfe7e25","it_security_policy","4. Acceptable Use","Company laptops and accounts are for business use. Employees must not share\ncredentials, install unauthorized software, or store confidential company data on\npersonal devices."),
("d54ec00b-5e5f-5bb4-9692-22f90c0d167e","it_security_policy","5. Offboarding Note","(Out of scope for this onboarding-focused dataset — included here only for\ncompleteness of the fictional policy set.) Asset return and access revocation are\nhandled by IT within 1 business day of an employee's last working day."),
("b0181bff-bd1b-5a64-8de5-80aabf10de48","leave_policy","1. Leave Types","- **Casual Leave**: 12 days/year, for short personal needs.\n- **Sick Leave**: 10 days/year, for illness or medical appointments.\n- **Earned/Privilege Leave**: 15 days/year, accrued monthly, for planned time off.\n- **Public Holidays**: as per the Aarohan holiday calendar (not detailed in this\n  fictional dataset)."),
("0d147975-b468-5cca-95f2-713c381000bb","leave_policy","2. Accrual During Onboarding","New hires start accruing Earned Leave from their joining date and can use Casual\nor Sick Leave from Day 1, subject to manager approval."),
("770f2944-2fae-58ff-98da-0a201141ac50","leave_policy","3. Applying for Leave","Leave requests are submitted through the (fictional) internal Aarohan People\nPortal and require manager approval. Sick leave of 3+ consecutive days requires a\nmedical note."),
("aa4e196e-329b-5ab2-ac15-f3a24c04281e","leave_policy","4. Leave During Probation","New hires may take leave during their 90-day probation period, but are encouraged\nto coordinate with their manager to minimize disruption to early onboarding\nmilestones (30-60-90 day check-ins)."),
]
assert len(C) == 38, len(C)
chunks = [{"chunk_id": cid, "document_id": d, "document_name": d + ".md", "drive_file_id": DRIVE[d], "section": s,
           "chunk_text": f"Aarohan Technologies — Aarohan Technologies — {TITLE[d]} (Fictional)\nSection: {s}\n\n{body}"} for cid, d, s, body in C]
docs = [{"document_id": d, "document_name": d + ".md", "drive_file_id": f} for d, _, f in DOCS]

with open(os.path.join(OUT, "data-tables", "policy-chunks.json"), "w") as f:
    json.dump({"documents": docs, "chunks": chunks}, f, indent=2, ensure_ascii=False)

QUERIES = [("Q1", "What happens if a background verification discrepancy is found after I have already joined?"),
           ("Q2", "How many days of leave do I get during my probation period?"),
           ("Q3", "What equipment will I receive if I am a remote hire?"),
           ("Q4", "What is the Day-1 schedule for office-based new hires?"),
           ("Q5", "Who should I escalate to if my pre-boarding documents are delayed?")]

def normalize_js(src_node, fields):
    lines = "\n".join(f"const {v} = $('{src_node}').item.json.{k};" for k, v in fields)
    out = ",\n    ".join(f"{k}: {v}" for k, v in fields)
    return ("const embeddingObj = $json.embedding || {};\nconst nativeValues = embeddingObj.values || [];\nconst nativeDim = nativeValues.length;\n\n"
            "let sumSq = 0;\nfor (const v of nativeValues) { sumSq += v * v; }\nconst norm = Math.sqrt(sumSq);\n"
            "const normalized = norm > 0 ? nativeValues.map((v) => v / norm) : nativeValues;\n\n" + lines +
            "\n\nreturn {\n  json: {\n    " + out + ",\n    native_dimension: nativeDim,\n    embedding_vector_literal: '[' + normalized.join(',') + ']'\n  }\n};")

from build_welcome_intel import gemini  # reuse node builder
nodes = [
    {"id": "start", "name": "Start Ingestion", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [0, 0], "parameters": {}},
    code("Prepare 8 Documents", "const documents = " + json.dumps(docs, indent=2, ensure_ascii=False) + ";\n\nreturn documents.map((d) => ({ json: d }));", (224, -160)),
    code("Prepare 38 Chunks", "const chunks = " + json.dumps(chunks, indent=2, ensure_ascii=False) + ";\n\nreturn chunks.map((c) => ({ json: c }));", (224, 40)),
    gemini("Call Gemini Embed API - Chunks", "$json.chunk_text", (448, 40), batching=True),
    code("Normalize Chunk Embeddings", normalize_js("Prepare 38 Chunks", [("chunk_id", "chunkId"), ("document_id", "documentId"), ("section", "section"), ("chunk_text", "chunkText")]), (672, 40), mode="runOnceForEachItem"),
    code("Prepare 5 Test Queries", "const queries = " + json.dumps([{"query_id": q, "query_text": t} for q, t in QUERIES], indent=2) + ";\n\nreturn queries.map((q) => ({ json: q }));", (224, 240)),
    gemini("Call Gemini Embed API - Queries", "$json.query_text", (448, 240), batching=True),
    code("Normalize Query Embeddings", normalize_js("Prepare 5 Test Queries", [("query_id", "queryId"), ("query_text", "queryText")]), (672, 240), mode="runOnceForEachItem"),
]
save("policy-embedding-ingestion.json", "OnboardAI - Policy Embedding Ingestion", nodes,
     main_conn([("Start Ingestion", "Prepare 8 Documents"), ("Start Ingestion", "Prepare 38 Chunks"), ("Start Ingestion", "Prepare 5 Test Queries"),
                ("Prepare 38 Chunks", "Call Gemini Embed API - Chunks"), ("Call Gemini Embed API - Chunks", "Normalize Chunk Embeddings"),
                ("Prepare 5 Test Queries", "Call Gemini Embed API - Queries"), ("Call Gemini Embed API - Queries", "Normalize Query Embeddings")]),
     "Embeds 8 docs / 38 chunks + 5 test queries via Gemini (768-dim), normalizes. Supabase writes run outside n8n.", "BQbUszddFMJ6IhtT")
