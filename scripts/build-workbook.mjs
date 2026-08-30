import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resetCases, couponCases, importCases } from "./case-definitions.mjs";

const defaultArtifactModule = "C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
const artifactModule = process.env.ARTIFACT_TOOL_MODULE || defaultArtifactModule;
const { SpreadsheetFile, Workbook } = await import(pathToFileURL(artifactModule).href);

const outputDir = path.resolve("outputs/hw06");
const previewDir = path.join(outputDir, "previews");
await fs.mkdir(previewDir, { recursive: true });

const summary = JSON.parse(await fs.readFile("evidence/newman/execution-summary.json", "utf8"));
const submissionStatus = JSON.parse(await fs.readFile("reports/submission-status.json", "utf8"));
const gates = submissionStatus.studentOnlyGates;
const rowReviewNote = gates.allExcelRowsPersonallyReviewed
  ? "Student personally reviewed all test-case rows on 2026-08-30."
  : "";
let issueIndex = {};
try {
  issueIndex = JSON.parse(await fs.readFile("reports/github-issues.json", "utf8"));
} catch {
  issueIndex = {};
}
const bugs = [
  ["BUG-01", "Critical", "Authentication", "Plaintext password storage and sensitive login response", "R-H-05; source review"],
  ["BUG-02", "High", "Password reset", "Password complexity is not validated", "R-AI-05..10,35..38"],
  ["BUG-03", "High", "OTP", "OTP has four digits and no expiry", "R-AI-15; source review"],
  ["BUG-04", "Critical", "Coupon", "No JWT gate; body identity is trusted", "C-AI-02..09"],
  ["BUG-05", "High", "Coupon", "Percent calculation is incorrect", "C-AI-01,19,34"],
  ["BUG-06", "Medium", "Coupon", "Exact minimum is rejected", "C-AI-18,21,22"],
  ["BUG-07", "Critical", "Import", "Normal user can call admin import", "I-AI-02,56"],
  ["BUG-08", "High", "Import", "Price/category/name validation is incomplete", "I-AI-21..33"],
  ["BUG-09", "High", "Import", "Invalid mixed batch partially commits", "I-AI-40..42,51"],
  ["BUG-10", "Medium", "Error handling", "Malformed input exposes stack details", "R/C/I malformed rows"],
].map((row) => [...row, issueIndex[row[0]] ? `#${issueIndex[row[0]].number}` : "PENDING", issueIndex[row[0]]?.url || ""]);

const suiteSpecs = [
  { sheet: "Reset_Password", key: "reset-password", endpoint: "POST /api/reset-password", cases: resetCases },
  { sheet: "Apply_Coupon", key: "apply-coupon", endpoint: "POST /api/apply-coupon", cases: couponCases },
  { sheet: "Import_Products", key: "import-products", endpoint: "POST /api/admin/import-products", cases: importCases },
];

const workbook = Workbook.create();
const summarySheet = workbook.worksheets.add("Summary");
for (const spec of suiteSpecs) workbook.worksheets.add(spec.sheet);
const auditSheet = workbook.worksheets.add("AI_Audit_Index");
const bugSheet = workbook.worksheets.add("Bug_Summary");
const manualSheet = workbook.worksheets.add("Manual_Review");

const colors = {
  navy: "#12324A",
  teal: "#0F766E",
  pale: "#E6F4F1",
  bluePale: "#E8F1F8",
  red: "#B42318",
  redPale: "#FDECEC",
  amber: "#B54708",
  amberPale: "#FFF4E5",
  green: "#067647",
  greenPale: "#EAF8F0",
  gray: "#667085",
  line: "#D0D5DD",
  white: "#FFFFFF",
};

function titleBand(sheet, range, title, subtitle) {
  sheet.getRange(range).merge();
  sheet.getRange(range.split(":")[0]).values = [[`${title}\n${subtitle}`]];
  sheet.getRange(range).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange(range).format.rowHeight = 48;
}

