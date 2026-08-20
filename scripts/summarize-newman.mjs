import fs from "node:fs";
import path from "node:path";

const reportDir = path.resolve("evidence/newman");
const suites = ["reset-password", "apply-coupon", "import-products"];

function latestReport(suite) {
  const candidates = fs
    .readdirSync(reportDir)
    .filter((name) => name.startsWith(`${suite}-`) && name.endsWith(".json"))
    .map((name) => ({ name, mtime: fs.statSync(path.join(reportDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!candidates.length) throw new Error(`No Newman JSON report found for ${suite}`);
  return path.join(reportDir, candidates[0].name);
}

function caseIdFromExecution(execution) {
  for (const assertion of execution.assertions || []) {
    const fromAssertion = assertion.assertion?.match(/\[(R|C|I)-(?:AI|H)-\d{2}\]/);
    if (fromAssertion) return fromAssertion[0].slice(1, -1);
  }
  const name = execution.item?.name || "";
  const fromName = name.match(/\b(?:R|C|I)-(?:AI|H)-\d{2}\b/);
  if (fromName) return fromName[0];
  const requestBody = execution.request?.body?.raw || "";
  const fromBody = requestBody.match(/\b(?:R|C|I)-(?:AI|H)-\d{2}\b/);
  return fromBody?.[0] || null;
}

function summarize(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const executions = parsed.run?.executions || [];
  const byCase = new Map();
  const bugSignals = [];

  for (const execution of executions) {
    const id = caseIdFromExecution(execution);
    if (!id) continue;
    const assertions = execution.assertions || [];
    const failures = assertions
      .filter((assertion) => assertion.error)
      .map((assertion) => ({
        assertion: assertion.assertion,
        message: assertion.error?.message || String(assertion.error),
      }));
    const row = byCase.get(id) || {
      id,
      requestCount: 0,
      assertionCount: 0,
      failureCount: 0,
      failures: [],
    };
    row.requestCount += 1;
    row.assertionCount += assertions.length;
    row.failureCount += failures.length;
    row.failures.push(...failures);
    byCase.set(id, row);

    for (const failure of failures) {
      const text = `${failure.assertion} ${failure.message}`;
      if (/stack|password|reset[_ ]?token|atomic|admin|discount|threshold|auth|jwt/i.test(text)) {
        bugSignals.push({ id, ...failure });
      }
    }
  }

  const cases = [...byCase.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((row) => ({ ...row, result: row.failureCount ? "FAIL" : "PASS" }));

  return {
    source: path.relative(process.cwd(), file).replaceAll("\\", "/"),
    dryRun: true,
    generatedAt: parsed.run?.timings?.completed || null,
    stats: parsed.run?.stats || null,
    caseSummary: {
      total: cases.length,
      passed: cases.filter((row) => row.result === "PASS").length,
      failed: cases.filter((row) => row.result === "FAIL").length,
    },
    cases,
    bugSignals: bugSignals.slice(0, 100),
  };
}

const summaries = Object.fromEntries(suites.map((suite) => [suite, summarize(latestReport(suite))]));
const output = {
  label: "DRYRUN-NOT-SUBMISSION",
  warning: "Replace this evidence by rerunning Newman with the student's real ID.",
  suites: summaries,
  totals: {
    cases: Object.values(summaries).reduce((sum, item) => sum + item.caseSummary.total, 0),
    passed: Object.values(summaries).reduce((sum, item) => sum + item.caseSummary.passed, 0),
    failed: Object.values(summaries).reduce((sum, item) => sum + item.caseSummary.failed, 0),
  },
};

const outputPath = path.join(reportDir, "dry-run-summary.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: output.totals, suites: Object.fromEntries(Object.entries(summaries).map(([key, value]) => [key, value.caseSummary])) }, null, 2));
