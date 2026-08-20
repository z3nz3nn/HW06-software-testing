import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const args = process.argv.slice(2);
const valueFlags = new Set(["--student-id", "--data-file", "--report-mode"]);
const positional = [];
for (let index = 0; index < args.length; index += 1) {
  if (valueFlags.has(args[index])) {
    index += 1;
  } else if (!args[index].startsWith("--")) {
    positional.push(args[index]);
  }
}
const requestedSuite = positional[0] || "all";
const idFlagIndex = args.indexOf("--student-id");
const studentId = idFlagIndex >= 0 ? args[idFlagIndex + 1] : process.env.STUDENT_ID;
const dataFlagIndex = args.indexOf("--data-file");
const dataOverride = dataFlagIndex >= 0 ? args[dataFlagIndex + 1] : null;
const reportModeIndex = args.indexOf("--report-mode");
const reportMode = reportModeIndex >= 0 ? args[reportModeIndex + 1] : "full";
const suppressExitCode = args.includes("--suppress-exit-code");

if (!studentId) {
  console.error("Missing student ID. Use --student-id YOUR_ID or set STUDENT_ID.");
  process.exit(2);
}
if (!new Set(["full", "compact"]).has(reportMode)) {
  console.error("--report-mode must be full or compact.");
  process.exit(2);
}
if (dataOverride && requestedSuite === "all") {
  console.error("--data-file requires one named suite.");
  process.exit(2);
}

const evidenceDir = path.join(repoRoot, "evidence", "newman");
const consoleDir = path.join(repoRoot, "evidence", "console");
fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(consoleDir, { recursive: true });

const safeTimestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const backendDir = path.join(repoRoot, "sut", "eshop-sut", "backend");
const serverLog = fs.createWriteStream(path.join(consoleDir, `sut-${safeTimestamp}.log`));
const fixtureLog = fs.createWriteStream(path.join(consoleDir, `fixture-${safeTimestamp}.log`));

function startNode(script, cwd, log) {
  const child = spawn(process.execPath, [script], { cwd, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  return child;
}

async function waitFor(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function runCommand(command, commandArgs, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, { cwd, stdio: "inherit", shell: false });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

const suites = {
  "reset-password": { folder: "Reset Password", data: "reset-password.json" },
  "apply-coupon": { folder: "Apply Coupon", data: "apply-coupon.json" },
  "import-products": { folder: "Import Products", data: "import-products.json" },
};

const selected = requestedSuite === "all"
  ? Object.entries(suites)
  : Object.entries(suites).filter(([key]) => key === requestedSuite);

if (selected.length === 0) {
  console.error(`Unknown suite: ${requestedSuite}`);
  process.exit(2);
}

const sut = startNode(path.join(backendDir, "server.js"), backendDir, serverLog);
const fixture = startNode(path.join(scriptDir, "fixture-server.mjs"), repoRoot, fixtureLog);
let worstExit = 0;

try {
  await waitFor("http://127.0.0.1:3000/api/products");
  await waitFor("http://127.0.0.1:3001/fixture/health");

  const newmanCli = path.join(repoRoot, "node_modules", "newman", "bin", "newman.js");

  for (const [key, suite] of selected) {
    const base = path.join(evidenceDir, `${key}-${safeTimestamp}`);
    const reporters = reportMode === "full" ? "cli,json,junit,htmlextra" : "cli,junit,htmlextra";
    const newmanArgs = [
      "run", path.join(repoRoot, "postman", "HW06-EShop.postman_collection.json"),
      "--environment", path.join(repoRoot, "postman", "HW06-Local.postman_environment.json"),
      "--folder", suite.folder,
      "--iteration-data", dataOverride ? path.resolve(repoRoot, dataOverride) : path.join(repoRoot, "postman", "data", suite.data),
      "--env-var", `studentId=${studentId}`,
      "--reporters", reporters,
      "--reporter-junit-export", `${base}.xml`,
      "--reporter-htmlextra-export", `${base}.html`,
      "--color", "on",
    ];
    if (reportMode === "full") newmanArgs.push("--reporter-json-export", `${base}.json`);
    console.log(`\n=== Running ${key} with X-Student-Id: ${studentId} ===`);
    const code = await runCommand(process.execPath, [newmanCli, ...newmanArgs], repoRoot);
    worstExit = Math.max(worstExit, code);
  }
} finally {
  sut.kill("SIGTERM");
  fixture.kill("SIGTERM");
  serverLog.end();
  fixtureLog.end();
}

process.exit(suppressExitCode ? 0 : worstExit);
