// Fail closed on registry errors, new advisories, or a newly published fix for
// the one reviewed development-tool exception. Never exempt a production path.
import { spawnSync } from "node:child_process";

type Advisory = {
  title: string;
  url: string;
  severity: string;
  patched_versions: string | null;
  findings: { paths: string[] }[];
};
const result = spawnSync("pnpm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
if (result.error || (result.status !== 0 && result.status !== 1)) {
  console.error("Dependency audit failed to run.");
  process.exit(1);
}
let report: { advisories?: Record<string, Advisory>; metadata?: { vulnerabilities?: object }; error?: unknown };
try { report = JSON.parse(result.stdout); } catch {
  console.error("Dependency audit returned an unreadable report.");
  process.exit(1);
}
if (report.error || !report.advisories || !report.metadata?.vulnerabilities) {
  console.error("Dependency audit did not return a vulnerability report.");
  process.exit(1);
}
let failed = false;
for (const advisory of Object.values(report.advisories)) {
  const paths = advisory.findings.flatMap(finding => finding.paths);
  const reviewed = advisory.url === "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm"
    && !advisory.patched_versions && paths.length > 0
    && paths.every(path => path.startsWith(".>eslint-config-next>"));
  if (reviewed) console.log(`Reviewed development-only exception (no published fix): ${advisory.url}`);
  else {
    console.error(`${advisory.severity}: ${advisory.title} — ${advisory.url}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("Dependency audit passed; see docs/SECURITY-REVIEW.md for the bounded exception.");
