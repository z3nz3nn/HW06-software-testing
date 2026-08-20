import fs from "node:fs";
import path from "node:path";
import { resetCases, couponCases, importCases } from "./case-definitions.mjs";

const root = process.cwd();
const summaryPath = path.join(root, "evidence/newman/dry-run-summary.json");
const resultSummary = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath, "utf8")) : null;
const studentName = "Hưng Nguyễn";
const studentId = process.env.STUDENT_ID || "HUMAN_REVIEW_REQUIRED";
const suites = [
  { key: "reset-password", label: "Pool A — FR-03 Password reset", endpoint: "POST /api/reset-password", cases: resetCases, prefix: "R" },
  { key: "apply-coupon", label: "Pool B — FR-09 Discount coupon", endpoint: "POST /api/apply-coupon", cases: couponCases, prefix: "C" },
  { key: "import-products", label: "Pool C — FR-16 Product import", endpoint: "POST /api/admin/import-products", cases: importCases, prefix: "I" },
];

function write(relative, content) {
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${content.trim()}\n`);
}

function countBy(cases, key) {
  return cases.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function mdTable(headers, rows) {
  const esc = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", "<br>");
  return [
    `| ${headers.map(esc).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(esc).join(" | ")} |`),
  ].join("\n");
}

const selectionRows = [
  ["A", "FR-03", "POST /api/reset-password", "Not selected by any listed friend"],
  ["B", "FR-09", "POST /api/apply-coupon", "Not selected by any listed friend"],
  ["C", "FR-16", "POST /api/admin/import-products", "Not selected by any listed friend"],
];

const countRows = suites.map((suite) => {
  const audits = countBy(suite.cases, "auditLabel");
  const run = resultSummary?.suites?.[suite.key]?.caseSummary || {};
  return [
    suite.endpoint,
    suite.cases.filter((item) => item.origin === "Gemini Pro candidate").length,
    audits.VALID || 0,
    audits.INVALID || 0,
    audits.INCOMPLETE || 0,
    audits.STUDENT_ADDED || 0,
    run.total ?? "pending",
    run.passed ?? "pending",
    run.failed ?? "pending",
  ];
});

const coverageRows = [
  ["reset-password", "email, resetToken, newPassword", "OTP active/reissued/old/used/email-bound", "SEC-01, SEC-05, SEC-07; SQLi; leakage", "Malformed/missing/null/type/extra fields"],
  ["apply-coupon", "code, total_amount, user_id, JWT", "active/expired/disabled/usage threshold", "SEC-02; missing/invalid/expired JWT; IDOR", "Required numeric fields, formula and error stability"],
  ["import-products", "auth and every product property", "commit/rollback, mixed batches, concurrency", "FR-12/SEC-03 role gate; SQL/XSS literals; leakage", "Top-level and row schema, malformed JSON, duplicate keys"],
];

const findings = [
  ["BUG-01", "Critical", "Authentication", "Passwords are stored in plaintext and login returns the full user record including password/reset_token/locked_until.", "R-H-05, R-H-06"],
  ["BUG-02", "High", "Password reset", "Reset accepts weak, missing, null, empty, and numeric passwords, contrary to FR-01.", "R-AI-05..10, R-AI-35..38"],
  ["BUG-03", "High", "OTP lifecycle", "Forgot-password generates only four digits and stores no expiry timestamp; SEC-07 cannot be met.", "Source review + R-AI-15"],
  ["BUG-04", "Critical", "Coupon authorization", "Apply-coupon has no JWT gate and trusts body user_id, enabling identity substitution and usage-limit bypass.", "C-AI-02..06, C-AI-08..09"],
  ["BUG-05", "High", "Coupon formula", "Percent discount uses total × (1 − discount_value), yielding negative discounts and inflated final totals.", "C-AI-01, C-AI-19, C-AI-34"],
  ["BUG-06", "Medium", "Coupon boundary", "Minimum-order check uses > instead of >=, rejecting exact threshold values.", "C-AI-18, C-AI-21, C-AI-22"],
  ["BUG-07", "Critical", "Admin authorization", "Import-products authenticates a JWT but never enforces role=admin.", "I-AI-02, I-AI-56"],
  ["BUG-08", "High", "Import validation", "Rows validate only truthy name; invalid price/category/name-length values are inserted.", "I-AI-21..33, I-H-04"],
  ["BUG-09", "High", "Import atomicity", "Mixed-invalid batches partially commit instead of rolling back the whole batch.", "I-AI-40..42, I-AI-51, I-H-01"],
  ["BUG-10", "Medium", "Error handling", "Malformed JSON and null rows expose Express/Node stack details.", "R-AI-40, C-AI-40, I-AI-45, I-H-01"],
];

const mainReport = `
# HW06 — AI-First API Testing Report

## Submission identity

- Student: **${studentName}** *(human review required)*
- Student ID: **${studentId}**
- SUT: EShop at \`http://127.0.0.1:3000\`
- Evidence status: **${studentId === "HUMAN_REVIEW_REQUIRED" ? "DRYRUN-NOT-SUBMISSION — rerun with the official student ID" : "official local run"}**

## 1. API selection and collision check

${mdTable(["Pool", "Requirement", "Chosen endpoint", "Collision check"], selectionRows)}

The selection deliberately avoids all nine endpoints reported by the three friends: login, checkout, admin order status, product listing, cart, admin coupon creation, registration, order cancelation, and category creation.

## 2. Method

For each endpoint I used a phased AI-first workflow: requirements decomposition → ambiguity correction → candidate generation → human audit → at least five student-added cases → data-driven Postman/Newman execution. Gemini was not allowed to inspect the implementation before generating candidates. Follow-up prompts explicitly corrected invented assumptions and unusable oracles. Full verbatim evidence is indexed in [ai-audit.md](./ai-audit.md).

The executable oracle distinguishes normative rules from unspecified behavior. \`ACCEPT/APPLY/COMMIT\` and \`REJECT/ROLLBACK\` cases assert requirements. \`OBSERVE\` cases assert only safety/stability and remain marked INCOMPLETE when the specification does not permit a binary verdict.

## 3. Test inventory and dry-run result

${mdTable(["API", "AI candidates", "VALID", "INVALID", "INCOMPLETE", "Student-added", "Executed", "Passed", "Failed"], countRows)}

The current 158-case result is a controlled dry run using \`X-Student-Id: DRYRUN-NOT-SUBMISSION\`. Its 113 passing and 45 failing cases are not fabricated “green” evidence: failures are preserved because they reveal requirement violations. An official rerun must replace this evidence after the real student ID is supplied.

## 4. Coverage

${mdTable(["API", "Domain partitions", "State transitions", "Security", "Schema validation"], coverageRows)}

The reset suite covers 42 AI candidates plus 6 extensions. Coupon uses 45 generated candidates, removes one invalid concurrency candidate, corrects three invalid candidates, and executes 44 corrected AI rows plus 5 extensions. Import uses 48 initial candidates plus 8 corrective supplemental candidates and 5 extensions. This keeps all three endpoints above the ≥35 target after audit.

## 5. Human audit decisions

- VALID: a traceable requirement and executable oracle exist.
- INVALID: the proposed case cannot establish its precondition or contradicts the endpoint contract; it is retained in the audit ledger but excluded or converted before execution.
- INCOMPLETE: useful exploratory input, but the specification leaves the expected result ambiguous; assertions are conservative.
- STUDENT_ADDED: a security, protocol, metamorphic, state, or white-box risk missed by Gemini.

Every row contains its label and reason in the Excel workbook and canonical [case-definitions.mjs](../scripts/case-definitions.mjs). Manual student sign-off remains required before submission; automated generation is not represented as personal review.

## 6. Postman/Newman implementation

Used features: collection folders; collection/environment/local variables; pre-request scripts; automatic \`X-Student-Id\` injection; dynamic unique users; bearer-token variables; data-driven JSON iterations; request chaining; setup/teardown fixtures; response-schema/formula/security assertions; CLI, JSON, JUnit, and HTML reporters. The local fixture API is limited to otherwise unreachable preconditions such as exact OTPs, coupon states, usage counts, and database snapshots. It is not the target API.

Not claimed: cloud workspace collaboration, Postman Monitor, or a hosted mock server. They are optional examples in the brief and were not necessary for deterministic local execution.

Reproduce from **PowerShell** in the repository root:

\`\`\`powershell
npm.cmd install
npm.cmd run generate:postman
npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID
npm.cmd run verify:artifacts
\`\`\`

## 7. Genuine defects

${mdTable(["ID", "Severity", "Area", "Finding", "Evidence cases"], findings)}

Detailed reproduction steps, expected/actual results, and evidence references are in [bug-reports.md](./bug-reports.md). Source inspection supports root-cause analysis; the Newman failures remain the black-box evidence.

## 8. CI/CD

The workflow in [api-tests.yml](../.github/workflows/api-tests.yml) installs dependencies, regenerates artifacts, starts the local SUT, runs Newman, and uploads reports. The required all-pass versus one-fail pair is implemented as an explicit mutation-demonstration lane, separate from the diagnostic lane that preserves real SUT failures. Links and screenshots require the public GitHub push and are marked in [ci-cd-report.md](./ci-cd-report.md).

## 9. Agent Skill

The reusable skill under [skills/eshop-api-test-generator](../skills/eshop-api-test-generator/) decomposes specifications, classifies normative versus observational oracles, generates ≥35 candidates, audits them, adds human-risk prompts, and emits canonical rows/Postman data. Pseudocode is provided. The final diagram is intentionally not generated by AI because the brief explicitly requires it to be self-drawn; [agent-skill-diagram-HUMAN-REVIEW.md](../docs/agent-skill-diagram-HUMAN-REVIEW.md) is only a checklist for the student's own drawing.

## 10. Limitations and mandatory human review

OTP expiry and true concurrency need controlled time/parallel facilities not exposed by the published API. The student must supply identity, personally review/sign off rows, take the non-fabricated console screenshot, draw the diagram, record/upload the video, approve repository visibility and GitHub Issues, select the self-assessed grade, create the final ZIP, and submit it on Moodle. See [manual-checklist.md](./manual-checklist.md).

## 11. AI declaration

I use AI tools for requirements analysis, test-candidate generation, critique, automation assistance, and report scaffolding. Full prompts, outputs, timestamps, corrections, and evidence paths are disclosed. Final correctness and submission responsibility remain with the student.
`;

const bugSections = findings.map(([id, severity, area, title, evidence]) => `
## ${id} — ${title}

- Severity: **${severity}**
- Area: ${area}
- Evidence cases: ${evidence}
- Environment: EShop backend, Node.js, SQLite, \`http://127.0.0.1:3000\`

### Steps to reproduce

1. From PowerShell in the repository root, run \`npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID\`.
2. Open the matching latest HTML report under \`evidence/newman/\`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See \`evidence/newman/dry-run-summary.json\` and the endpoint HTML report. The current files are labeled dry-run until the real \`X-Student-Id\` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**
`).join("\n");

const bugReport = `
# Genuine Bug Reports

These reports separate test-oracle failures from test-harness failures. Each defect is supported by repeatable black-box evidence; source inspection is used only to explain the likely cause. GitHub Issue creation is deferred until the student approves the representational action and public-repository change.

${bugSections}
`;

const critique = `
# AI Critique (200–300 words)

Gemini was productive at decomposing parameters and proposing broad candidate pools, but its first answers showed why AI output cannot be used as an oracle without review. For password reset, it introduced RFC 5322 as if the specification required it, implied unlisted special characters were forbidden, and invented exact status-code expectations. For coupons, it assumed applying a coupon increments usage even though the endpoint only calculates a discount; it also under-specified the trust boundary between the JWT identity and the body user_id. For product import, it mixed frontend CSV-parser concerns with the JSON API, treated SQL-looking literals as invalid input, and proposed fault-injection and concurrency cases without executable preconditions. These failures came from three causes: the model filled specification gaps with common conventions, optimized for an impressive list rather than testability, and did not initially distinguish a normative requirement from an observational question.

Follow-up prompts improved the result because they named each faulty assumption and demanded a correction ledger. I retained incomplete cases only when their assertions could be limited to stability, security, or state observation; invalid cases were removed or replaced. The student-added cases then targeted null rows, authorization before processing, identity substitution, information disclosure, protocol behavior, and atomic rollback—risks the generic generation phase missed.

The main lesson is that collaboration with AI needs an evidence hierarchy: authoritative requirements first, explicit ambiguity second, executable preconditions third, and implementation observations last. A large case count is not quality by itself. Each case needs traceability, a defensible oracle, isolation, and a recorded audit decision. AI is best used as a fast hypothesis generator; responsibility for correctness remains human.
`;

const transcriptSpecs = [
  ["Password reset", "reset-password"],
  ["Apply coupon", "apply-coupon"],
  ["Import products", "import-products"],
];

const auditIndex = transcriptSpecs.map(([label, slug]) => {
  const meta = JSON.parse(fs.readFileSync(path.join(root, `evidence/gemini/${slug}-timestamps.json`), "utf8"));
  const rows = meta.prompts.map((prompt) => [
    prompt.id,
    prompt.sentAtUtc,
    new Date(prompt.sentAtUtc).toLocaleString("en-CA", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }),
    prompt.responseCompletedAtUtc,
  ]);
  return `### ${label}\n\n${mdTable(["Interaction", "Sent UTC", "Sent Asia/Ho_Chi_Minh", "Response completed UTC"], rows)}\n\n- Verbatim prompt + output: [${slug}-session.txt](../evidence/gemini/${slug}-session.txt)\n- Timestamp metadata: [${slug}-timestamps.json](../evidence/gemini/${slug}-timestamps.json)`;
}).join("\n\n");

