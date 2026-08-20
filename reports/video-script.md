# Demonstration Video Script

Target length: 7–9 minutes. Record your own screen and voice. Use **PowerShell**, not Command Prompt, for every terminal step below.

## 0:00–0:40 — Identity and scope

Say: “I am Hưng Nguyễn, student ID [state it]. This is HW06. I selected reset-password, apply-coupon, and admin import-products because they do not duplicate my group members.” Show README and the selection table.

## 0:40–1:40 — AI-first evidence

In Chrome, open the three Gemini conversations/screenshots. Show the Pro badge, timestamp audit, requirements-only prompt, corrective follow-up, candidate generation, and correction ledger. Say one concrete correction for each endpoint; do not merely say the answer was good or bad.

## 1:40–2:40 — Human audit and Excel

Open `outputs/hw06/HW06_Test_Cases.xlsx`. Filter Audit_Label to INVALID and INCOMPLETE, explain the reason column, then filter Origin to Student extension. Show ≥5 student-added rows per API and the formula-backed Summary sheet. State that you personally reviewed each row before marking Human_Verified=YES.

## 2:40–4:30 — Generate and run tests

Open **PowerShell** in the repository root and type exactly:

```powershell
npm.cmd install
npm.cmd run generate:postman
npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID
```

Before Enter on the final command, explain that the collection pre-request script injects `X-Student-Id` into every request. After execution, zoom in on a real console line containing the student ID and capture the required screenshot manually. Show the three suite summaries and explain that failed assertions are genuine findings, not a broken runner.

## 4:30–5:40 — Defect evidence

Open the latest Newman HTML reports. Search for R-AI-05, C-AI-01, and I-AI-02/I-AI-40. For each, explain requirement, input, observed response/state, and why the assertion is defensible. Then open the matching GitHub Issues and show attached screenshots.

## 5:40–6:30 — CI/CD

Open GitHub Actions. Show the all-pass mutation-demo commit, then the one-fail commit. Open logs/artifacts and identify the single deliberate sentinel failure. Explicitly distinguish this educational lane from the diagnostic run against the defective SUT.

## 6:30–7:40 — Agent Skill demonstration

Open **PowerShell** and show `skills/eshop-api-test-generator/SKILL.md`. Invoke the installed/local skill in Codex with: “Use $eshop-api-test-generator to generate and audit data-driven cases for POST /api/reset-password from sut/eshop-sut/api_specification.md.” Show its deterministic output and validation. Display your own self-drawn diagram and explain each component and feedback loop.

## 7:40–end — Reproducibility and conclusion

Run `npm.cmd run verify:artifacts`. Show the git log, report PDFs, Excel, Postman collection, Newman HTML, audit, bug report, CI report, and manual checklist. State remaining limitations: expiry requires controlled time, true concurrency needs a parallel runner, and final responsibility is yours.
