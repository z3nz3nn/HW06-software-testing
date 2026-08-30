import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { resetCases, couponCases, importCases } from "./case-definitions.mjs";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];
const checks = [];
const humanGates = [];

const exists = (relative) => fs.existsSync(path.join(root, relative)) && fs.statSync(path.join(root, relative)).size > 0;
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));
const record = (name, ok, detail = "") => {
  checks.push({ name, status: ok ? "PASS" : "FAIL", detail });
  if (!ok) errors.push(`${name}${detail ? `: ${detail}` : ""}`);
};
const gate = (name, complete, evidence) => {
  humanGates.push({ name, complete, evidence });
  if (!complete) {
    const message = `student-only gate incomplete: ${name}`;
    if (strict) errors.push(message); else warnings.push(message);
  }
};
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

const required = [
  "README.md", "reports/submission-status.json",
  "postman/HW06-EShop.postman_collection.json", "postman/HW06-Local.postman_environment.json",
  "postman/data/reset-password.json", "postman/data/apply-coupon.json", "postman/data/import-products.json",
  "reports/main-report.md", "reports/ai-audit.md", "reports/ai-critique.md", "reports/bug-reports.md",
  "reports/ci-cd-report.md", "reports/manual-checklist.md", "reports/video-script.md",
  "reports/git-commit-log.txt", "reports/github-issues.json", "reports/github-issue-drafts.json",
  "docs/agent-skill-pseudocode.md", "docs/agent-skill-diagram-HUMAN-REVIEW.md", "docs/agent-skill-diagram.mmd",
  "skills/eshop-api-test-generator/SKILL.md", "skills/eshop-api-test-generator/agents/openai.yaml",
  "skills/eshop-api-test-generator/references/test-case-schema.md", "skills/eshop-api-test-generator/scripts/validate_cases.mjs",
  "outputs/hw06/HW06_Test_Cases.xlsx", "outputs/hw06/HW06_Main_Report.pdf", "outputs/hw06/HW06_AI_Audit_Report.pdf",
  "outputs/hw06/workbook-inspection.ndjson", "outputs/hw06/workbook-formula-error-scan.ndjson",
  ".github/workflows/api-tests.yml", "evidence/newman/execution-summary.json",
  "evidence/gemini/reset-password-session.txt", "evidence/gemini/apply-coupon-session.txt", "evidence/gemini/import-products-session.txt",
  "evidence/gemini/reset-password-timestamps.json", "evidence/gemini/apply-coupon-timestamps.json", "evidence/gemini/import-products-timestamps.json",
  "evidence/screenshots/01-gemini-reset-candidates.png", "evidence/screenshots/02-gemini-coupon-correction.png", "evidence/screenshots/03-gemini-import-correction.png",
  "evidence/screenshots/04-ci-all-pass.jpg", "evidence/screenshots/05-ci-one-fail.jpg", "evidence/screenshots/06-ci-one-fail-log.jpg", "evidence/screenshots/07-ci-run-history.jpg",
  "evidence/screenshots/08-github-issues-1-to-10.png",
  ...["login-secret-leak", "reset-password-complexity", "weak-reset-token", "coupon-missing-auth", "coupon-percentage-formula", "coupon-threshold-boundary", "import-missing-role-check", "import-incomplete-validation", "import-non-atomic", "stack-leak"].map((name, index) => `evidence/screenshots/bug-${String(index + 1).padStart(2, "0")}-${name}.jpg`),
];
const missing = required.filter((relative) => !exists(relative));
record("required artifact inventory", missing.length === 0, missing.join(", "));

const submission = json("reports/submission-status.json");
record("student identity synchronized", submission.student.id === "23127373" && submission.student.name === "Nguyễn Đình Thái Hưng", JSON.stringify(submission.student));
record("repository URL synchronized", submission.repository.url === "https://github.com/z3nz3nn/HW06-software-testing", submission.repository.url);

const suites = [
  ["reset-password", resetCases, "postman/data/reset-password.json", "R-"],
  ["apply-coupon", couponCases, "postman/data/apply-coupon.json", "C-"],
  ["import-products", importCases, "postman/data/import-products.json", "I-"],
];
for (const [name, cases, dataFile] of suites) {
  const aiCount = cases.filter((item) => item.origin === "Gemini Pro candidate").length;
  const studentCount = cases.filter((item) => item.auditLabel === "STUDENT_ADDED").length;
  const unique = new Set(cases.map((item) => item.id));
  const data = json(dataFile);
  record(`${name} case count and minimums`, aiCount >= 35 && studentCount >= 5 && unique.size === cases.length && data.length === cases.length, `AI=${aiCount}, student=${studentCount}, canonical=${cases.length}, data=${data.length}`);
  const incomplete = cases.filter((item) => !item.auditLabel || !item.auditReason || !item.requirements || !item.technique || !item.title);
  record(`${name} audit metadata`, incomplete.length === 0, incomplete.map((item) => item.id).join(", "));
}