const transcriptAppendix = transcriptSpecs.map(([label, slug]) => {
  const transcript = fs.readFileSync(path.join(root, `evidence/gemini/${slug}-session.txt`), "utf8").trim();
  return `## Verbatim transcript — ${label}\n\n\`\`\`text\n${transcript.replaceAll("```", "` ` `")}\n\`\`\``;
}).join("\n\n");

const auditReport = `
# AI Audit Report

## Declaration

I use AI tools for requirements analysis, candidate test generation, correction, and automation/report scaffolding. The browser session used **Google Gemini Pro**, signed in as ${studentName}; the email address is deliberately redacted. Local automation assistance used OpenAI Codex and is disclosed in the main report. All Gemini interactions below include tool, time, prompt, and complete output.

## Session index

${auditIndex}

## Review trail

- Reset follow-up corrected invented status codes, arbitrary maximum-password assumptions, RFC 5322 overreach, and the OTP state model.
- Coupon follow-ups separated exact schema from observations, rejected floating values where the SUT contract uses currency integers, made authentication gating explicit, and corrected the false “apply consumes usage” assumption.
- Import follow-ups separated frontend CSV parsing from the JSON API, clarified response-count and atomicity semantics, kept SQL literals valid, and added eight supplemental candidates for missed partitions.
- Final executable audit labels and reasons are stored per row in the Excel workbook and \`scripts/case-definitions.mjs\`.

Screenshots: \`evidence/screenshots/01-gemini-reset-candidates.png\`, \`02-gemini-coupon-correction.png\`, and \`03-gemini-import-correction.png\`.

${transcriptAppendix}
`;

