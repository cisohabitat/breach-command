// Every message key, as types only: importing this pulls no catalogue into a bundle.
import type { en } from "./en.ts";
import type { actionSheetMessages } from "./en/action-sheet.ts";
import type { botControlMessages } from "./en/bot-control.ts";
import type { briefingScreenMessages } from "./en/briefing-screen.ts";
import type { briefingWorkspaceMessages } from "./en/briefing-workspace.ts";
import type { captainReportDialogMessages } from "./en/captain-report-dialog.ts";
import type { commandEventMessages } from "./en/command-event.ts";
import type { commandWorkspaceMessages } from "./en/command-workspace.ts";
import type { debriefDialogMessages } from "./en/debrief-dialog.ts";
import type { effectListMessages } from "./en/effect-list.ts";
import type { engineMessages } from "./en/engine.ts";
import type { endStateMessages } from "./en/end-state.ts";
import type { evidenceWorkspaceMessages } from "./en/evidence-workspace.ts";
import type { facilitatorSheetMessages } from "./en/facilitator-sheet.ts";
import type { faultBoundaryMessages } from "./en/fault-boundary.ts";
import type { fieldGuideDialogMessages } from "./en/field-guide-dialog.ts";
import type { gameScreenMessages } from "./en/game-screen.ts";
import type { hypothesisBoardMessages } from "./en/hypothesis-board.ts";
import type { infrastructureConsoleMessages } from "./en/infrastructure-console.ts";
import type { investigateWorkspaceMessages } from "./en/investigate-workspace.ts";
import type { knownFactsMessages } from "./en/known-facts.ts";
import type { livingIncidentMessages } from "./en/living-incident.ts";
import type { missionBriefingDialogMessages } from "./en/mission-briefing-dialog.ts";
import type { newIncidentDialogMessages } from "./en/new-incident-dialog.ts";
import type { operationsMapMessages } from "./en/operations-map.ts";
import type { pageMessages } from "./en/page.ts";
import type { procedureGridMessages } from "./en/procedure-grid.ts";
import type { responsePanelMessages } from "./en/response-panel.ts";
import type { rollDialogMessages } from "./en/roll-dialog.ts";
import type { sectorBoardMessages } from "./en/sector-board.ts";
import type { sectorSetPieceMessages } from "./en/sector-set-piece.ts";
import type { settingsDialogMessages } from "./en/settings-dialog.ts";
import type { tutorialCoachMessages } from "./en/tutorial-coach.ts";
export type MessageKey = keyof typeof en
  | keyof typeof actionSheetMessages
  | keyof typeof botControlMessages
  | keyof typeof briefingScreenMessages
  | keyof typeof briefingWorkspaceMessages
  | keyof typeof captainReportDialogMessages
  | keyof typeof commandEventMessages
  | keyof typeof commandWorkspaceMessages
  | keyof typeof debriefDialogMessages
  | keyof typeof effectListMessages
  | keyof typeof engineMessages
  | keyof typeof endStateMessages
  | keyof typeof evidenceWorkspaceMessages
  | keyof typeof facilitatorSheetMessages
  | keyof typeof faultBoundaryMessages
  | keyof typeof fieldGuideDialogMessages
  | keyof typeof gameScreenMessages
  | keyof typeof hypothesisBoardMessages
  | keyof typeof infrastructureConsoleMessages
  | keyof typeof investigateWorkspaceMessages
  | keyof typeof knownFactsMessages
  | keyof typeof livingIncidentMessages
  | keyof typeof missionBriefingDialogMessages
  | keyof typeof newIncidentDialogMessages
  | keyof typeof operationsMapMessages
  | keyof typeof pageMessages
  | keyof typeof procedureGridMessages
  | keyof typeof responsePanelMessages
  | keyof typeof rollDialogMessages
  | keyof typeof sectorBoardMessages
  | keyof typeof sectorSetPieceMessages
  | keyof typeof settingsDialogMessages
  | keyof typeof tutorialCoachMessages;
export const catalogueFiles = ["action-sheet", "bot-control", "briefing-screen", "briefing-workspace", "captain-report-dialog", "command-event", "command-workspace", "debrief-dialog", "effect-list", "engine", "end-state", "evidence-workspace", "facilitator-sheet", "fault-boundary", "field-guide-dialog", "game-screen", "hypothesis-board", "infrastructure-console", "investigate-workspace", "known-facts", "living-incident", "mission-briefing-dialog", "new-incident-dialog", "operations-map", "page", "procedure-grid", "response-panel", "roll-dialog", "sector-board", "sector-set-piece", "settings-dialog", "tutorial-coach"];
