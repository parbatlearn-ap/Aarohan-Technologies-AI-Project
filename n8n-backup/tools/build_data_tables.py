# Exports the n8n Data Tables used by the engines (fictional demo data, no secrets).
import json, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'data-tables')
E = [("EMP-1001","Sarah Sharma","In Progress","Not Started","2026-09-28","BGV",None,None),
     ("EMP-1002","Priya Nair","Cleared","Active","2026-09-01","First 2 Weeks",None,None),
     ("EMP-1003","Arjun Verma","Discrepancy","Not Started","2026-09-15","BGV",None,None),
     ("EMP-2001","Devika Rao","Cleared","Not Started","2026-09-29","Pre-boarding","parbat.learn@gmail.com","1"),
     ("EMP-2002","Karan Mehta","Cleared","Not Started","2026-09-29","Pre-boarding","parbat.learn@gmail.com","0")]
employees = [dict(zip(["employeeId","employeeName","bgvStatus","payrollStatus","joiningDate","currentPhase","email","isVirtual"], r)) for r in E]
T = """EMP-1001|Accept offer letter|done|high|2026-09-08
EMP-1001|Submit education certificates|done|high|2026-09-12
EMP-1001|Submit bank details form for payroll|pending|high|2026-09-19
EMP-1001|Upload updated address proof|in_progress|high|2026-09-20
EMP-1001|Confirm remote equipment shipping address|pending|medium|2026-09-23
EMP-1001|Schedule manager intro call|pending|medium|2026-09-22
EMP-1002|Accept offer letter|done|high|2026-08-20
EMP-1002|Complete Day-1 orientation|done|high|2026-09-01
EMP-1002|Complete timesheet training|done|medium|2026-09-05
EMP-1002|Enroll in benefits|done|medium|2026-09-10
EMP-1002|Prepare for First 2 Weeks check-in|pending|low|2026-09-25
EMP-1003|Accept offer letter|done|high|2026-08-25
EMP-1003|Submit education certificates|done|medium|2026-09-01
EMP-1003|Resolve BGV discrepancy with TrustVerify|pending|high|2026-09-16
EMP-1003|Submit bank details form for payroll|pending|high|2026-09-18
EMP-1003|Confirm remote equipment shipping address|pending|low|2026-09-25
EMP-2001|Accept offer letter|done|high|2026-09-20
EMP-2001|Submit identity documents|done|high|2026-09-24
EMP-2001|Submit bank details form for payroll|pending|high|2026-09-27
EMP-2001|Complete VPN / remote access setup|pending|medium|2026-09-28
EMP-2001|Attend virtual orientation|pending|medium|2026-09-29
EMP-2002|Accept offer letter|done|high|2026-09-20
EMP-2002|Submit identity documents|pending|high|2026-09-26
EMP-2002|Submit bank details form for payroll|pending|high|2026-09-27
EMP-2002|Collect ID badge on Day 1|pending|medium|2026-09-29"""
tasks = [dict(zip(["employeeId","taskName","status","priority","dueDate"], l.split("|"))) for l in T.splitlines()]
D = """EMP-1001|Identity proof (Aadhaar)|complete
EMP-1001|Identity proof (PAN)|complete
EMP-1001|Education certificates|complete
EMP-1001|Previous employment relieving letter|complete
EMP-1001|Photograph|complete
EMP-1001|Address proof (updated)|under_review
EMP-1001|Bank details form|missing
EMP-1002|Identity proof (Aadhaar)|complete
EMP-1002|Identity proof (PAN)|complete
EMP-1002|Education certificates|complete
EMP-1002|Bank details form|complete
EMP-1002|Address proof|complete
EMP-1003|Identity proof (Aadhaar)|complete
EMP-1003|Identity proof (PAN)|complete
EMP-1003|Education certificates|under_review
EMP-1003|Previous employment relieving letter|missing
EMP-1003|Bank details form|missing"""
docs = [dict(zip(["employeeId","documentName","status"], l.split("|"))) for l in D.splitlines()]
P = [("remote_work","Remote Work Policy","Aarohan Technologies operates a hybrid-first model. Employees may work remotely up to 3 days per week; the remaining 2 days require in-office presence on the team's designated anchor days. Fully remote arrangements require Director-level approval and are reviewed quarterly. Remote work requires a stable internet connection (min 20 Mbps) and availability during core hours (10:00-16:00 IST). Employees must be reachable on Slack and attend all scheduled meetings via video. Equipment (laptop, monitor) is provided by IT; home-office stipend of INR 3,000/month is available on submission of receipts. Remote work privileges may be suspended for performance or attendance issues at manager discretion.","Aarohan_Remote_Work_Policy_v2.3.pdf"),
("time_off","Time Off / Leave Policy","Aarohan Technologies provides 18 days of Paid Time Off (PTO) per calendar year, accrued monthly at 1.5 days/month, plus 12 public holidays and 7 sick days (non-carry-forward). Unused PTO up to 5 days may be carried forward to the next year; anything beyond is forfeited on Dec 31. Leave requests must be submitted via the HR portal at least 5 working days in advance for planned leave; sick leave may be reported same-day to the reporting manager. Maternity leave is 26 weeks paid; paternity leave is 2 weeks paid. Bereavement leave is 5 days for immediate family. Unapproved absences beyond 2 consecutive days without manager sign-off are treated as Leave Without Pay (LWP) and may trigger HR review.","Aarohan_Leave_Policy_v4.1.pdf"),
("benefits","Benefits Enrollment Policy","All full-time employees are eligible for benefits enrollment starting Day 1, with coverage effective from the first day of the following month. The open enrollment window runs annually from November 1-15; changes outside this window require a qualifying life event (marriage, birth, adoption, loss of other coverage) reported within 30 days. Aarohan Technologies covers group health insurance (employee + 4 dependents, INR 5,00,000 sum insured), term life insurance (5x annual CTC), and accidental disability cover. Optional add-ons include parental health cover and OPD reimbursement (INR 15,000/year), enrolled and paid via payroll deduction. Enrollment is completed through the Benefits Portal; employees who do not enroll within 30 days of eligibility default to the Standard Health Plan only.","Aarohan_Benefits_Enrollment_Policy_v1.8.pdf"),
("working_hours","Working Hours Policy","Standard working hours at Aarohan Technologies are 9:00 AM to 6:00 PM IST, Monday through Friday, with a mandatory 1-hour lunch break and core collaboration hours of 10:00 AM-4:00 PM during which all employees must be available. Total expected weekly hours are 40, exclusive of breaks. Flexible start times between 8:00-10:00 AM are permitted with manager approval, provided 8 hours are logged daily. Overtime for non-exempt roles must be pre-approved by the reporting manager and is compensated at 1.5x the hourly rate or via compensatory time off, employee's choice. Time tracking is mandatory via the Aarohan Timesheet tool; unlogged hours for 3+ consecutive days trigger an automated HR follow-up.","Aarohan_Working_Hours_Policy_v2.0.pdf"),
("grievance","Employee Grievance / Escalation Policy","Aarohan Technologies maintains a 3-tier grievance resolution process. Tier 1: raise the concern directly with your reporting manager, who must acknowledge within 2 business days and respond with a resolution plan within 7 business days. Tier 2: if unresolved or the concern involves the manager, escalate to HR Business Partner via the confidential Grievance Portal or grievance@aarohantech.example; HR must respond within 5 business days and convene a review within 10 business days. Tier 3: unresolved or serious matters (harassment, discrimination, ethics violations) go to the Employee Relations Committee, which investigates and issues a final decision within 15 business days. Retaliation against anyone raising a grievance in good faith is strictly prohibited and is itself grounds for disciplinary action. All grievance records are kept confidential and accessible only to HR and the Employee Relations Committee.","Aarohan_Grievance_Escalation_Policy_v1.5.pdf")]
policies = [dict(zip(["topic","title","body","sourceDocument"], p)) for p in P]
for name, rows, table_id in [("employees", employees, "rE0SYvDEpq8ZDGzR"), ("tasks", tasks, "UrT5HV43x3HX6ZvY"), ("documents", docs, "duVEApIHmfhTR5JE"), ("policies", policies, "dnmeCejlY1E7SR3C")]:
    json.dump({"n8nDataTable": f"OnboardAI {name.title()}", "originalId": table_id, "rows": rows}, open(os.path.join(OUT, f"{name}.json"), "w"), indent=2, ensure_ascii=False)
    print("wrote data-tables/%s.json (%d rows)" % (name, len(rows)))
