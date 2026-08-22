# HW06 - AI-First API Testing

This repository contains the complete, auditable testing pipeline for three EShop APIs:

| Pool | Requirement | Endpoint |
| --- | --- | --- |
| A | FR-03 Password reset | `POST /api/reset-password` |
| B | FR-09 Apply coupon | `POST /api/apply-coupon` |
| C | FR-16 Import products | `POST /api/admin/import-products` |

Key artifacts: [main report](reports/main-report.md), [AI audit](reports/ai-audit.md), [Excel test cases](outputs/hw06/HW06_Test_Cases.xlsx), [bug reports](reports/bug-reports.md), [CI/CD report](reports/ci-cd-report.md), and [video script](reports/video-script.md).

CI evidence: [all-pass demonstration](https://github.com/z3nz3nn/HW06-software-testing/actions/runs/32405131238) and [one-failing-case mutation](https://github.com/z3nz3nn/HW06-software-testing/actions/runs/32405318145).

## Student declaration

- Student: **Nguyễn Đình Thái Hưng**
- Student ID: **23127373**
- AI declaration: I use AI tools for requirements analysis, candidate test generation, critique, and automation assistance. Every generated candidate is audited and the final responsibility remains with the student.

## Current status

The evidence-backed pipeline is complete through the official local Newman execution with `X-Student-Id: 23127373`. The repository remains private because changing it to Public is the final, separately confirmed action. Personal row review, the real console screenshot, self-drawn diagram, video, self-assessed score, ZIP inspection, and Moodle submission remain student-only gates.

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

## Self-assessment

| No. | Criteria | Maximum | Self-assessed | Evidence status |
| --- | --- | ---: | ---: | --- |
| 1 | API 1 full pipeline | 30 | STUDENT_DECISION_REQUIRED | Official pipeline/evidence complete; personal review/public visibility pending |
| 2 | API 2 full pipeline | 30 | STUDENT_DECISION_REQUIRED | Official pipeline/evidence complete; personal review/public visibility pending |
| 3 | API 3 full pipeline | 30 | STUDENT_DECISION_REQUIRED | Official pipeline/evidence complete; personal review/public visibility pending |
| 4 | Agent Skill | 10 | STUDENT_DECISION_REQUIRED | Skill validated; self-drawn diagram/video pending |
|  | **Total** | **100** | **STUDENT_DECISION_REQUIRED** | Student must choose an honest grade |

## Commands

```powershell
npm.cmd install
npm.cmd run generate:postman
npm.cmd run test:api -- --student-id 23127373
npm.cmd run verify:artifacts
```

The test runner starts a fresh local EShop backend, executes all three data-driven Newman runs, and writes CLI, JSON, JUnit, and HTML evidence under `evidence/newman/`.
