import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node validate_cases.mjs <cases.json>");
  process.exit(2);
}

const rows = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(rows)) throw new Error("The ledger must be a JSON array.");

const allowedAudit = new Set(["VALID", "INVALID", "INCOMPLETE", "STUDENT_ADDED"]);
const allowedOracle = new Set(["NORMATIVE", "OBSERVATIONAL", "NEEDS_HUMAN"]);
const required = ["id", "endpoint", "title", "origin", "auditLabel", "auditReason", "oracleClass", "requirements", "technique", "priority", "preconditions", "expected"];
const errors = [];
const seen = new Set();

for (const [index, row] of rows.entries()) {
  const position = `row ${index + 1}`;
  for (const field of required) {
    if (typeof row[field] !== "string" || !row[field].trim()) errors.push(`${position}: missing ${field}`);
  }
  if (!/^[A-Z]+-(?:AI|H)-\d{2,}$/.test(row.id || "")) errors.push(`${position}: invalid id ${row.id}`);
  if (seen.has(row.id)) errors.push(`${position}: duplicate id ${row.id}`);
  seen.add(row.id);
  if (!allowedAudit.has(row.auditLabel)) errors.push(`${position}: invalid auditLabel ${row.auditLabel}`);
  if (!allowedOracle.has(row.oracleClass)) errors.push(`${position}: invalid oracleClass ${row.oracleClass}`);
  if (row.auditLabel === "STUDENT_ADDED" && !/-H-/.test(row.id)) errors.push(`${position}: student extension must use -H- ID`);
  if (row.auditLabel !== "STUDENT_ADDED" && !/-AI-/.test(row.id)) errors.push(`${position}: AI candidate must retain -AI- ID`);
}

const aiCount = rows.filter((row) => /-AI-/.test(row.id || "")).length;
const humanCount = rows.filter((row) => row.auditLabel === "STUDENT_ADDED").length;
if (aiCount < 35) errors.push(`need at least 35 AI candidates; found ${aiCount}`);
if (humanCount < 5) errors.push(`need at least 5 student extensions; found ${humanCount}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const audits = Object.fromEntries([...allowedAudit].map((label) => [label, rows.filter((row) => row.auditLabel === label).length]));
console.log(JSON.stringify({ file, total: rows.length, aiCount, humanCount, audits, status: "VALID" }, null, 2));