const ciReport = `
# CI/CD Report

## Pipeline design

GitHub Actions uses Windows/Ubuntu-compatible Node commands to install the root runner and SUT dependencies, regenerate the collection/data, execute Newman against \`127.0.0.1\`, and upload HTML/JUnit/summary artifacts. The workflow file is \`.github/workflows/api-tests.yml\`.

The **diagnostic** lane preserves genuine SUT assertion failures and always uploads evidence. The **mutation demonstration** lane exists solely to satisfy the assignment's two-commit learning demonstration without mislabeling a defective SUT as compliant: the baseline commit expects its deliberate sentinel assertion to pass; the mutation commit changes exactly one sentinel expectation so exactly one test fails.

## Required run pair

${mdTable(["Run", "Commit/link", "Expected result", "Screenshot"], [
  ["All-pass demonstration", "HUMAN_REVIEW_REQUIRED_AFTER_PUSH", "All mutation-demo cases pass", "HUMAN_REVIEW_REQUIRED_AFTER_ACTIONS_RUN"],
  ["One-fail mutation", "HUMAN_REVIEW_REQUIRED_AFTER_PUSH", "Exactly one deliberate sentinel failure", "HUMAN_REVIEW_REQUIRED_AFTER_ACTIONS_RUN"],
])}

## Human review

The repository is currently private and empty on GitHub. Changing visibility, pushing, and creating representational evidence must be approved/performed before links can be finalized. Do not claim the mutation lane proves the unmodified SUT passes; the diagnostic Newman reports are the authoritative product-quality result.
`;

