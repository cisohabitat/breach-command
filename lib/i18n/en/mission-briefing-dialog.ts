import { catalogue } from "../catalogue.ts";

// The strings of components/game/mission-briefing-dialog.tsx (app/page.tsx for page), loaded with it.
export const missionBriefingDialogMessages = catalogue({
  fieldGuideDialog: {
    "sectorCondition": "Sector condition",
  },
  gameScreen: {
    "whatMovesIt": "What moves it",
  },
  missionBriefingDialog: {
    "deployedSpecialist": "Deployed specialist",
    "attribution": "Attribution",
    "operationContext": "Operation context",
    "mode": "MODE",
    "incidentVariant": "Incident variant",
    "directorIntent": "Director’s intent",
    "establishTheChain": "Establish the chain, declare an objective theory and preserve the essential service.",
    "assumeCommand": "Assume command",
    "theOperationEnds2": "{plain} The operation ends if it reaches zero.",
    "formBc1002": "Form BC-100 <span>/</span> Mission brief, case {scenario}",
    "strongYourFirst": "<strong>Your first move</strong>Assume command, open Investigate and choose a working reading. Then run a source that can test it at this stage.",
  },
  commandWorkspace: {
    "campaignRoute": "Campaign route",
  },
});
