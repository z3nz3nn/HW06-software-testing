import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const log = execFileSync("git", ["log", "--date=iso-strict", "--pretty=format:%H | %ad | %an | %s"], { encoding: "utf8" });
const output = path.resolve("reports/git-commit-log.txt");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${log}\n`, "utf8");
console.log(`Wrote ${output}`);
