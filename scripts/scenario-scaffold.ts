// Builds the draft of a new scenario: one entry for every table a sector needs,
// shaped like the first scenario's entry in the live tables, with every word
// replaced by a TODO the drafts test rejects until it is written. Numbers keep
// the first scenario's values as a starting point. Reading the shapes from the
// live tables keeps the scaffold in step as they change.
import { attacks, scenarioDynamics, scenarios, sectorProcedures } from "../lib/game.ts";
import { infrastructureTopologies, secondSetPieces, sectorSetPieces } from "../lib/phase8.ts";
import { variantTemplates } from "../lib/phase9.ts";
import { objectiveRotation, sectorSystems } from "../lib/command-systems.ts";
import { responseProfiles, scenarioProfiles, sectorDecisionTerms } from "../lib/engine/content.ts";

// Every table that holds one entry per scenario, where it lives, and the entry
// the draft is shaped from.
export const scenarioTables = {
  scenario: { file: "lib/game.ts", table: "scenarios", template: scenarios[0] },
  dynamics: { file: "lib/game.ts", table: "scenarioDynamics", template: scenarioDynamics[0] },
  sectorAction: { file: "lib/game.ts", table: "sectorProcedures", template: sectorProcedures[0] },
  exclusiveTechniques: { file: "lib/game.ts", table: "attacks (three or more, used only by this scenario)", template: [attacks[0], attacks[1], attacks[2]] },
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
const keepAsIs = new Set(["vector", "stage", "icon", "color", "zone", "posture", "kind"]);
function blank(value: unknown, path: string): unknown {
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