const collectionText = read("postman/HW06-EShop.postman_collection.json");
const environmentText = read("postman/HW06-Local.postman_environment.json");
record("Postman collection is data-driven and injects student header", collectionText.includes("X-Student-Id") && collectionText.includes("pm.iterationData") && collectionText.includes("studentId") && environmentText.includes("23127373"));

const execution = json("evidence/newman/execution-summary.json");
const expectedTotals = { cases: 158, passed: 113, failed: 45 };
record("official Newman totals", Object.entries(expectedTotals).every(([key, value]) => execution.totals?.[key] === value) && execution.studentId === "23127373", JSON.stringify(execution.totals));
for (const [name, cases, , prefix] of suites) {
  const run = execution.suites?.[name];
  const source = run?.source;
  const base = source?.replace(/\.json$/i, "");
  const siblings = base ? [source, `${base}.html`, `${base}.xml`] : [];
  const allCaseIds = new Set(run?.cases?.map((item) => item.id) || []);
  const reportText = base && exists(`${base}.html`) ? read(`${base}.html`) : "";
  const expected = cases.length;
  const sumMatches = run?.caseSummary?.total === expected && run.caseSummary.passed + run.caseSummary.failed === expected;
  record(`${name} official JSON/XML/HTML evidence`, siblings.length === 3 && siblings.every(exists) && sumMatches && allCaseIds.size === expected && cases.every((item) => allCaseIds.has(item.id)) && reportText.includes("127.0.0.1:3000") && reportText.includes("23127373") && reportText.includes(prefix), source || "no source");
}

const auditText = read("reports/ai-audit.md");
let interactionCount = 0;
for (const slug of ["reset-password", "apply-coupon", "import-products"]) {
  const transcript = read(`evidence/gemini/${slug}-session.txt`).trim();
  const meta = json(`evidence/gemini/${slug}-timestamps.json`);
  interactionCount += meta.prompts.length;
  const timesValid = meta.tool === "Google Gemini Pro" && meta.prompts.every((entry) => entry.id && !Number.isNaN(Date.parse(entry.sentAtUtc)) && !Number.isNaN(Date.parse(entry.responseCompletedAtUtc)) && Date.parse(entry.sentAtUtc) < Date.parse(entry.responseCompletedAtUtc));
  const indexed = meta.prompts.every((entry) => auditText.includes(entry.id) && auditText.includes(entry.sentAtUtc) && auditText.includes(entry.responseCompletedAtUtc));
  const verbatim = auditText.includes(transcript.replaceAll("```", "` ` `"));
  record(`${slug} AI audit transcript/timestamps`, timesValid && indexed && verbatim, `${meta.prompts.length} interactions`);
}
record("AI audit interaction total", interactionCount === 11, String(interactionCount));

const critique = read("reports/ai-critique.md").replace(/^#.*$/gm, "").trim();
const critiqueWords = critique.split(/\s+/).filter(Boolean).length;
record("AI critique word count", critiqueWords >= 200 && critiqueWords <= 300, `${critiqueWords} words`);

const issueIndex = json("reports/github-issues.json");
const issueDrafts = json("reports/github-issue-drafts.json");
const bugReport = read("reports/bug-reports.md");
const issueKeys = Array.from({ length: 10 }, (_, index) => `BUG-${String(index + 1).padStart(2, "0")}`);
const issuesValid = issueKeys.every((key, index) => issueIndex[key]?.number === index + 1 && issueIndex[key]?.url === `https://github.com/z3nz3nn/HW06-software-testing/issues/${index + 1}` && issueDrafts[key]?.body?.includes(`/bug-${String(index + 1).padStart(2, "0")}-`) && bugReport.includes(issueIndex[key].url));
record("ten synchronized GitHub issue records", Object.keys(issueIndex).length === 10 && issuesValid, `${Object.keys(issueIndex).length} issue URLs`);

const ciText = read("reports/ci-cd-report.md");
const ciRefs = [["32405131238", "beecfaa"], ["32405318145", "a40164b"], ["32405737091", "5d71f4e"]];
const ciValid = ciRefs.every(([run, commit]) => ciText.includes(run) && ciText.includes(commit) && (() => { try { git("cat-file", "-e", `${commit}^{commit}`); return true; } catch { return false; } })());
record("CI run links, commits, and screenshots", ciValid && ["04-ci-all-pass.jpg", "05-ci-one-fail.jpg", "06-ci-one-fail-log.jpg", "07-ci-run-history.jpg"].every((name) => exists(`evidence/screenshots/${name}`)));

for (const pdf of ["outputs/hw06/HW06_Main_Report.pdf", "outputs/hw06/HW06_AI_Audit_Report.pdf"]) {
  const content = fs.readFileSync(path.join(root, pdf));
  record(`${path.basename(pdf)} PDF integrity`, content.subarray(0, 5).toString() === "%PDF-" && content.includes(Buffer.from("%%EOF")), `${content.length} bytes`);
}
record("Excel workbook present", exists("outputs/hw06/HW06_Test_Cases.xlsx") && fs.statSync(path.join(root, "outputs/hw06/HW06_Test_Cases.xlsx")).size > 10000);
const workbookInspection = read("outputs/hw06/workbook-inspection.ndjson");
const workbookFormulaScan = read("outputs/hw06/workbook-formula-error-scan.ndjson");
record("Excel formulas and summary reconciliation", workbookFormulaScan.includes("matched 0 entries") && workbookInspection.includes('"sheets":7') && workbookInspection.includes('["TOTAL",142,16,97,9,36,158,113,45'));

const markdownFiles = git("ls-files", "*.md").split(/\r?\n/).filter(Boolean);
const brokenLinks = [];
for (const relative of markdownFiles) {
  const sourceDir = path.dirname(path.join(root, relative));
  const content = read(relative);
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "").split("#")[0];
    if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
    if (!fs.existsSync(path.resolve(sourceDir, decodeURIComponent(target)))) brokenLinks.push(`${relative} -> ${target}`);
  }
}
record("tracked Markdown local links", brokenLinks.length === 0, brokenLinks.join("; "));

