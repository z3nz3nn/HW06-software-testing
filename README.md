# HW06 - AI-First API Testing

This repository contains the complete, auditable testing pipeline for three EShop APIs:

| Pool | Requirement | Endpoint |
| --- | --- | --- |
| A | FR-03 Password reset | `POST /api/reset-password` |
| B | FR-09 Apply coupon | `POST /api/apply-coupon` |
| C | FR-16 Import products | `POST /api/admin/import-products` |

Repository: [https://github.com/z3nz3nn/HW06-software-testing](https://github.com/z3nz3nn/HW06-software-testing) (kept private until the student's final public step).

Key artifacts: [main report](reports/main-report.md), [AI critique](reports/ai-critique.md), [AI audit](reports/ai-audit.md), [Excel test cases](outputs/hw06/HW06_Test_Cases.xlsx), [bug reports](reports/bug-reports.md), [10 GitHub Issues](reports/github-issues.json), [CI/CD report](reports/ci-cd-report.md), and [submission status](reports/submission-status.json). The optional video was explicitly declined.

CI evidence: [all-pass demonstration](https://github.com/z3nz3nn/HW06-software-testing/actions/runs/32405131238) and [one-failing-case mutation](https://github.com/z3nz3nn/HW06-software-testing/actions/runs/32405318145).

## Student declaration

- Student: **Nguyễn Đình Thái Hưng**
- Student ID: **23127373**
- AI declaration: I use AI tools for requirements analysis, candidate test generation, critique, and automation assistance. Every generated candidate is audited and the final responsibility remains with the student.

## Current status

The evidence-backed pipeline is complete through the official local Newman execution with `X-Student-Id: 23127373`, ten GitHub Issues, and the required CI all-pass/one-fail demonstration pair. The repository remains private because changing it to Public is the final, separately confirmed action. The optional video is declined, the self-assessed score is 100/100, all 158 Excel rows are personally reviewed, and both the real console screenshot and reviewed diagram export are present. Visual Newman/Audit confirmation, ZIP inspection, and Moodle submission remain student-only gates. The synchronized source of truth is [submission-status.json](reports/submission-status.json).

## Test summary (official local run)

| Metric | Reset password | Apply coupon | Import products | Total |
| --- | ---: | ---: | ---: | ---: |
| APIs | 1 | 1 | 1 | 3 |
| AI candidates retained in ledger | 42 | 44 | 56 | 142 |
| Student-added cases | 6 | 5 | 5 | 16 |
| Executed cases | 48 | 49 | 61 | 158 |
| Passed | 35 | 36 | 42 | 113 |
| Failed | 13 | 13 | 19 | 45 |
| Genuine bug candidates | 3 | 3 | 4 | 10 |

The counts above come from the official run using `X-Student-Id: 23127373`. Failures are preserved as genuine defect evidence.

## Submission contents map

| Requirement | Artifact | Current state |
| --- | --- | --- |
| Main report, Markdown + PDF | `reports/main-report.md`, `outputs/hw06/HW06_Main_Report.pdf` | Complete; PDF includes the full 267-word AI Critique |
| Public repository link | Repository URL above | Private by instruction; public is the final student step |
| Postman + Newman HTML | `postman/`, three latest `2026-08-22` HTML reports under `evidence/newman/` | Complete and automatically reconciled |
| CI/CD report and two runs | `.github/workflows/api-tests.yml`, `reports/ci-cd-report.md`, screenshots 04–07 | Complete and live-checked in GitHub |
| Excel test cases + summary | `outputs/hw06/HW06_Test_Cases.xlsx` | Complete; all 158 rows personally reviewed and signed off |
| Agent Skill diagram + pseudocode | `docs/agent-skill-diagram.mmd`, `docs/agent-skill-diagram.png`, `docs/agent-skill-pseudocode.md` | Complete; valid PNG export visually checked and editable source retained |
| Bug report + issue screenshots | `reports/bug-reports.md`, issue index/drafts, screenshots `bug-01`–`bug-10` | Complete; 10 open issues live-checked |
| AI Critique + Audit, Markdown + PDF | `reports/ai-critique.md`, `reports/ai-audit.md`, `outputs/hw06/HW06_AI_Audit_Report.pdf` | Complete; personal transcript confirmation pending |
| Git commit log | `reports/git-commit-log.txt` | Exported; at most the final synchronization commit may follow it |
| README self-assessment + summary | This file | Summary complete; self-assessed grade 100/100 |
| Supporting material | Gemini screenshots/transcripts and reusable skill | Complete; optional video declined |

## Self-assessment

| No. | Criteria | Maximum | Self-assessed | Evidence status |
| --- | --- | ---: | ---: | --- |
| 1 | API 1 full pipeline | 30 | 30 | Official pipeline/evidence and personal row review complete; final public visibility pending |
| 2 | API 2 full pipeline | 30 | 30 | Official pipeline/evidence and personal row review complete; final public visibility pending |
| 3 | API 3 full pipeline | 30 | 30 | Official pipeline/evidence and personal row review complete; final public visibility pending |
| 4 | Agent Skill | 10 | 10 | Reusable skill, pseudocode, and reviewed diagram export complete; video is optional and declined |
|  | **Total** | **100** | **100** | Selected by the student; ZIP name: `23127373_HW06_AI_API_100.zip` |

## Commands

```powershell
npm.cmd install
npm.cmd run generate:postman
npm.cmd run test:api -- --student-id 23127373
npm.cmd run verify:artifacts
npm.cmd run verify:submission
```

The test runner starts a fresh local EShop backend, executes all three data-driven Newman runs, and writes CLI, JSON, JUnit, and HTML evidence under `evidence/newman/`. `verify:artifacts` validates all automatable evidence while allowing explicit student-only gates; `verify:submission` fails until every final gate is truthfully complete.
