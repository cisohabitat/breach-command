import { catalogue } from "../catalogue.ts";

// The strings of components/game/end-state.tsx (app/page.tsx for page), loaded with it.
export const endStateMessages = catalogue({
  endState: {
    "confirmed": "Confirmed",
    "recorded": "Recorded",
    "responseContainmentAssurance": "Response: containment, assurance and recovery.",
    "scored": "Scored",
    "outcomeGrade": "Outcome: grade ",
    "of100": " of 100.",
    "marked": "Marked",
    "clearedInExpert": "Cleared in Expert, on this case’s mastery ladder.",
    "unresolvedStagesRemain": "Unresolved stages remain open questions, not conclusions. The record is preserved for the next shift.",
    "exerciseConcludedAt": "Exercise concluded at the boundary.",
    "clearedInExpert2": "Cleared in Expert: {outcomeTitle}",
    "noClueStanding": "No clue, standing, ruled-out mark or prompt was offered, and every roll was one harder. ",
    "of4Stages": "{revealed} of 4 stages were confirmed. ",
    "impactIsAnd": " Impact is {impact} and {getOperationalLabel} is {continuity}. The captain has closed the active response.",
    "attackChainOf": "Attack chain: {revealed} of 4 stages identified.",
    "impactStandsAt2": "Impact stands at {impact}. No stand-down was issued.",
    "of4Stages2": "{revealed} of 4 stages were identified before the controller confirmed the activity as an authorised exercise. No response phase was run, so containment and recovery are not scored; the decisions you made along the way still are. The case counts as cleared in the campaign: the investigation earned this conclusion.",
  },
});
