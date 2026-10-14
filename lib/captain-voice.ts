export type CaptainVoiceCue = "opening" | `opening${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | "firstFinding" | "connectedFindings" | "thirdFinding" | "unexpectedFinding" | "pressure" | "serviceStabilising" | "failedCheck" | "weakSignal" | "newDevelopment" | "noFinding" | "noFindingAgain" | "response" | "assurance" | "recovery" | "won" | "lost" | "exercise" | "debrief" | "reviewControlled" | "reviewStable" | "reviewCostly" | "reviewFragile" | "reviewObjective" | "reviewImpact" | "reviewContinuityLost" | "reviewSector" | "reviewWindow" | "reviewExercise" | "reviewContain" | "reviewObserve" | "reviewAttribute" | "reviewNotify" | "reviewAct" | "reviewEvidence" | "reviewContinuity" | "reviewAligned" | "reviewNoStrength" | "reviewReading" | "reviewDecisions" | "reviewServices" | "reviewPractice";

export function captainOpeningFor(scenario: number): CaptainVoiceCue {
  return scenario >= 1 && scenario <= 9 ? ("opening" + scenario) as CaptainVoiceCue : "opening";
}