const manualChecklist = `
# Mandatory Human Review and Manual Completion Checklist

Do not submit until every unchecked item is completed personally.

- [ ] Confirm the student name (**${studentName}**) and provide the exact student ID.
- [ ] Rerun in **PowerShell** from \`${root}\`: \`npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID\`.
- [ ] Personally inspect every Excel row; update the \`Human_Verified\` column from \`NO\` to \`YES\` only after review.
- [ ] Take the required real console screenshot showing the pre-request log/header \`X-Student-Id: YOUR_REAL_STUDENT_ID\`. This anti-cheat evidence must not be fabricated or AI-generated.
- [ ] Open each latest Newman HTML report and spot-check hostname \`127.0.0.1:3000\`, case IDs, failures, and timestamps.
- [ ] Approve making the GitHub repository public, then verify no secrets/personal email are committed.
- [ ] Approve/create the ten GitHub Issues; attach the real, matching screenshot to each and paste URLs into \`reports/bug-reports.md\`.
- [ ] Trigger/verify both CI demonstration commits; paste Actions links and screenshots into \`reports/ci-cd-report.md\`.
- [ ] Draw the Agent Skill diagram yourself from the design checklist. Export it as PNG and keep the editable source. Do not use an AI-generated diagram.
- [ ] Read the prompts/outputs in \`reports/ai-audit.md\`; confirm they match the Gemini chat and that no private email remains.
- [ ] Record the video yourself using \`reports/video-script.md\`, upload to YouTube, and add the link to README/report.
- [ ] Choose the honest self-assessed grade (000–100), complete the README table, and name the ZIP \`<StudentID>_HW06_AI_API_<Grade>.zip\`.
- [ ] Open the generated PDFs and Excel file, then verify the ZIP contains every mandatory artifact before Moodle submission.
`;

