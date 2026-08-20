import fs from "node:fs";
import path from "node:path";
import { resetCases, couponCases, importCases } from "./case-definitions.mjs";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];

const required = [
  "README.md",
  "postman/HW06-EShop.postman_collection.json",
  "postman/HW06-Local.postman_environment.json",
  "postman/data/reset-password.json",
  "postman/data/apply-coupon.json",
  "postman/data/import-products.json",
  "reports/main-report.md",
  "reports/ai-audit.md",
  "reports/ai-critique.md",
  "reports/bug-reports.md",
  "reports/ci-cd-report.md",
  "reports/manual-checklist.md",
  "reports/video-script.md",
  "docs/agent-skill-pseudocode.md",
  "docs/agent-skill-diagram-HUMAN-REVIEW.md",
  "skills/eshop-api-test-generator/SKILL.md",
  "skills/eshop-api-test-generator/agents/openai.yaml",
  "outputs/hw06/HW06_Test_Cases.xlsx",
  "outputs/hw06/HW06_Main_Report.pdf",
  "outputs/hw06/HW06_AI_Audit_Report.pdf",
  ".github/workflows/api-tests.yml",
  "evidence/gemini/reset-password-session.txt",
  "evidence/gemini/apply-coupon-session.txt",
  "evidence/gemini/import-products-session.txt",
  "evidence/screenshots/01-gemini-reset-candidates.png",
  "evidence/screenshots/02-gemini-coupon-correction.png",
  "evidence/screenshots/03-gemini-import-correction.png",
];

for (const relative of required) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) errors.push(`missing/empty: ${relative}`);
}

const suites = [
  ["reset-password", resetCases, "postman/data/reset-password.json"],
  ["apply-coupon", couponCases, "postman/data/apply-coupon.json"],
  ["import-products", importCases, "postman/data/import-products.json"],
];

for (const [name, cases, dataFile] of suites) {
  const aiCount = cases.filter((item) => item.origin === "Gemini Pro candidate").length;
  const studentCount = cases.filter((item) => item.auditLabel === "STUDENT_ADDED").length;
  const unique = new Set(cases.map((item) => item.id));
  const data = JSON.parse(fs.readFileSync(path.join(root, dataFile), "utf8"));
  if (aiCount < 35) errors.push(`${name}: only ${aiCount} AI candidates`);
  if (studentCount < 5) errors.push(`${name}: only ${studentCount} student extensions`);
  if (unique.size !== cases.length) errors.push(`${name}: duplicate case IDs`);
  if (data.length !== cases.length) errors.push(`${name}: data/canonical count mismatch ${data.length}/${cases.length}`);
  for (const item of cases) {
    if (!item.auditLabel || !item.auditReason || !item.requirements || !item.technique) errors.push(`${item.id}: incomplete audit metadata`);
  }
}

const collectionText = fs.readFileSync(path.join(root, "postman/HW06-EShop.postman_collection.json"), "utf8");
if (!collectionText.includes("X-Student-Id")) errors.push("collection does not inject X-Student-Id");
if (!collectionText.includes("pm.iterationData")) errors.push("collection is not data-driven");

const critique = fs.readFileSync(path.join(root, "reports/ai-critique.md"), "utf8").replace(/^#.*$/gm, "").trim();
const critiqueWords = critique.split(/\s+/).length;
if (critiqueWords < 200 || critiqueWords > 300) errors.push(`AI critique has ${critiqueWords} words`);

const placeholderFiles = ["README.md", "postman/HW06-Local.postman_environment.json", "reports/main-report.md", "reports/ci-cd-report.md", "reports/manual-checklist.md"];
const placeholderHits = placeholderFiles.filter((relative) => fs.readFileSync(path.join(root, relative), "utf8").includes("HUMAN_REVIEW_REQUIRED"));
if (placeholderHits.length) {
  const message = `human-review placeholders remain in: ${placeholderHits.join(", ")}`;
  if (strict) errors.push(message); else warnings.push(message);
}

if (!fs.existsSync(path.join(root, "docs/agent-skill-diagram.png"))) {
  const message = "self-drawn docs/agent-skill-diagram.png is not present";
  if (strict) errors.push(message); else warnings.push(message);
}

if (!fs.existsSync(path.join(root, "reports/git-commit-log.txt"))) warnings.push("git commit log has not been exported yet");

const output = {
  mode: strict ? "STRICT_SUBMISSION" : "DRAFT",
  caseCounts: Object.fromEntries(suites.map(([name, cases]) => [name, cases.length])),
  totalCases: suites.reduce((sum, [, cases]) => sum + cases.length, 0),
  critiqueWords,
  errors,
  warnings,
  status: errors.length ? "FAIL" : warnings.length ? "DRAFT_OK_WITH_HUMAN_GATES" : "PASS",
};
console.log(JSON.stringify(output, null, 2));
process.exit(errors.length ? 1 : 0);
