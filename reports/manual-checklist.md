# Mandatory Human Review and Manual Completion Checklist

Do not submit until every unchecked item is completed personally.

- [x] Confirm the student name (**Nguyễn Đình Thái Hưng**) and exact student ID (**23127373**).
- [x] Rerun in **PowerShell** from `E:\HCMUS\Sem9\Software Testing\HW06\HW06-software-testing`: `npm.cmd run test:api -- --student-id 23127373`.
- [x] Personally inspect every Excel row; update the `Human_Verified` column from `NO` to `YES` only after review.
- [x] In **PowerShell** at `E:\HCMUS\Sem9\Software Testing\HW06\HW06-software-testing`, run `npm.cmd run test:api:reset -- --student-id 23127373`, capture a real line `[HW06 pre-request] X-Student-Id: 23127373`, and save it as `evidence/screenshots/09-console-x-student-id-23127373.png`. This anti-cheat evidence must not be AI-generated.
- [ ] Open each latest Newman HTML report and spot-check hostname `127.0.0.1:3000`, case IDs, failures, and timestamps. Automated consistency is already verified; this checkbox is the student's visual confirmation.
- [ ] Approve making the GitHub repository public, then verify no secrets/personal email are committed.
- [x] Create the ten GitHub Issues; link the real, matching screenshot in each and preserve URLs in `reports/github-issues.json` and `reports/bug-reports.md`.
- [x] Verify both CI demonstration commits; preserve Actions links and screenshots in `reports/ci-cd-report.md`.
- [x] Review the Agent Skill diagram against the design checklist, export it as a valid PNG, and keep the editable Mermaid source.
- [ ] Read the prompts/outputs in `reports/ai-audit.md`; confirm they match the Gemini chat and that no private email remains.
- [x] Optional video decision: **declined by the student; no video will be submitted**.
- [x] Self-assessed grade selected: **100**. Final ZIP filename: `23127373_HW06_AI_API_100.zip`.
- [ ] Open the generated PDFs and Excel file, verify the ZIP contains every mandatory artifact, then submit it on Moodle.

Source of truth: [submission-status.json](./submission-status.json). Only the student may change fields under `studentOnlyGates` to completed.