const videoScript = `
# Demonstration Video Script

Target length: 7–9 minutes. Record your own screen and voice. Use **PowerShell**, not Command Prompt, for every terminal step below.

## 0:00–0:40 — Identity and scope

Say: “I am ${studentName}, student ID [state it]. This is HW06. I selected reset-password, apply-coupon, and admin import-products because they do not duplicate my group members.” Show README and the selection table.

## 0:40–1:40 — AI-first evidence

In Chrome, open the three Gemini conversations/screenshots. Show the Pro badge, timestamp audit, requirements-only prompt, corrective follow-up, candidate generation, and correction ledger. Say one concrete correction for each endpoint; do not merely say the answer was good or bad.

## 1:40–2:40 — Human audit and Excel

Open \`outputs/hw06/HW06_Test_Cases.xlsx\`. Filter Audit_Label to INVALID and INCOMPLETE, explain the reason column, then filter Origin to Student extension. Show ≥5 student-added rows per API and the formula-backed Summary sheet. State that you personally reviewed each row before marking Human_Verified=YES.

## 2:40–4:30 — Generate and run tests

Open **PowerShell** in the repository root and type exactly:

\`\`\`powershell
npm.cmd install
npm.cmd run generate:postman
npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID
\`\`\`

Before Enter on the final command, explain that the collection pre-request script injects \`X-Student-Id\` into every request. After execution, zoom in on a real console line containing the student ID and capture the required screenshot manually. Show the three suite summaries and explain that failed assertions are genuine findings, not a broken runner.

## 4:30–5:40 — Defect evidence

Open the latest Newman HTML reports. Search for R-AI-05, C-AI-01, and I-AI-02/I-AI-40. For each, explain requirement, input, observed response/state, and why the assertion is defensible. Then open the matching GitHub Issues and show attached screenshots.

## 5:40–6:30 — CI/CD

Open GitHub Actions. Show the all-pass mutation-demo commit, then the one-fail commit. Open logs/artifacts and identify the single deliberate sentinel failure. Explicitly distinguish this educational lane from the diagnostic run against the defective SUT.

## 6:30–7:40 — Agent Skill demonstration

Open **PowerShell** and show \`skills/eshop-api-test-generator/SKILL.md\`. Invoke the installed/local skill in Codex with: “Use $eshop-api-test-generator to generate and audit data-driven cases for POST /api/reset-password from sut/eshop-sut/api_specification.md.” Show its deterministic output and validation. Display your own self-drawn diagram and explain each component and feedback loop.

## 7:40–end — Reproducibility and conclusion

Run \`npm.cmd run verify:artifacts\`. Show the git log, report PDFs, Excel, Postman collection, Newman HTML, audit, bug report, CI report, and manual checklist. State remaining limitations: expiry requires controlled time, true concurrency needs a parallel runner, and final responsibility is yours.
`;

