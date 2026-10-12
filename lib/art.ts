import { runsOperationalTechnology } from "./scenarios.ts";

const evidenceSources = new Set(["email", "identity", "network", "firewall", "dns", "server", "cloud", "forensic", "intel", "hunt"]);

// Source and sector only: artwork must never read the hidden technique.
export function evidenceArtFor(procedure: string, scenario: number): string {
  if (runsOperationalTechnology(scenario) && (procedure === "server" || procedure === "endpoint")) return "maintenance";
  return evidenceSources.has(procedure) ? procedure : "telemetry";
}
