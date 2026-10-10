// Everything an operation needs and the assignment screen does not, as one
// script group: the game screen, every dialog, the engine, the session's
// migration, the Bot Commander, the engine's catalogue and the glossary.
// Loaded only through lib/game-loader.ts. Bundlers copy a module that several
// lazily loaded parts import into each of their scripts, so the parts and what
// they share load together, once, and nothing on the first load imports the
// engine (tests/first-load.test.ts).
import "@/lib/i18n/engine-messages";

export * as engine from "@/lib/advanced-game";
export * as session from "@/lib/session";
export * as glossary from "@/lib/glossary";
export { chooseBotAction } from "@/lib/game-bot";
export { GameScreen } from "./game-screen";
export { ActionSheet } from "./action-sheet";
export { RollDialog } from "./roll-dialog";
export { MissionBriefingDialog } from "./mission-briefing-dialog";
export { CaptainReportDialog } from "./captain-report-dialog";
export { FieldGuideDialog } from "./field-guide-dialog";
export { DebriefDialog } from "./debrief-dialog";
export { SettingsDialog } from "./settings-dialog";
export { NewIncidentDialog } from "./new-incident-dialog";
