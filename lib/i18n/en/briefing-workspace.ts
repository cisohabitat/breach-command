import { catalogue } from "../catalogue.ts";

// The strings of components/game/briefing-workspace.tsx (app/page.tsx for page), loaded with it.
export const briefingWorkspaceMessages = catalogue({
  briefingWorkspace: {
    "incidentCaptain": "Incident Captain",
    "adaptiveComputerFacilitator": "Adaptive computer facilitator",
    "situation": "Situation",
    "actorModel": "Actor model",
    "incidentLog": "Incident log",
    "investigationOpened": "Investigation opened.",
    "hypothesesFindingsAnd": "Hypotheses, findings and actor movements will appear here.",
    "whatIsIn": "What is in scope?",
    "whatIsConfirmed": "What is confirmed?",
    "whatIsThe": "What is the actor doing?",
    "whatIsAt": "What is at risk?",
    "whatLimitsUs": "What limits us?",
    "whatShouldWe": "What should we challenge?",
    "guidanceDisabledIn": "Guidance disabled in Expert",
    "guidedReflection": "Guided reflection",
    "stageRevealed": "Stage revealed",
    "actorAdvanced": "Actor advanced",
    "noNewEvidence": "No new evidence",
    "actionUnsuccessful": "Action unsuccessful",
    "aD20Roll2": "A d20 roll plus its modifier must reach {threshold} to succeed. One of your reading's own sources adds +{ownSourceBonus}, right or wrong; an established source adds +2.",
    "questionsForThe2": "Questions for the captain <span>Free action</span>",
    "entries": { one: "{count} entry", other: "{count} entries" },
  },
  briefingScreen: {
    "fastResolution": "Fast resolution",
    "impact": ", impact ",
  },
});