function styleHeader(range) {
  range.format = {
    fill: colors.teal,
    font: { bold: true, color: colors.white },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  range.format.rowHeight = 30;
}

function safe(value, limit = 320) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function inputSummary(item) {
  const ignored = new Set(["id", "origin", "auditLabel", "auditReason", "priority", "title", "outcome", "technique", "requirements", "manualReview"]);
  return safe(Object.fromEntries(Object.entries(item).filter(([key]) => !ignored.has(key))));
}

for (const spec of suiteSpecs) {
  const sheet = workbook.worksheets.getItem(spec.sheet);
  const runCases = new Map(summary.suites[spec.key].cases.map((row) => [row.id, row]));
  titleBand(sheet, "A1:O2", spec.endpoint, `${spec.cases.length} canonical cases • official Newman result • X-Student-Id 23127373`);
  const headers = ["Case_ID", "Title", "Origin", "Audit_Label", "Audit_Reason", "Requirement", "Technique", "Priority", "Oracle", "Input / mode", "Manual_Review", "Official_Result", "Official_Failures", "Human_Verified", "Reviewer_Notes"];
  sheet.getRange(`A4:O${4 + spec.cases.length}`).values = [
    headers,
    ...spec.cases.map((item) => {
      const result = runCases.get(item.id);
      return [
        item.id,
        item.title,
        item.origin,
        item.auditLabel,
        item.auditReason,
        item.requirements,
        item.technique,
        item.priority,
        item.outcome,
        inputSummary(item),
        item.manualReview || "",
        result?.result || "NOT_RUN",
        result ? safe([...new Set(result.failures.map((failure) => failure.assertion))].join(" | "), 500) : "",
        gates.allExcelRowsPersonallyReviewed ? "YES" : "NO",
        rowReviewNote,
      ];
    }),
  ];
  styleHeader(sheet.getRange("A4:O4"));
  sheet.tables.add(`A4:O${4 + spec.cases.length}`, true, `${spec.sheet.replaceAll("_", "")}Table`).style = "TableStyleMedium2";
  sheet.freezePanes.freezeRows(4);
  sheet.freezePanes.freezeColumns(1);
  sheet.showGridLines = false;
  sheet.getRange(`A5:O${4 + spec.cases.length}`).format = {
    verticalAlignment: "top",
    wrapText: true,
  };
  sheet.getRange(`A5:O${4 + spec.cases.length}`).format.rowHeight = 42;
  const widths = [14, 34, 20, 15, 46, 20, 20, 12, 16, 45, 35, 12, 44, 16, 32];
  widths.forEach((width, index) => { sheet.getRangeByIndexes(3, index, spec.cases.length + 1, 1).format.columnWidth = width; });
  sheet.getRange(`N5:N${4 + spec.cases.length}`).dataValidation = { rule: { type: "list", values: ["NO", "YES"] } };
  sheet.getRange(`D5:D${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "INVALID", format: { fill: colors.redPale, font: { color: colors.red, bold: true } } });
  sheet.getRange(`D5:D${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "INCOMPLETE", format: { fill: colors.amberPale, font: { color: colors.amber, bold: true } } });
  sheet.getRange(`D5:D${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "STUDENT_ADDED", format: { fill: colors.bluePale, font: { color: colors.navy, bold: true } } });
  sheet.getRange(`L5:L${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "PASS", format: { fill: colors.greenPale, font: { color: colors.green, bold: true } } });
  sheet.getRange(`L5:L${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "FAIL", format: { fill: colors.redPale, font: { color: colors.red, bold: true } } });
  sheet.getRange(`N5:N${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "NO", format: { fill: colors.amberPale, font: { color: colors.amber, bold: true } } });
  sheet.getRange(`N5:N${4 + spec.cases.length}`).conditionalFormats.add("containsText", { text: "YES", format: { fill: colors.greenPale, font: { color: colors.green, bold: true } } });
}

titleBand(summarySheet, "A1:I2", "HW06 API Testing Dashboard", "Formula-backed summary • Nguyễn Đình Thái Hưng • Student ID 23127373");
summarySheet.getRange("A4:I4").values = [["API", "AI candidates", "Student-added", "VALID", "INVALID", "INCOMPLETE", "Executed", "Passed", "Failed"]];
styleHeader(summarySheet.getRange("A4:I4"));
summarySheet.getRange("A5:A7").values = suiteSpecs.map((spec) => [spec.endpoint]);
suiteSpecs.forEach((spec, index) => {
  const row = 5 + index;
  const end = 4 + spec.cases.length;
  summarySheet.getRange(`B${row}:I${row}`).formulas = [[
    `=COUNTIF('${spec.sheet}'!$C$5:$C$${end},"Gemini Pro candidate")`,
    `=COUNTIF('${spec.sheet}'!$D$5:$D$${end},"STUDENT_ADDED")`,
    `=COUNTIF('${spec.sheet}'!$D$5:$D$${end},"VALID")`,
    `=COUNTIF('${spec.sheet}'!$D$5:$D$${end},"INVALID")`,
    `=COUNTIF('${spec.sheet}'!$D$5:$D$${end},"INCOMPLETE")`,
    `=COUNTIF('${spec.sheet}'!$L$5:$L$${end},"<>NOT_RUN")`,
    `=COUNTIF('${spec.sheet}'!$L$5:$L$${end},"PASS")`,
    `=COUNTIF('${spec.sheet}'!$L$5:$L$${end},"FAIL")`,
  ]];
});
summarySheet.getRange("A8:I8").values = [["TOTAL", null, null, null, null, null, null, null, null]];
summarySheet.getRange("B8:I8").formulas = [["=SUM(B5:B7)", "=SUM(C5:C7)", "=SUM(D5:D7)", "=SUM(E5:E7)", "=SUM(F5:F7)", "=SUM(G5:G7)", "=SUM(H5:H7)", "=SUM(I5:I7)"]];
summarySheet.getRange("A8:I8").format = { fill: colors.pale, font: { bold: true, color: colors.navy }, borders: { preset: "doubleBottom", style: "medium", color: colors.teal } };
summarySheet.getRange("A11:B20").values = [
  ["Submission gate", "Status"],
  ["Student ID supplied", "YES"],
  ["Official Newman rerun", "YES"],
  ["Rows personally reviewed", gates.allExcelRowsPersonallyReviewed ? "YES" : "NO"],
  ["Self-drawn diagram", gates.selfDrawnDiagramCompleted ? "YES" : "NO"],
  ["Ten GitHub Issues", Object.keys(issueIndex).length === 10 ? "YES" : "NO"],
  ["Public GitHub", submissionStatus.repository.visibility === "public" && submissionStatus.repository.publicApprovedByStudent ? "YES" : "NO"],
  ["Video decision", gates.videoRecordedAndLinked ? "RECORDED" : gates.videoDecision === "declined" ? "DECLINED (OPTIONAL)" : "NO DECISION"],
  ["Self-assessed grade", Number.isInteger(gates.selfAssessedGrade) ? `${gates.selfAssessedGrade}/100` : "NOT SELECTED"],
  ["Final ZIP inspected", gates.finalZipInspected ? "YES" : "NO"],
];
styleHeader(summarySheet.getRange("A11:B11"));
summarySheet.getRange("B12:B20").format = { fill: colors.amberPale, font: { bold: true, color: colors.amber } };
summarySheet.getRange("B12:B20").conditionalFormats.add("containsText", { text: "YES", format: { fill: colors.greenPale, font: { color: colors.green, bold: true } } });
summarySheet.getRange("B12:B20").conditionalFormats.add("containsText", { text: "OPTIONAL", format: { fill: colors.greenPale, font: { color: colors.green, bold: true } } });
summarySheet.getRange("B12:B20").conditionalFormats.add("containsText", { text: "/100", format: { fill: colors.greenPale, font: { color: colors.green, bold: true } } });
summarySheet.getRange("D11:F16").values = [
  ["Evidence", "Value", "Interpretation"],
  ["Official total", summary.totals.cases, "158 expected"],
  ["Official passed", summary.totals.passed, "Product behavior met oracle"],
  ["Official failed", summary.totals.failed, "Candidate defect evidence"],
  ["GitHub Issues", Object.keys(issueIndex).length, "10 expected"],
  ["AI sessions", 11, "3 reset + 4 coupon + 4 import"],
];
styleHeader(summarySheet.getRange("D11:F11"));
summarySheet.getRange("A4:I8").format.borders = { preset: "outside", style: "thin", color: colors.line };
summarySheet.getRange("A4:I20").format.verticalAlignment = "center";
summarySheet.getRange("A4:I20").format.wrapText = true;
summarySheet.getRange("A4:I20").format.columnWidth = 19;
summarySheet.getRange("A4:A20").format.columnWidth = 33;
summarySheet.getRange("F4:F20").format.columnWidth = 30;
summarySheet.showGridLines = false;
summarySheet.freezePanes.freezeRows(4);
summarySheet.getRange("K20:M23").values = [
  ["API", "Passed", "Failed"],
  ["Reset password", null, null],
  ["Apply coupon", null, null],
  ["Import products", null, null],
];
summarySheet.getRange("L21:M23").formulas = [
  ["=H5", "=I5"],
  ["=H6", "=I6"],
  ["=H7", "=I7"],
];
summarySheet.getRange("K20:K23").format.columnWidth = 20;
summarySheet.getRange("L20:M23").format.columnWidth = 12;
const chart = summarySheet.charts.add("bar", summarySheet.getRange("K20:M23"));
chart.title = "Official pass/fail by API";
chart.hasLegend = true;
chart.setPosition("K4", "R18");

titleBand(auditSheet, "A1:F2", "Gemini Pro AI Audit Index", "All prompts and outputs are preserved verbatim under evidence/gemini");
auditSheet.getRange("A4:F15").values = [
  ["Interaction", "API", "Sent UTC", "Response complete UTC", "Purpose / correction", "Verbatim evidence"],
  ["RESET-P1", "reset-password", "'2026-08-20 17:51:38 UTC", "'2026-08-20 17:52:27 UTC", "Requirements analysis only", "reset-password-session.txt"],
  ["RESET-P2", "reset-password", "'2026-08-20 17:52:42 UTC", "'2026-08-20 17:53:36 UTC", "Correct invented rules and state model", "reset-password-session.txt"],
  ["RESET-P3", "reset-password", "'2026-08-20 17:53:52 UTC", "'2026-08-20 17:55:04 UTC", "Generate exactly 42 candidates", "reset-password-session.txt"],
  ["COUPON-P1", "apply-coupon", "'2026-08-20 17:55:59 UTC", "'2026-08-20 17:57:09 UTC", "Requirements analysis only", "apply-coupon-session.txt"],
  ["COUPON-P2", "apply-coupon", "'2026-08-20 17:57:31 UTC", "'2026-08-20 17:58:37 UTC", "Correct schema/auth/identity assumptions", "apply-coupon-session.txt"],
  ["COUPON-P3", "apply-coupon", "'2026-08-20 17:58:51 UTC", "'2026-08-20 18:00:15 UTC", "Generate exactly 45 candidates", "apply-coupon-session.txt"],
  ["COUPON-P4", "apply-coupon", "'2026-08-20 18:00:35 UTC", "'2026-08-20 18:01:15 UTC", "Correction ledger; exclude invalid concurrency", "apply-coupon-session.txt"],
  ["IMPORT-P1", "import-products", "'2026-08-20 18:01:51 UTC", "'2026-08-20 18:03:04 UTC", "Split JSON API from frontend CSV", "import-products-session.txt"],
  ["IMPORT-P2", "import-products", "'2026-08-20 18:03:24 UTC", "'2026-08-20 18:04:09 UTC", "Correct counts/status/atomicity oracles", "import-products-session.txt"],
  ["IMPORT-P3", "import-products", "'2026-08-20 18:04:25 UTC", "'2026-08-20 18:05:35 UTC", "Generate exactly 48 candidates", "import-products-session.txt"],
  ["IMPORT-P4", "import-products", "'2026-08-20 18:05:57 UTC", "'2026-08-20 18:06:37 UTC", "Correction ledger + 8 supplemental cases", "import-products-session.txt"],
];
styleHeader(auditSheet.getRange("A4:F4"));
auditSheet.tables.add("A4:F15", true, "AIAuditTable").style = "TableStyleMedium2";
auditSheet.getRange("A4:F15").format.columnWidth = 24;
auditSheet.getRange("E4:E15").format.columnWidth = 42;
auditSheet.getRange("F4:F15").format.columnWidth = 34;
auditSheet.getRange("A5:F15").format.wrapText = true;
auditSheet.showGridLines = false;
auditSheet.freezePanes.freezeRows(4);

titleBand(bugSheet, "A1:G2", "Genuine Defect Summary", "Ten issue records with traceable screenshot and official Newman evidence");
bugSheet.getRange("A4:G14").values = [["Bug_ID", "Severity", "Area", "Finding", "Evidence", "GitHub_Status", "Issue_URL"], ...bugs];
styleHeader(bugSheet.getRange("A4:G4"));
bugSheet.tables.add("A4:G14", true, "BugSummaryTable").style = "TableStyleMedium2";
bugSheet.getRange("A4:G14").format.columnWidth = 20;
bugSheet.getRange("D4:D14").format.columnWidth = 58;
bugSheet.getRange("E4:E14").format.columnWidth = 30;
bugSheet.getRange("G4:G14").format.columnWidth = 52;
bugSheet.getRange("A5:G14").format.wrapText = true;
bugSheet.getRange("B5:B14").conditionalFormats.add("containsText", { text: "Critical", format: { fill: colors.redPale, font: { color: colors.red, bold: true } } });
bugSheet.getRange("B5:B14").conditionalFormats.add("containsText", { text: "High", format: { fill: colors.amberPale, font: { color: colors.amber, bold: true } } });
bugSheet.showGridLines = false;
bugSheet.freezePanes.freezeRows(4);

const checklist = [
  ["MR-01", "Confirm name and provide official student ID", "BLOCKING", submissionStatus.student.identityConfirmed ? "YES" : "NO", "Student"],
  ["MR-02", "Personally review every test row", "BLOCKING", gates.allExcelRowsPersonallyReviewed ? "YES" : "NO", "Student"],
  ["MR-03", "Capture/recreate the real official Newman console header screenshot", "BLOCKING", gates.realStudentIdConsoleScreenshotCaptured ? "YES" : "NO", "Student"],
  ["MR-04", "Personally spot-check the three latest Newman HTML reports", "BLOCKING", gates.newmanHtmlPersonallySpotChecked ? "YES" : "NO", "Student"],
  ["MR-05", "Approve/publicize GitHub repository", "BLOCKING", submissionStatus.repository.visibility === "public" && submissionStatus.repository.publicApprovedByStudent ? "YES" : "NO", "Student"],
  ["MR-06", "Publish issues with real screenshot links", "BLOCKING", Object.keys(issueIndex).length === 10 ? "YES" : "NO", "Student"],
  ["MR-07", "Verify both GitHub Actions demonstration runs", "BLOCKING", submissionStatus.automatedEvidence.ciRunPairRecorded ? "YES" : "NO", "Student"],
  ["MR-08", "Draw and export the Agent Skill diagram personally", "BLOCKING", gates.selfDrawnDiagramCompleted ? "YES" : "NO", "Student"],
  ["MR-09", "Personally confirm the AI Audit against Gemini", "BLOCKING", gates.aiAuditPersonallyConfirmed ? "YES" : "NO", "Student"],
  ["MR-10", gates.videoDecision === "declined" ? "Optional video explicitly declined" : "Record/upload video and add URL", "OPTIONAL", gates.videoRecordedAndLinked || gates.videoDecision === "declined" ? "YES" : "NO", "Student"],
  ["MR-11", "Select self-assessed grade and filename", "BLOCKING", Number.isInteger(gates.selfAssessedGrade) ? "YES" : "NO", "Student"],
  ["MR-12", "Inspect ZIP and submit on Moodle", "BLOCKING", gates.finalZipInspected && gates.moodleSubmitted ? "YES" : "NO", "Student"],
];
titleBand(manualSheet, "A1:E2", "Mandatory Human Review", "Only the student may change a row to YES after completing it");
manualSheet.getRange("A4:E16").values = [["Gate_ID", "Required action", "Impact", "Completed", "Owner"], ...checklist];
styleHeader(manualSheet.getRange("A4:E4"));
manualSheet.tables.add("A4:E16", true, "ManualReviewTable").style = "TableStyleMedium2";
manualSheet.getRange("D5:D16").dataValidation = { rule: { type: "list", values: ["NO", "YES"] } };
manualSheet.getRange("D5:D16").conditionalFormats.add("containsText", { text: "NO", format: { fill: colors.redPale, font: { color: colors.red, bold: true } } });
manualSheet.getRange("D5:D16").conditionalFormats.add("containsText", { text: "YES", format: { fill: colors.greenPale, font: { color: colors.green, bold: true } } });
manualSheet.getRange("A4:E16").format.columnWidth = 20;
manualSheet.getRange("B4:B16").format.columnWidth = 64;
manualSheet.getRange("A5:E16").format.wrapText = true;
manualSheet.showGridLines = false;
manualSheet.freezePanes.freezeRows(4);

const inspect = await workbook.inspect({ kind: "workbook,sheet,table,formula", maxChars: 12000, tableMaxRows: 5, tableMaxCols: 10, options: { maxResults: 80 } });
await fs.writeFile(path.join(outputDir, "workbook-inspection.ndjson"), inspect.ndjson || String(inspect));
const formulaErrorScan = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", maxChars: 5000, options: { useRegex: true, maxResults: 100 } });
await fs.writeFile(path.join(outputDir, "workbook-formula-error-scan.ndjson"), formulaErrorScan.ndjson || String(formulaErrorScan));

const previewRanges = {
  Summary: "A1:R25",
  Reset_Password: "A1:O53",
  Apply_Coupon: "A1:O54",
  Import_Products: "A1:O66",
  AI_Audit_Index: "A1:F16",
  Bug_Summary: "A1:G15",
  Manual_Review: "A1:E17",
};
for (const sheetName of ["Summary", ...suiteSpecs.map((spec) => spec.sheet), "AI_Audit_Index", "Bug_Summary", "Manual_Review"]) {
  const preview = await workbook.render({ sheetName, range: previewRanges[sheetName], scale: sheetName === "Summary" ? 1.2 : 0.8, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const exported = await SpreadsheetFile.exportXlsx(workbook);
const outputPath = process.env.HW06_WORKBOOK_OUTPUT
  ? path.resolve(process.env.HW06_WORKBOOK_OUTPUT)
  : path.join(outputDir, "HW06_Test_Cases.xlsx");
await exported.save(outputPath);
console.log(JSON.stringify({ outputPath, sheets: 7, previews: 7 }, null, 2));
