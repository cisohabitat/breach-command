import { catalogue } from "../catalogue.ts";

// The strings of components/game/action-sheet.tsx (app/page.tsx for page), loaded with it.
export const actionSheetMessages = catalogue({
  actionSheet: {
    "turnCost": "Every check uses a turn. The plan's effects add to that turn's pressure costs.",
    "checkDetails": "How checks affect evidence and pressure",
    "evidenceConfidence": "Successful exhaustive collection gives strong confidence within its source's coverage; rapid or balanced collection needs a supported causal comparison across different sources to strengthen its interpretation. Signal strength depends on the finding, not the roll total.",
    "scope": " scope",
    "and": " and ",
    "analysis": " analysis",
    "hypothesisCheck": "Test your working reading",
    "roll": "Roll ",
    "howThisModifier": "How this modifier is calculated",
    "noModifiersApply": "No modifiers apply",
    "thisIsPlain": "This is a plain d20 against the difficulty threshold.",
    "scope2": "Scope",
    "selected": "Selected",
    "intensity": "Intensity",
    "successRevealsStage": "Success reveals a stage only when this evidence source matches an undiscovered technique. The plan's effects above add to what every turn costs: time passes, so business impact and adversary progress usually rise and the sector meter wears down. A failed check costs more; finding a stage pushes them back.",
    "runProcedure": "Run procedure",
    "carriedFromYour": "Carried from your last action: ",
    "startingPlan": "Starting plan: ",
    "theseStaySelected": "These stay selected until you change them in the plan options in this sheet.",
    "changeThemIn": "Change them in the plan options in this sheet; whatever you choose stays selected for later turns until you change it.",
    "thisProcedureTests": "This procedure tests your working reading and earns the own-source bonus shown below.",
    "thisProcedureDoes": "This procedure does not directly test your working reading. It may still collect useful evidence, but earns no own-source bonus.",
    "oneBonusIs": "One bonus is unavailable — see why",
    "nothingApplies": "Nothing applies",
    "needBB": ", need <b>{threshold}</b> or better",
    "sourceRestsLonger": { one: "the source rests {count} turn longer", other: "the source rests {count} turns longer" },
  },
});
