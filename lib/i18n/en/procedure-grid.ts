import { catalogue } from "../catalogue.ts";

// The strings of components/game/procedure-grid.tsx (app/page.tsx for page), loaded with it.
export const procedureGridMessages = catalogue({
  procedureGrid: {
    "focusReading": "Focus on ready sources for this reading",
    "showAllSources": "Show all collection sources",
    "sourcesShown": "Sources shown: {shown}/{total}. This view uses published coverage and cooldowns; it does not identify the hidden technique.",
    "noReadySource": "No ready source can test this reading. Show all sources to review cooldowns, or revise the reading.",
    "establishedSource": "Established source ",
    "canAlsoTest": "Can also test this reading",
    "failedInconclusive": " failed, inconclusive",
    "establishedPlus2": ", established, plus 2",
    "ownSourceForReading": ", own source for this reading",
    "cannotSeeThis": ", cannot see this stage for the current reading",
    "canAlsoTest2": ", can also test the current reading",
    "checkedTimesWith": ", checked {spent} times with no stage found",
    "attemptsFailedWithout": ", {inconclusive} attempts failed without a result",
    "availableInTurns": ", available in {cooldown} turns",
    "onCooldown": "On cooldown",
    "checkedNoStage": "Checked {spent}×, no stage found",
    "turnPlural": { one: "{count} turn", other: "{count} turns" },
    "attempt2Plural": { one: "{count} attempt", other: "{count} attempts" },
    "ownSourceSpan": "Own source <span>+{ownSourceBonus}</span>, can't test this reading here",
    "ownSourceSpan2": "Own source <span>+{ownSourceBonus}</span>",
  },
});
