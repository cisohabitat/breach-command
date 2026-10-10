// Builds the draft of a new scenario: one entry for every table a sector needs,
// shaped like the first scenario's entry in the live tables, with every word
// replaced by a TODO the drafts test rejects until it is written. Numbers keep
// the first scenario's values as a starting point. Reading the shapes from the
// live tables keeps the scaffold in step as they change.
import { attackMitre, attacks, scenarioDynamics, scenarios, sectorProcedures } from "../lib/game.ts";
import { infrastructureTopologies, secondSetPieces, sectorSetPieces } from "../lib/phase8.ts";
import { variantTemplates } from "../lib/phase9.ts";
import { objectiveRotation, sectorSystems } from "../lib/command-systems.ts";
import { responseProfiles, scenarioProfiles, sectorDecisionTerms } from "../lib/engine/content.ts";

const firstAtEachStage = [0, 1, 2, 3].map(stage => attacks.find(attack => attack.stage === stage)!);

// Every table that holds one entry per scenario, where it lives, and the entry
// the draft is shaped from.
export const scenarioTables = {
  scenario: { file: "lib/scenarios.ts", table: "scenarios", template: scenarios[0] },
  dynamics: { file: "lib/game.ts", table: "scenarioDynamics", template: scenarioDynamics[0] },
  sectorAction: { file: "lib/game.ts", table: "sectorProcedures", template: sectorProcedures[0] },
  // One per stage: every stage draws from a pool of the same size, so a sector
  // adds to each stage or the pools drift apart.
  exclusiveTechniques: { file: "lib/game.ts", table: "attacks (one per stage, used only by this scenario)", template: firstAtEachStage },
  exclusiveMitre: { file: "lib/game.ts", table: "attackMitre (the ATT&CK ids of each exclusive technique, in the same order)", template: firstAtEachStage.map(attack => attackMitre[attack.id]) },
  topology: { file: "lib/phase8.ts", table: "infrastructureTopologies", template: infrastructureTopologies[0] },
  firstCrisis: { file: "lib/phase8.ts", table: "sectorSetPieces", template: sectorSetPieces[0] },
  secondCrisis: { file: "lib/phase8.ts", table: "secondSetPieces", template: secondSetPieces[0] },
  sectorSystem: { file: "lib/command-systems.ts", table: "sectorSystems", template: sectorSystems[0] },
  objectives: { file: "lib/command-systems.ts", table: "objectiveRotation", template: objectiveRotation[0] },
  variants: { file: "lib/phase9.ts", table: "variantTemplates (seven; the first three never move once shipped)", template: variantTemplates[0] },
  responses: { file: "lib/engine/content.ts", table: "responseProfiles", template: responseProfiles[0] },
  adversaries: { file: "lib/engine/content.ts", table: "scenarioProfiles", template: scenarioProfiles[0] },
  decisionTerms: { file: "lib/engine/content.ts", table: "sectorDecisionTerms", template: sectorDecisionTerms[0] },
} as const;

// Ids and enumerated values keep their form so the shape type-checks; every
// other string becomes a TODO naming where it goes.
// The icon is a component, which would serialise as {}, so it becomes a TODO too.
const keepAsIs = new Set(["vector", "stage", "color", "zone", "posture", "kind"]);
function blank(value: unknown, path: string): unknown {
  if (path.endsWith(".icon")) return `TODO: ${path} (a lucide-react icon, imported in lib/scenarios.ts)`;
  if (typeof value === "string") return keepAsIs.has(path.split(".").at(-1) ?? "") ? value : `TODO: ${path}`;
  if (Array.isArray(value)) return value.map((item, index) => blank(item, `${path}[${index}]`));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blank(item, `${path}.${key}`)]));
  return value;
}

export function scaffold(slug: string) {
  const draft = Object.fromEntries(Object.entries(scenarioTables).map(([section, { template }]) => [section, blank(template, section)]));
  const where = Object.entries(scenarioTables).map(([section, { file, table }]) => `//   ${section}: ${file}, ${table}`).join("\n");
  return `// Draft scenario "${slug}", scaffolded by pnpm new-scenario. Replace every TODO;
// pnpm validate:content lists the ones left. When none are, wire each section
// into its table (docs/CONTENT.md) and delete this file:
${where}
export const draft = ${JSON.stringify(draft, null, 2)};
`;
}

export function todosIn(value: unknown, path = ""): string[] {
  if (typeof value === "string") return value.startsWith("TODO") ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((item, index) => todosIn(item, `${path}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => todosIn(item, path ? `${path}.${key}` : key));
  return [];
}
