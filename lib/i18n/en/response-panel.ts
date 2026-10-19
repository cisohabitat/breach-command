import { catalogue } from "../catalogue.ts";

// The strings of components/game/response-panel.tsx (app/page.tsx for page), loaded with it.
export const responsePanelMessages = catalogue({
  responsePanel: {
    "responseSequence": "Response sequence",
    "recorded": " recorded",
    "sectorConstraint": "Sector constraint:",
    "recorded2": " recorded:",
    "whichEndsThe": ", which ends the operation",
    "atRisk": ", at risk",
    "contain": "Contain",
    "assure": "Assure",
    "recover": "Recover",
    "containmentDecision": "Containment decision",
    "assuranceGate": "Assurance gate",
    "recoveryDecision": "Recovery decision",
    "stopTheConfirmed": "Stop the confirmed activity.",
    "proveTheBoundary": "Prove the boundary is ready for restoration.",
    "restoreTrustedService": "Restore trusted service.",
    "balanceAttackerAccess": "Balance attacker access, evidence and operational continuity.",
    "decideWhatMust": "Decide what must be validated or preserved before systems change again.",
    "chooseHowMuch": "Choose how much confidence, time and disruption the organisation can accept.",
    "containment": "Containment",
    "assurance": "Assurance",
    "leavingBusinessImpact2": " {previousTitle}, leaving business impact at {impact} and {getOperationalLabel} at {continuity}.",
    "disruptionConfidenceResidual": "Disruption: {disruption} · confidence: {confidence} · residual risk: {residual}.",
    "endsAt2": "{getOperationalLabel} ends at {continuity}",
  },
});