const diagramChecklist = `
# Agent Skill Diagram — Human Drawing Checklist

**Do not submit this file as the diagram.** The assignment explicitly requires a self-drawn diagram. Use this only as a completeness checklist, then make your own design decisions and draw/export the final PNG manually.

Include, in your own layout and wording:

1. Inputs: API specification, FR/SEC rules, selected endpoint, execution environment.
2. Requirement decomposer: parameters, equivalence partitions, boundaries, states, security, schema.
3. Ambiguity gate: normative oracle vs observational oracle vs human clarification.
4. Candidate generator: ≥35 rows, traceability IDs, prerequisites, request, expected result.
5. Audit loop: VALID / INVALID / INCOMPLETE with reason and correction.
6. Human-extension gate: at least five missed risks.
7. Emitters: canonical JSON, Postman collection/data, Excel, audit ledger.
8. Runner: fixture isolation → SUT → Newman → HTML/JUnit/compact summary.
9. Feedback: failed requirement assertion → bug candidate → reproduce/triage → GitHub issue.
10. Human sign-off boundaries: identity evidence, row review, issue publication, self-drawn diagram, video/submission.

Add arrows that make the correction loop and human decision points unambiguous. Put your name/date on the editable source and export a PNG.
`;

write("reports/main-report.md", mainReport);
write("reports/bug-reports.md", bugReport);
write("reports/ai-critique.md", critique);
write("reports/ai-audit.md", auditReport);
write("reports/ci-cd-report.md", ciReport);
write("reports/manual-checklist.md", manualChecklist);
write("reports/video-script.md", videoScript);
write("docs/agent-skill-diagram-HUMAN-REVIEW.md", diagramChecklist);

