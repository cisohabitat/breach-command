// References to the content a stored message quotes, by the paths
// lib/i18n/content/walk.ts gives them, so a save reads in whatever language
// the content is in when it is shown. One place for the paths, so the engine
// names what it means: words.attack(id, "evidence"), not a string.
import { ref, type Form } from "../i18n/message.ts";
import { sectorProcedures } from "../game.ts";
import { sectorSetPieces } from "../phase8.ts";
import type { DecisionLanguage } from "./content.ts";

export const words = {
  attack: (id: string, field: "title" | "evidence" | "clue") => ref(`attacks.${id}.${field}`),
  procedure: (id: string, form?: Form) => ref(`${sectorProcedures.some(item => item.id === id) ? "sectorProcedures" : "procedures"}.${id}.title`, undefined, form),
  node: (scenario: number, node: string) => ref(`infrastructureTopologies.${scenario}.nodes.${node}.label`),
  criticalRule: (scenario: number) => ref(`infrastructureTopologies.${scenario}.criticalRule`),
  escalation: (scenario: number, index: number) => ref(`scenarioDynamics.${scenario}.escalations.${index}`),
  reaction: (scenario: number) => ref(`scenarioDynamics.${scenario}.reaction`),
  inject: (id: string) => ref(`injects.${id}.title`),
  profile: (id: string) => ref(`adversaryProfiles.${id}.title`),
  // A decision's wording in the sector's own terms, which it names as {owners}
  // and {service}.
  decision: (scenario: number, stage: number, field: keyof DecisionLanguage) => ref(`decisionLanguage.${stage}.${field}`, { owners: ref(`sectorDecisionTerms.${scenario}.owners`), service: ref(`sectorDecisionTerms.${scenario}.service`) }),
  decisionEffect: (choice: string) => ref(`decisionEffects.${choice}`),
  command: (id: string, choice: string, field: "title" | "signal") => ref(`commandEvents.${id}.${choice}.${field}`),
  setPiece: (id: string, choice: string, field: "title" | "detail") => ref(`${sectorSetPieces.some(item => item.id === id) ? "sectorSetPieces" : "secondSetPieces"}.${id}.${choice}.${field}`),
  stage: (index: number, form?: Form) => ref(`stages.${index}.name`, undefined, form),
  route: (hypothesis: string, form?: Form) => ref(`hypotheses.${hypothesis}.title`, undefined, form),
};
