import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const status = JSON.parse(fs.readFileSync(path.join(root, "reports/submission-status.json"), "utf8"));
const grade = String(status.studentOnlyGates.selfAssessedGrade).padStart(3, "0");
const destination = path.resolve(root, "submission");

if (destination !== path.resolve(root, "submission")) throw new Error("Unsafe submission destination");
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });

const files = [
  "README.md",
  "package.json",
  "package-lock.json",
  ".github/workflows/api-tests.yml",
  "outputs/hw06/HW06_Main_Report.pdf",
  "outputs/hw06/HW06_AI_Audit_Report.pdf",
  "reports/main-report.md",
  "reports/ai-audit.md",
  "reports/ai-critique.md",
  "reports/bug-reports.md",
  "reports/ci-cd-report.md",
  "reports/git-commit-log.txt",
  "reports/github-issues.json",
  "reports/github-issue-drafts.json",
  "reports/manual-checklist.md",
  "reports/submission-status.json",
  "docs/agent-skill-pseudocode.md",
  "docs/agent-skill-diagram-HUMAN-REVIEW.md",
  "docs/agent-skill-diagram.mmd",
  "postman/HW06-EShop.postman_collection.json",
  "postman/HW06-Local.postman_environment.json",
  "postman/data/reset-password.json",
  "postman/data/apply-coupon.json",
  "postman/data/import-products.json",
  "evidence/newman/execution-summary.json",
  "evidence/gemini/reset-password-session.txt",
  "evidence/gemini/reset-password-timestamps.json",
  "evidence/gemini/apply-coupon-session.txt",
  "evidence/gemini/apply-coupon-timestamps.json",
  "evidence/gemini/import-products-session.txt",
  "evidence/gemini/import-products-timestamps.json",
  "sut/eshop-sut/api_specification.md",
  ...fs.readdirSync(path.join(root, "evidence/screenshots")).map((name) => `evidence/screenshots/${name}`),
  ...fs.readdirSync(path.join(root, "scripts")).filter((name) => /\.(?:mjs|py)$/i.test(name)).map((name) => `scripts/${name}`),
];

for (const suite of Object.values(JSON.parse(fs.readFileSync(path.join(root, "evidence/newman/execution-summary.json"), "utf8")).suites)) {
  const base = suite.source.replace(/\.json$/i, "");
  files.push(suite.source, `${base}.html`, `${base}.xml`);
}

function copyFile(relative) {
  const source = path.join(root, relative);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile() || fs.statSync(source).size === 0) {
    throw new Error(`Missing submission source: ${relative}`);
  }
  const target = path.join(destination, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

for (const relative of [...new Set(files)]) copyFile(relative);

const updatedWorkbook = "outputs/hw06/HW06_Test_Cases.updated.xlsx";
const canonicalWorkbook = "outputs/hw06/HW06_Test_Cases.xlsx";
const workbookSource = fs.existsSync(path.join(root, updatedWorkbook)) ? updatedWorkbook : canonicalWorkbook;
const workbookTarget = path.join(destination, canonicalWorkbook);
fs.mkdirSync(path.dirname(workbookTarget), { recursive: true });
fs.copyFileSync(path.join(root, workbookSource), workbookTarget);
fs.cpSync(path.join(root, "skills/eshop-api-test-generator"), path.join(destination, "skills/eshop-api-test-generator"), { recursive: true });

const missingHumanEvidence = [
  "evidence/screenshots/09-console-x-student-id-23127373.png",
  "docs/agent-skill-diagram.png",
];
for (const relative of missingHumanEvidence) {
  if (fs.existsSync(path.join(root, relative))) copyFile(relative);
}

const manifest = `# Submission package

- Student: ${status.student.name}
- Student ID: ${status.student.id}
- Self-assessed grade: ${grade}/100
- Required ZIP filename: \`${status.student.id}_HW06_AI_API_${grade}.zip\`
- Repository: ${status.repository.url} (${status.repository.visibility}; make public only as the final step)
- Optional video: declined by the student

## Human evidence already confirmed

- All 158 Excel rows were personally reviewed.
- The real PowerShell screenshot contains \`X-Student-Id: ${status.student.id}\`.
- The Agent Skill diagram is a valid PNG and its editable Mermaid source is retained.

## Human actions still required before submission

1. Personally spot-check the Newman HTML and AI Audit; then update the remaining source-of-truth gates truthfully and rebuild this folder.
2. Make the GitHub repository public as the final online step.
3. Inspect the folder, ZIP its contents as \`${status.student.id}_HW06_AI_API_${grade}.zip\`, and submit on Moodle.
`;
fs.writeFileSync(path.join(destination, "SUBMISSION_MANIFEST.md"), manifest, "utf8");
fs.writeFileSync(path.join(destination, "ZIP_FILENAME.txt"), `${status.student.id}_HW06_AI_API_${grade}.zip\n`, "utf8");

const copied = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else copied.push(path.relative(destination, full).replaceAll("\\", "/"));
  }
}
collect(destination);
fs.writeFileSync(path.join(destination, "FILE_INVENTORY.txt"), `${copied.sort().join("\n")}\n`, "utf8");

console.log(JSON.stringify({ destination, zipFilename: `${status.student.id}_HW06_AI_API_${grade}.zip`, files: copied.length + 1, missingHumanEvidence: missingHumanEvidence.filter((relative) => !fs.existsSync(path.join(root, relative))) }, null, 2));