const pipelineMeta = {
  "reset-password": { prompts: "RESET-P1 → RESET-P2 → RESET-P3", generated: 42, note: "The correction phase removed invented status-code and email-grammar assumptions before generation." },
  "apply-coupon": { prompts: "COUPON-P1 → COUPON-P2 → COUPON-P3 → COUPON-P4", generated: 45, note: "The final correction ledger excluded one unusable concurrency case and corrected usage-state assumptions." },
  "import-products": { prompts: "IMPORT-P1 → IMPORT-P2 → IMPORT-P3 → IMPORT-P4", generated: 48, note: "The final correction ledger added eight supplemental candidates after detecting omitted JSON/API partitions." },
};

for (const suite of suites) {
  const meta = pipelineMeta[suite.key];
  const audits = countBy(suite.cases, "auditLabel");
  const aiCases = suite.cases.filter((item) => item.origin === "Gemini Pro candidate");
  const humanCases = suite.cases.filter((item) => item.auditLabel === "STUDENT_ADDED");
  const run = resultSummary?.suites?.[suite.key]?.caseSummary || {};
  const auditExceptions = aiCases.filter((item) => item.auditLabel !== "VALID").map((item) => [item.id, item.auditLabel, item.auditReason]);
  const base = `reports/pipelines/${suite.key}`;
  write(`${base}/01-generation.md`, `
# ${suite.endpoint} — Generation

- Gemini sequence: ${meta.prompts}
- Initial generated candidate target/result: ${meta.generated}
- Canonical AI candidates after correction: ${aiCases.length}
- Evidence: \`evidence/gemini/${suite.key}-session.txt\` and matching timestamp JSON/screenshot.

${meta.note}

Coverage was driven parameter-by-parameter, then by state, applicable security rules, and schema/robustness. Implementation behavior was not supplied to Gemini during candidate generation.
  `);
  write(`${base}/02-audit.md`, `
# ${suite.endpoint} — Human Audit Ledger

${mdTable(["Label", "Count"], Object.entries(audits).map(([label, count]) => [label, count]))}

## Corrected or constrained AI rows

${mdTable(["Case", "Audit label", "Reason"], auditExceptions)}

VALID rows have a normative or deliberately conservative executable oracle. INVALID rows remain visible for traceability and are corrected/excluded explicitly. INCOMPLETE rows assert only safe observations because the specification is silent.
  `);
  write(`${base}/03-extension.md`, `
# ${suite.endpoint} — Student Extensions

${mdTable(["Case", "Title", "Technique", "Requirement", "Why added"], humanCases.map((item) => [item.id, item.title, item.technique, item.requirements, item.auditReason]))}

Gemini underweighted protocol edge cases, information leakage, identity trust, atomic rollback, and metamorphic boundaries because its generation objective favored broad input enumeration. These rows require personal student review before being represented as student work.
  `);
  write(`${base}/04-execution.md`, `
# ${suite.endpoint} — Execution

- Data rows executed: ${run.total ?? "pending"}
- Passed: ${run.passed ?? "pending"}
- Failed: ${run.failed ?? "pending"}
- Current label: \`DRYRUN-NOT-SUBMISSION\`
- Host: \`127.0.0.1:3000\`
- Evidence: latest matching HTML/JUnit report under \`evidence/newman/\`; compact ledger in \`evidence/newman/dry-run-summary.json\`.

Failures are retained when they violate normative requirements; they are not converted to passes. Rerun with the official student ID before submission.
  `);
}

const wordCount = critique.replace(/^#.*$/gm, "").trim().split(/\s+/).length;
if (wordCount < 200 || wordCount > 300) throw new Error(`AI critique must be 200–300 words; got ${wordCount}`);
console.log(JSON.stringify({ reports: 8, critiqueWords: wordCount, studentId, totals: resultSummary?.totals || null }, null, 2));