const readme = read("README.md");
record("README summary synchronized", readme.includes("158") && readme.includes("113") && readme.includes("45") && readme.includes(submission.repository.url) && readme.includes("submission-status.json"));
record("Main Report PDF includes mandatory AI Critique", read("reports/main-report.md").includes("## 11. AI Critique (267 words)") && read("reports/main-report.md").includes(critique));

const logText = read("reports/git-commit-log.txt");
const loggedHash = logText.match(/\b([0-9a-f]{7,40})\b/)?.[1];
let commitGap = null;
try { commitGap = loggedHash ? Number(git("rev-list", "--count", `${loggedHash}..HEAD`)) : null; } catch { commitGap = null; }
record("git commit log freshness", commitGap !== null && commitGap <= 1, `HEAD is ${commitGap ?? "unknown"} commit(s) ahead of exported log`);

const suspiciousEmails = [];
for (const relative of git("ls-files").split(/\r?\n/).filter((file) => /\.(?:md|json|txt|ya?ml|mjs)$/i.test(file) && !file.startsWith("sut/") && !file.endsWith("package-lock.json"))) {
  for (const match of read(relative).matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)) {
    if (!/(?:example\.com|test\.com|domain\.com|mail\.com|test\.local|example\.org|eshop\.com)$/i.test(match[0])) suspiciousEmails.push(`${relative}:${match[0]}`);
  }
}
if (suspiciousEmails.length) warnings.push(`review non-test email-like strings: ${[...new Set(suspiciousEmails)].join(", ")}`);

const g = submission.studentOnlyGates;
gate("all 158 Excel rows personally reviewed", g.allExcelRowsPersonallyReviewed, "Human_Verified must be YES only after personal inspection");
gate("real console screenshot with X-Student-Id", g.realStudentIdConsoleScreenshotCaptured, "anti-cheat evidence cannot be generated by AI");
gate("Newman HTML personally spot-checked", g.newmanHtmlPersonallySpotChecked, "automated consistency passed; student visual check remains");
gate("repository public as final step", submission.repository.visibility === "public" && submission.repository.publicApprovedByStudent, submission.repository.url);
gate("self-drawn Agent Skill diagram", g.selfDrawnDiagramCompleted && exists("docs/agent-skill-diagram.png"), "docs/agent-skill-diagram.png");
gate("AI audit personally confirmed", g.aiAuditPersonallyConfirmed, "compare the 11 recorded interactions with Gemini");
gate("optional video decision recorded", g.videoRecordedAndLinked || g.videoDecision === "declined", g.videoDecision === "declined" ? "optional video declined by student" : "video recorded and linked");
gate("self-assessed grade selected", Number.isInteger(g.selfAssessedGrade) && g.selfAssessedGrade >= 0 && g.selfAssessedGrade <= 100, String(g.selfAssessedGrade));
gate("final ZIP inspected", g.finalZipInspected, "23127373_HW06_AI_API_<grade>.zip");
gate("Moodle submission", g.moodleSubmitted, "final external action");

const output = {
  mode: strict ? "STRICT_SUBMISSION" : "DRAFT",
  automatedChecks: { passed: checks.filter((item) => item.status === "PASS").length, total: checks.length, details: checks },
  caseCounts: Object.fromEntries(suites.map(([name, cases]) => [name, cases.length])),
  totalCases: suites.reduce((sum, [, cases]) => sum + cases.length, 0),
  critiqueWords,
  humanGates,
  errors,
  warnings,
  status: errors.length ? "FAIL" : warnings.length ? "DRAFT_OK_WITH_HUMAN_GATES" : "PASS",
};
console.log(JSON.stringify(output, null, 2));
process.exit(errors.length ? 1 : 0);
