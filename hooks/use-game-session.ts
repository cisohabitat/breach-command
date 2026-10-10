"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type {
  Difficulty,
  GameMode,
  ProcedureIntensity,
  ProcedureScope,
  SpecialistId,
  HypothesisId,
  Game,
  Turn,
  AdversaryObjectiveId,
  DecisionChoice,
  MapAction,
  SetPieceChoice,
} from "@/lib/advanced-game";
import { difficulties, hypotheses, scenarios } from "@/lib/game";
import { adversaryObjectives } from "@/lib/command-systems";
import { countRevisions } from "@/lib/engine/revisions";
import { loadGame, loadedGame } from "@/lib/game-loader";
import { PARKED_SESSION_KEY, SESSION_KEY } from "@/lib/session-keys";
import type { SavedSession } from "@/lib/session";
import { campaignAct, campaignChanges, campaignEnding, campaignStory, campaignReadable, campaignTier, defaultCampaign, nextCase, parseCampaign, recordCampaignResult, CAMPAIGN_KEY, type CampaignState } from "@/lib/campaign";
import { playFeedback, setAdaptiveScore } from "@/lib/feedback-lazy";
import { clearTelemetry, parseTelemetry, readTelemetry, recordTelemetry, writeTelemetry, type BalanceTelemetry } from "@/lib/telemetry";
import { readStored, removeStored, storageWritable, writeStored } from "@/lib/storage";
import { readLastOperation, writeLastOperation, type LastOperation } from "@/lib/last-operation";
import { parseLedger, readLedger, writeLedger, type LedgerEntry } from "@/lib/ledger";
import { encodeChallenge } from "@/lib/phase8";
import { lit, msg, type Message } from "@/lib/i18n/message";
import { words } from "@/lib/engine/words";
import { register } from "@/lib/i18n";
import { sessionMessages } from "@/lib/i18n/en/session";

register(sessionMessages);

import { seededChallengeRandom } from "@/lib/phase8";
import { campaignRoutes, incidentVariant, routeForCampaign } from "@/lib/phase9";
import { weeklyOperation } from "@/lib/command-systems";
import type { BotAction } from "@/lib/game-bot";
import { usePreferences } from "@/hooks/use-preferences";
import { useChallengeCode } from "@/hooks/use-challenge-code";
import { useIncidentStateTool } from "@/hooks/use-incident-state-tool";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { CONTINUITY_AT_RISK, IMPACT_CRITICAL, OBJECTIVE_IMMINENT, useMeterPulse } from "@/hooks/use-meter-pulse";

type WorkspaceView = "command" | "investigate" | "briefing";

export { CONTINUITY_AT_RISK, IMPACT_CRITICAL, OBJECTIVE_IMMINENT, type MeterPulse } from "@/hooks/use-meter-pulse";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}


// The engine is in the game bundle; an operation exists only once it has loaded.
const engine = () => loadedGame().engine;

export function useGameSession() {
  const [game, setGame] = useState<Game | null>(null);
  const [guided, setGuided] = useState(true);
  const [fastResolve, setFastResolve] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("operational");
  const [selected, setSelected] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [die, setDie] = useState(20);
  const [report, setReport] = useState<Turn | null>(null);
  const [inlineReport, setInlineReport] = useState<Turn | null>(null);
  const [rules, setRules] = useState(false);
  const [newConfirm, setNewConfirm] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [debrief, setDebrief] = useState(false);
  const [scenarioChoice, setScenarioChoice] = useState(0);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [announcement, setAnnouncement] = useState<Message | null>(null);
  const [settings, setSettings] = useState(false);
  const [mode, setMode] = useState<GameMode>("campaign");
  const [specialist, setSpecialist] = useState<SpecialistId>("hunter");
  const [actionScope, setActionScope] = useState<ProcedureScope>("focused");
  const [actionIntensity, setActionIntensity] = useState<ProcedureIntensity>("balanced");
  const [missionBriefing, setMissionBriefing] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [telemetry, setTelemetry] = useState<BalanceTelemetry>(() => readTelemetry());
  // Read after mount with the campaign, never in the initialiser of a prerendered page.
  const [lastOperation, setLastOperation] = useState<LastOperation | null>(null);
  // Every operation played to an end on this device, read after mount like the campaign.
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  // A finished operation set up again for the Bot Commander to play. Its seed
  // reproduces the chain, the adversary and the rolls; its variant and route
  // are carried as they were, because the campaign's route may have moved since
  // and an odd variant meets the sector's other crisis.
  const replayRef = useRef<{ scenario: number; variant: Game["variant"]; campaignRoute: Game["campaignRoute"] } | null>(null);
  const [replay, setReplay] = useState<{ scenario: number; difficulty: Game["difficulty"] } | null>(null);
  const [campaign, setCampaign] = useState<CampaignState>(defaultCampaign);
  // What the last finished operation did to the campaign, for the review.
  const [campaignChange, setCampaignChange] = useState<Message[]>([]);
  const [backupInput, setBackupInput] = useState("");
  const [backupMessage, setBackupMessage] = useState<Message | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceView>("command");
  const [storageNotice, setStorageNotice] = useState<Message | null>(null);
  const { soundEnabled, setSoundEnabled, musicEnabled, setMusicEnabled, hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast, shortcutsEnabled, setShortcutsEnabled } = usePreferences(setStorageNotice);
  const { todaySeed, seedFor, applyCode, spendChallenge, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed, codeFor } = useChallengeCode(setup => {
    setScenarioChoice(setup.scenario);
    setDifficulty(setup.difficulty);
    setMode(setup.mode);
    setSpecialist(setup.specialist);
  });

  const [pendingUndo, setPendingUndo] = useState<{ label: Message; game: Game } | null>(null);
  const { meterPulse, pulseMeters, clearMeterPulse } = useMeterPulse();
  const [botEnabled, setBotEnabled] = useState(false);
  const [botRun, setBotRun] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [botPaused, setBotPaused] = useState(false);
  const [botStatus, setBotStatus] = useState<Message>(msg("session.botWaiting"));
  const stateRef = useRef(game);
  const campaignRef = useRef(campaign);
  const busyRef = useRef(false);
  const botRunRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Whether the operation in hand has had its result recorded. It belongs to the
  // operation, not to its shape: two losses on the same turn of the same
  // scenario are two results.
  const recordedRef = useRef(false);
  // A saved operation restored from a backup while another is in play. The one
  // in play stops overwriting the save, and returning to assignments offers the
  // restored one instead of deleting it.
  const importedRef = useRef<SavedSession | null>(null);

  const activeScenario = scenarios[game?.scenario ?? scenarioChoice];
  const ScenarioIcon = activeScenario.icon;
  const proc = game ? engine().procedureById(game, selected ?? "") : undefined;
  const ended = !!game && ["won", "lost", "exercise"].includes(game.status);
  const config = game ? difficulties[game.difficulty] : difficulties[difficulty];
  const decision = game ? engine().getDecisionOptions(game) : null;
  const guidance = game ? engine().guidanceLevel(game, guided) : "off";
  const trainingPrompt = game ? engine().getTrainingPrompt(game, guided) : null;
  const responseProfile = game ? engine().responseOptionsFor(game) : null;
  const outcome = game ? engine().getOutcome(game) : null;
  const activeHypothesis = game ? hypotheses.find(item => item.id === game.hypothesis) : null;
  const procedureAligned = !!proc && !!game && !!activeHypothesis && engine().hypothesisSources(game, activeHypothesis.id).includes(proc.id);
  const currentAct = campaignAct(campaign.completed.length);
  const currentRouteId = routeForCampaign(campaign);
  const currentRoute = campaignRoutes[currentRouteId];
  const currentStory = campaignStory(campaign, currentRouteId);
  const previewSeed = seedFor(mode).seed;
  const previewVariant = previewSeed === null ? null : incidentVariant(scenarioChoice, currentRouteId, previewSeed);
  const finalEnding = campaignEnding(campaign);
  const challengeCode = codeFor(scenarioChoice, difficulty, mode, specialist);

  // A newer build's save found on load. It is moved aside, never overwritten,
  // before anything else is written to the save slot.
  const newerSaveRef = useRef<string | null>(null);
  function parkNewerSave() {
    if (!newerSaveRef.current) return;
    writeStored(PARKED_SESSION_KEY, newerSaveRef.current);
    newerSaveRef.current = null;
  }

  function clearStoredSession() {
    parkNewerSave();
    removeStored(SESSION_KEY);
    setSavedSession(null);
  }


  async function start(index = scenarioChoice) {
    if (busyRef.current) return;
    await loadGame();
    clearStoredSession();
    importedRef.current = null;
    recordedRef.current = false;
    // Daily Operation and any challenge configuration promise that the same
    // code replays the same operation, so those runs draw their hidden chain from
    // the seed and carry it into the procedure rolls. Ordinary campaign play draws
    // both fresh, or a restart would replay a chain the player has already seen.
    const { seed: nextSeed, reproducible } = seedFor(mode);
    const seed = nextSeed ?? todaySeed();
    const random = reproducible ? seededChallengeRandom(seed) : undefined;
    const posture = campaign.commandPosture.observe > campaign.commandPosture.act + 2 ? "observe" : campaign.commandPosture.act > campaign.commandPosture.observe + 2 ? "act" : "balanced";
    const replaying = replayRef.current?.scenario === index ? replayRef.current : null;
    replayRef.current = null;
    setReplay(null);
    const route = replaying?.campaignRoute ?? routeForCampaign(campaign);
    const automated = botEnabled;
    const next = engine().newGame(index, difficulty, random, { mode, specialist, campaignTier: campaignTier(campaign.xp), inheritedFatigue: campaign.specialistFatigue[specialist] ?? 0, readiness: campaign.readiness, leadershipTrust: campaign.leadershipTrust, unresolvedThreads: campaign.unresolvedThreads, doctrine: posture, campaignRoute: route, variant: replaying?.variant ?? incidentVariant(index, route, seed), seed: reproducible ? seed : null, recentCommands: campaign.recentCommands, recentInjects: campaign.recentInjects, recentCrises: campaign.recentCrises });
    spendChallenge();
    setGame(next);
    // A new operation starts on the default plan; Exhaustive carried over from
    // the last one became a new operation's "Starting plan" unasked.
    setActionScope("focused");
    setActionIntensity("balanced");
    botRunRef.current = automated;
    setBotRun(automated);
    setBotActive(automated);
    setBotPaused(false);
    setBotStatus(automated ? msg("session.botReviewing") : msg("session.botWaiting"));
    setGuided(mode === "expert" ? false : guided);
    const tutorialComplete = readStored("breach-command.tutorial-complete") === "true";
    setTutorial(automated ? false : !tutorialComplete);
    setMissionBriefing(true);
    setSelected(null);
    setReport(null);
    setInlineReport(null);
    setQuestion(null);
    setDebrief(false);
    setNewConfirm(false);
    setPendingUndo(null);
    clearMeterPulse();
    setAnnouncement(msg("session.newInvestigation"));
    setActiveWorkspace("command");
    playFeedback("open", soundEnabled, hapticsEnabled);
    setAdaptiveScore(musicEnabled, 0.15, index);
    if (!automated) {
      recordTelemetry("start", { scenario: index });
      setTelemetry(readTelemetry());
    }
    scrollToTop();
  }

  function resume(session: SavedSession) {
    importedRef.current = null;
    recordedRef.current = false;
    botRunRef.current = false;
    setBotRun(false);
    setBotActive(false);
    setBotPaused(false);
    setGame(session.game);
    setGuided(session.guided);
    setFastResolve(session.fastResolve);
    setDifficulty(session.game.difficulty);
    setScenarioChoice(session.game.scenario);
    setReport(session.game.pendingDecision ? session.game.turns.at(-1) ?? null : null);
    setInlineReport(null);
    setSavedSession(null);
    setPendingUndo(null);
    clearMeterPulse();
    setAnnouncement(msg("session.resumed", { title: lit(scenarios[session.game.scenario].title) }));
    // A saved operation already in the response phase has no investigation left to
    // resume into — that workspace is disabled — so the response sequence, which is
    // itself a blocking decision, sends the player to Command like any other.
    const blocked = session.game.pendingDecision || session.game.pendingCommand || session.game.pendingSetPiece || session.game.status === "response";
    setActiveWorkspace(blocked ? "command" : "investigate");
    scrollToTop();
  }

  function run(id: string, plan = { scope: actionScope, intensity: actionIntensity }) {
    const current = stateRef.current;
    if (!current || busyRef.current || current.status !== "playing" || current.pendingDecision || current.pendingCommand || current.pendingSetPiece || engine().availableIn(current, id) > 0) return;
    busyRef.current = true;
    const quick = fastResolve && current.turns.length > 0;
    setSelected(null);
    setInlineReport(null);
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!quick) {
      setRolling(true);
      interval = setInterval(() => setDie(1 + Math.floor(Math.random() * 20)), 80);
      timers.current.push(interval);
    }
    const timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      // Whatever happens while the turn resolves, the game must not be left
      // refusing every later action.
      try { resolveRun(); } finally {
        busyRef.current = false;
        setRolling(false);
      }
    }, quick ? 0 : 850);
    timers.current.push(timeout);

    const resolveRun = () => {
      const next = engine().playTurn(current, id, undefined, plan);
      const result = next.turns.at(-1)!;
      // Fast resolution is the switch that means "skip the ceremony". Without it
      // every turn gets the captain's report, including the turn that found
      // nothing — which is the turn whose result most needs explaining, and which
      // used to pass with only a strip in the column the player had just left.
      const requiresDialog = !quick || !!result.revealed || !!result.inject || !!result.adversaryEvent || next.status !== "playing";
      setDie(result.raw);
      setGame(next);
      pulseMeters(current, next);
      if (next.pendingDecision || next.pendingCommand || next.pendingSetPiece || next.status !== "playing") setActiveWorkspace("command");
      setReport(requiresDialog ? result : null);
      setInlineReport(requiresDialog ? null : result);
      // A procedure cannot be undone. Its result is information — a stage found,
      // a source that came back empty, a failed roll — and taking the turn back
      // after seeing it would hand the player the answer or a free re-roll.
      setPendingUndo(null);
      setRolling(false);
      setAnnouncement(msg(result.success ? "session.turnSucceeded" : "session.turnUnsuccessful", { number: result.number, impact: next.impact, label: lit(engine().getOperationalLabel(next)), continuity: next.continuity, progress: next.objectiveProgress }));
      playFeedback(next.status === "lost" ? "lost" : result.adversaryEvent ? "warning" : result.revealed ? "find" : result.success ? "success" : "failure", soundEnabled, hapticsEnabled, {
        procedure: result.procedure,
        success: result.success,
        roll: result.raw,
        total: result.total,
        threshold: difficulties[next.difficulty].threshold,
        impact: next.impact,
        continuity: next.continuity,
        turn: result.number,
        stageRevealed: !!result.revealed,
      });
      if (!botRunRef.current) {
        recordTelemetry("turn", { procedure: id });
        setTelemetry(readTelemetry());
      }
      if (["lost", "exercise"].includes(next.status)) recordProgress(next);
    };
  }

  function decide(choice: DecisionChoice) {
    const current = stateRef.current;
    if (!current) return;
    const next = engine().resolveDecision(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    afterStep(next, "investigate");
    playFeedback("decision", soundEnabled, hapticsEnabled);
    setAnnouncement(msg("session.decisionRecorded", { impact: next.impact, label: lit(engine().getOperationalLabel(next)), continuity: next.continuity }));
  }

  // Where the player goes after a step, and the record of an operation that step
  // ended. Any transition that moves a meter can end an operation, not only a
  // procedure or the response, and an ended one is only ever shown on Command.
  function afterStep(next: Game, returnTo?: WorkspaceView) {
    const blocked = !!next.pendingDecision || !!next.pendingCommand || !!next.pendingSetPiece || next.status !== "playing";
    if (blocked) setActiveWorkspace("command");
    else if (returnTo) setActiveWorkspace(returnTo);
    if (next.status === "won" || next.status === "lost" || next.status === "exercise") recordProgress(next);
  }

  function chooseHypothesis(id: HypothesisId) {
    const current = stateRef.current;
    if (!current || current.pendingDecision || current.pendingCommand || current.pendingSetPiece) return;
    const next = engine().setHypothesis(current, id);
    setGame(next);
    setPendingUndo(null);
    // A revision is a change from a reading already held, counted as the review
    // counts it; declaring the first reading is not one.
    if (countRevisions(next) > countRevisions(current) && !botRunRef.current) {
      recordTelemetry("revision");
      setTelemetry(readTelemetry());
    }
    setAnnouncement(msg("session.hypothesisSet", { title: lit(hypotheses.find(item => item.id === id)?.title ?? "") }));
  }

  function respond(choice: string) {
    const current = stateRef.current;
    if (!current) return;
    const next = engine().resolveResponse(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    playFeedback(next.status === "won" ? "complete" : next.status === "lost" ? "lost" : "decision", soundEnabled, hapticsEnabled);
    setAnnouncement(next.status === "won" ? msg("session.responseWon")
      : next.status === "lost" ? msg("session.responseLost", { loss: engine().getLossReason(next).title })
      : next.responseChoices.length === 1 ? msg("session.containmentRecorded") : msg("session.assuranceRecorded"));
    // The stand-down panel is the player's arrival point. The review opens on
    // request so the resolution is seen before the analysis.
    afterStep(next);
  }

  function command(choice: "a" | "b") {
    const current = stateRef.current;
    if (!current) return;
    const next = engine().resolveCommand(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    afterStep(next, "investigate");
    playFeedback(choice === "a" ? "decision" : "warning", soundEnabled, hapticsEnabled);
    setAnnouncement(msg("session.commandRecorded", { impact: next.impact }));
  }

  function sectorDecision(choice: SetPieceChoice) {
    const current = stateRef.current;
    if (!current) return;
    const next = engine().resolveSetPiece(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    afterStep(next, "investigate");
    playFeedback(choice === "a" ? "decision" : "warning", soundEnabled, hapticsEnabled);
    setAnnouncement(msg("session.sectorRecorded", { label: lit(engine().getOperationalLabel(next)), continuity: next.continuity }));
  }

  function focusInfrastructure(nodeId: string) {
    const current = stateRef.current;
    if (!current) return;
    setGame(engine().setInfrastructureFocus(current, nodeId));
    setPendingUndo(null);
  }

  function mapAction(nodeId: string, action: MapAction) {
    const current = stateRef.current;
    if (!current) return;
    const next = engine().resolveMapAction(current, nodeId, action);
    setGame(next);
    pulseMeters(current, next);
    const blockedNow = !!next.pendingDecision || !!next.pendingCommand || !!next.pendingSetPiece;
    setPendingUndo(next.status === "playing" && !blockedNow ? { label: action === "isolate" ? msg("session.undoIsolation") : msg("session.undoMonitoring"), game: current } : null);
    playFeedback(action === "isolate" ? "warning" : "decision", soundEnabled, hapticsEnabled);
    setAnnouncement(next.status === "lost" ? msg("session.lost", { loss: engine().getLossReason(next).title }) : next.mapHistory.at(-1)?.effect ?? msg("session.mapRecorded"));
    afterStep(next);
  }

  function undo() {
    if (!pendingUndo) return;
    setGame(pendingUndo.game);
    setReport(null);
    setInlineReport(null);
    clearMeterPulse();
    setAnnouncement(msg("session.undid", { label: pendingUndo.label }));
    setPendingUndo(null);
  }

  function correlate(ids: [string, string], assessment: "causal" | "coincidental") {
    const current = stateRef.current;
    if (!current) return;
    const next = engine().correlateEvidence(current, ids, assessment);
    setGame(next);
    setPendingUndo(null);
    const correct = next.correlations.at(-1)?.correct;
    playFeedback(correct ? "success" : "failure", soundEnabled, hapticsEnabled);
    setAnnouncement(next.status === "lost" ? msg("session.assessmentLost", { loss: engine().getLossReason(next).title }) : correct ? msg("session.assessmentSupported") : msg("session.assessmentChallenged"));
    afterStep(next);
  }

  function chooseCaseTheory(objective: AdversaryObjectiveId) {
    const current = stateRef.current;
    if (!current) return;
    setGame(engine().setCaseTheory(current, objective));
    setPendingUndo(null);
    setAnnouncement(msg("session.caseTheorySet", { title: lit(adversaryObjectives[objective].title) }));
  }

  function exportProgress() {
    const payload = JSON.stringify({ format: "breach-command-backup", version: 1, campaign, telemetry: readTelemetry(), ledger: readLedger(scenarios.length), session: game && game.mode !== "ironman" && !botRun ? loadedGame().session.serialiseSession(game, guided, fastResolve) : null });
    setBackupInput(payload);
    navigator.clipboard?.writeText(payload).then(() => setBackupMessage(msg("session.backupCopied")), () => setBackupMessage(msg("session.backupPrepared")));
  }

  async function importProgress() {
    await loadGame();
    try {
      const payload = JSON.parse(backupInput) as { format?: string; campaign?: unknown; session?: string | null; telemetry?: unknown; ledger?: unknown };
      if (payload.format !== "breach-command-backup") throw new Error("format");
      // A backup without a readable campaign would otherwise restore the empty
      // default over the player's progress and call that a restore.
      if (!payload.campaign || typeof payload.campaign !== "object" || Array.isArray(payload.campaign)) throw new Error("campaign");
      const nextCampaign = parseCampaign(JSON.stringify(payload.campaign));
      // The operation travels as text too, so it is validated by the same
      // migration the local save goes through before it is allowed to replace
      // anything. An unreadable operation never blocks the campaign restore.
      const restoredSession = typeof payload.session === "string" ? loadedGame().session.parseSession(payload.session) : null;
      setCampaign(nextCampaign);
      campaignRef.current = nextCampaign;
      const storedCampaign = writeStored(CAMPAIGN_KEY, JSON.stringify(nextCampaign));
      // The local record travels with the backup so a tester's device can be
      // read back; an older backup without one leaves this device's record alone.
      if (payload.telemetry && typeof payload.telemetry === "object") {
        const restoredTelemetry = parseTelemetry(payload.telemetry);
        writeTelemetry(restoredTelemetry);
        setTelemetry(restoredTelemetry);
      }
      // The personal record travels the same way; an older backup without one
      // leaves this device's record alone.
      if (Array.isArray(payload.ledger)) {
        const restoredLedger = parseLedger(payload.ledger, scenarios.length);
        writeLedger(restoredLedger);
        setLedger(restoredLedger);
      }
      if (restoredSession) {
        writeStored(SESSION_KEY, loadedGame().session.serialiseSession(restoredSession.game, restoredSession.guided, restoredSession.fastResolve));
        setSavedSession(restoredSession);
        // While an operation is in play its own saves would overwrite the restored
        // one, and returning to assignments would delete it. Hold it until then.
        importedRef.current = game ? restoredSession : null;
      }
      if (!storedCampaign) setBackupMessage(msg("session.restoredNoStorage"));
      else if (typeof payload.session === "string" && !restoredSession) setBackupMessage(msg("session.restoredWithoutSession"));
      else if (restoredSession && game) setBackupMessage(msg("session.restoredReturn"));
      else if (restoredSession) setBackupMessage(msg("session.restoredReady"));
      else setBackupMessage(msg("session.restored"));
    } catch { setBackupMessage(msg("session.backupNotRecognised")); }
  }

  // Daily operation gives every commander the same case today, so choosing it
  // also chooses today's case rather than the campaign's next one.
  function chooseMode(next: GameMode) {
    // Leaving Daily goes back to the campaign's own next case; it kept today's.
    if (next === "daily") setScenarioChoice(todaySeed() % scenarios.length);
    // The week's operation is one case at Operational, so a week's results compare.
    else if (next === "weekly") {
      setScenarioChoice(weeklyOperation(new Date(), scenarios.length).scenario);
      setDifficulty("operational");
    }
    else if (mode === "daily" || mode === "weekly") setScenarioChoice(nextCase(campaign, scenarios.length));
    setMode(next);
  }

  function recordProgress(result: Game) {
    if (botRunRef.current || recordedRef.current) return;
    recordedRef.current = true;
    recordTelemetry(result.status === "won" ? "win" : result.status === "exercise" ? "exercise" : "loss", { scenario: result.scenario });
    setTelemetry(readTelemetry());
    const score = engine().getOutcome(result).breakdown.total;
    // The updater stays pure; the campaign is persisted from the value it
    // produced rather than from inside the reducer.
    const updated = recordCampaignResult(campaignRef.current, result, score);
    setCampaignChange(campaignChanges(campaignRef.current, updated, result, score));
    campaignRef.current = updated;
    setCampaign(updated);
    if (!writeStored(CAMPAIGN_KEY, JSON.stringify(updated))) setStorageNotice(msg("session.campaignNotKept"));
    // What the review suggests next, kept so a returning player is met with it.
    const next = engine().recommendNext(result, nextCase(updated, scenarios.length));
    const record: LastOperation = { scenario: result.scenario, difficulty: result.difficulty, outcome: result.status as LastOperation["outcome"], ending: result.status === "lost" ? engine().getLossReason(result).title : result.status === "exercise" ? msg("record.endingExercise") : msg("record.endingStoodDown"), score, endedAt: Date.now(), next };
    writeLastOperation(record);
    setLastOperation(record);
    const entry: LedgerEntry = { at: Date.now(), scenario: result.scenario, difficulty: result.difficulty, mode: result.mode, outcome: result.status as LedgerEntry["outcome"], score, hypothesis: engine().getOutcome(result).breakdown.hypothesis, stages: result.revealed.length, turns: result.turns.length, code: result.seed === null ? null : encodeChallenge({ scenario: result.scenario, difficulty: result.difficulty, mode: result.mode, specialist: result.specialist, seed: result.seed }) };
    const nextLedger = [...readLedger(scenarios.length), entry];
    writeLedger(nextLedger);
    setLedger(nextLedger);
  }

  // Sets up the finished operation again for the Bot Commander, to watch where
  // a reading tested soundly would have gone. Only a reproducible operation can
  // be replayed: an ordinary campaign one drew its chain fresh.
  function replayWithBot(finished: Game) {
    if (finished.seed === null) return;
    const code = encodeChallenge({ scenario: finished.scenario, difficulty: finished.difficulty, mode: finished.mode, specialist: finished.specialist, seed: finished.seed });
    resetToBriefing();
    if (!applyCode(code)) return;
    replayRef.current = { scenario: finished.scenario, variant: finished.variant, campaignRoute: finished.campaignRoute };
    setBotEnabled(true);
    setReplay({ scenario: finished.scenario, difficulty: finished.difficulty });
  }

  // Sets up the assignment the review or the landing page suggested.
  function playRecommended(next: LastOperation["next"]) {
    resetToBriefing();
    setScenarioChoice(next.scenario);
    setDifficulty(next.difficulty);
  }

  function dismissReport() {
    if (game?.pendingDecision) return;
    setReport(null);
    if (ended) setDebrief(true);
  }

  function resetToBriefing() {
    const imported = importedRef.current;
    importedRef.current = null;
    if (imported) {
      writeStored(SESSION_KEY, loadedGame().session.serialiseSession(imported.game, imported.guided, imported.fastResolve));
      setSavedSession(imported);
    } else clearStoredSession();
    setGame(null);
    setNewConfirm(false);
    setQuestion(null);
    setReport(null);
    setInlineReport(null);
    setSelected(null);
    setDebrief(false);
    botRunRef.current = false;
    setBotRun(false);
    setBotActive(false);
    setBotPaused(false);
    setBotStatus(msg("session.botWaiting"));
    clearMeterPulse();
    setAdaptiveScore(false);
  }

  // A player who completes all four academy steps has qualified, whether or not
  // they press "Finish tutorial"; the next operation restarted at 1/4 after the
  // card had said "Field qualification complete".
  const academyDone = !!game?.hypothesis && !!game?.turns.length && !!game?.decisions.length && !!game?.caseTheory;
  useEffect(() => {
    if (tutorial && academyDone) writeStored("breach-command.tutorial-complete", "true");
  }, [tutorial, academyDone]);

  function dismissTutorial() {
    setTutorial(false);
    writeStored("breach-command.tutorial-complete", "true");
  }

  function restartTutorial() {
    removeStored("breach-command.tutorial-complete");
    setTutorial(true);
    setSettings(false);
  }

  function clearLocalRecord() {
    clearTelemetry();
    setTelemetry(readTelemetry());
  }

  function setMusic(value: boolean) {
    setMusicEnabled(value);
    setAdaptiveScore(value, game ? Math.max(game.impact, game.objectiveProgress) / 100 : 0.1, game?.scenario ?? scenarioChoice);
  }

  function toggleBotPause() {
    setBotPaused(value => {
      const next = !value;
      setBotStatus(next ? msg("session.botPaused") : msg("session.botResumed"));
      return next;
    });
  }

  function takeControl() {
    setBotActive(false);
    setBotPaused(false);
    setBotEnabled(false);
    setBotStatus(msg("session.botManual"));
    setAnnouncement(msg("session.manualAnnouncement"));
  }

  const executeBotAction = useEffectEvent((action: BotAction) => {
    switch (action.type) {
      case "decision": decide(action.choice); break;
      case "command": command(action.choice); break;
      case "set-piece": sectorDecision(action.choice); break;
      case "response": respond(action.choice); break;
      case "hypothesis": chooseHypothesis(action.hypothesis); break;
      case "case-theory": chooseCaseTheory(action.objective); break;
      case "correlate": correlate(action.evidence, action.assessment); break;
      case "focus": focusInfrastructure(action.nodeId); break;
      case "map": mapAction(action.nodeId, action.action); break;
      case "procedure": run(action.procedure, action.plan); break;
      case "complete": setBotActive(false); break;
    }
  });

  // A save is read by the session's migration, which is in the game bundle, so
  // a first visit with nothing saved never loads it for this. The bundle is
  // usually warm by the time a returning player looks for the Resume button;
  // a start or import waits on the same load, so the newer-build check below
  // still runs before anything is written to the save slot.
  useEffect(() => {
    if (!readStored(SESSION_KEY) && !readStored(PARKED_SESSION_KEY)) return;
    let cancelled = false;
    void loadGame().then(({ session: saves }) => {
      if (cancelled) return;
      let stored = readStored(SESSION_KEY);
      // A save an older build parked because it could not read it: once this build
      // can, it goes back in the slot and is offered like any other.
      const parked = readStored(PARKED_SESSION_KEY);
      if (!stored && parked) {
        const restored = saves.parseSession(parked);
        if (restored && (restored.game.status === "playing" || restored.game.status === "response") && writeStored(SESSION_KEY, parked)) {
          removeStored(PARKED_SESSION_KEY);
          stored = parked;
        } else if (!restored && !saves.sessionFromNewerBuild(parked)) removeStored(PARKED_SESSION_KEY);
      }
      if (!stored) return;
      const session = saves.parseSession(stored);
      if (!session && saves.sessionFromNewerBuild(stored)) newerSaveRef.current = stored;
      // Only an operation still in progress is offered. A finished one has nothing
      // left to resume, and opening it landed on a disabled workspace.
      if (session && (session.game.status === "playing" || session.game.status === "response")) setSavedSession(session);
      else if (session) removeStored(SESSION_KEY);
      else if (saves.sessionFromNewerBuild(stored)) setStorageNotice(msg("session.saveFromNewer"));
      else {
        removeStored(SESSION_KEY);
        setStorageNotice(msg("session.saveUnreadable"));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const stored = readStored(CAMPAIGN_KEY);
      const loaded = parseCampaign(stored);
      setCampaign(loaded);
      // The assignment offered on arrival is the campaign's next case. It began
      // at case 01 on every load, a case already cleared.
      setScenarioChoice(nextCase(loaded, scenarios.length));
      setLastOperation(readLastOperation(scenarios.length));
      setLedger(readLedger(scenarios.length));
      // A first operation starts at Training, the only difficulty that discloses
      // what the team is seeing; without that clue the opening reading is a guess
      // between four routes, which is the wrong first lesson. The player can still
      // choose otherwise before beginning.
      if (loaded.operations === 0) setDifficulty("training");
      if (!storageWritable()) setStorageNotice(msg("session.storageVisit"));
      else if (stored !== null && !campaignReadable(stored)) setStorageNotice(msg("session.campaignUnreadable"));
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`/sw.js?v=${process.env.NEXT_PUBLIC_APP_VERSION ?? "0"}-${process.env.NEXT_PUBLIC_BUILD_ID ?? "local"}`).catch(() => {});
    return () => clearTimeout(loadTimer);
  }, []);


  // M is "mute": it silences cues and the score together, and brings the cues
  // back. Toggling only the cues left the music playing under a muted game.
  useKeyboardShortcuts(shortcutsEnabled, {
    f: () => setRules(value => !value),
    m: () => {
      if (soundEnabled || musicEnabled) {
        setSoundEnabled(false);
        setMusic(false);
      } else setSoundEnabled(true);
    },
    g: () => setGuided(value => !value),
  });

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    stateRef.current = game;
    if (game && musicEnabled) setAdaptiveScore(true, Math.max(game.impact, game.objectiveProgress, 100 - game.sectorHealth) / 100, game.scenario);
  }, [game, musicEnabled]);

  useEffect(() => {
    if (!game || game.mode === "ironman" || botRunRef.current || importedRef.current) return;
    // A finished operation has nothing to resume, so its save is cleared rather
    // than offered on the next visit.
    if (game.status === "won" || game.status === "lost" || game.status === "exercise") {
      removeStored(SESSION_KEY);
      return;
    }
    parkNewerSave();
    if (writeStored(SESSION_KEY, loadedGame().session.serialiseSession(game, guided, fastResolve))) return;
    const notice = setTimeout(() => setStorageNotice(msg("session.storageMemory")), 0);
    return () => clearTimeout(notice);
  }, [game, guided, fastResolve]);

  useEffect(() => {
    if (!game || !botActive || botPaused || rolling || missionBriefing || settings || rules || newConfirm || debrief || tutorial || selected) return;
    const delay = prefersReducedMotion() ? 350 : 900;
    // The Bot Commander's policy loads with the first practice run rather than
    // with the page; a change of state before it arrives cancels the step.
    let cancelled = false;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (!current) return;
      if (report && !current.pendingDecision) {
        setBotStatus(current.status === "response" ? msg("session.botResponse") : msg("session.botClosing"));
        setReport(null);
        if (["won", "lost", "exercise"].includes(current.status)) setDebrief(true);
        return;
      }
      loadGame().then(({ chooseBotAction }) => {
        if (cancelled || stateRef.current !== current) return;
        const action = chooseBotAction(current);
        setBotStatus(action.reason);
        executeBotAction(action);
      }).catch(() => setBotStatus(msg("session.botLoadFailed")));
    }, delay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [game, botActive, botPaused, rolling, missionBriefing, settings, rules, newConfirm, debrief, tutorial, selected, report]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
  }, []);

  useIncidentStateTool(stateRef);

  // Derived, never stored: the warning can only ever describe the meters as they
  // are now, and it clears itself the moment the operation is no longer running.
  const criticalAnnouncement = game && game.status === "playing"
    && (game.impact >= IMPACT_CRITICAL || game.continuity <= CONTINUITY_AT_RISK || game.objectiveProgress >= OBJECTIVE_IMMINENT)
    ? msg("session.warning", { impact: game.impact, label: lit(engine().getOperationalLabel(game)), continuity: game.continuity, progress: game.objectiveProgress })
    : null;

  const answer: Message | null = game && question === "scope" ? lit(activeScenario.scope)
    : question === "constraints" ? lit(activeScenario.constraints)
    : question === "impact" ? lit(activeScenario.impact)
    : question === "known" ? msg("session.known", { timeline: lit(activeScenario.timeline), lead: engine().getLead(game!), confirmed: game!.revealed.length ? msg("session.confirmedSoFar", { stages: game!.revealed.map(id => words.attack(id, "title")).reduceRight((rest, first) => msg("session.listComma", { first, rest })) }) : msg("session.noStageConfirmed") })
    : question === "adversary" ? msg("session.adversary", { title: engine().getObjectiveRead(game!).title, detail: engine().getObjectiveRead(game!).detail, state: engine().getAdversaryState(game!), read: engine().getAdversaryRead(game!) })
    : question === "assumptions" ? msg("session.assumptions")
    : null;

  return {
    // Campaign, session and operation state
    game,
    campaign,
    savedSession,
    difficulty, setDifficulty,
    scenarioChoice, setScenarioChoice,
    mode, setMode: chooseMode, campaignChange,
    specialist, setSpecialist,
    guided, setGuided,
    fastResolve, setFastResolve,
    actionScope, setActionScope,
    actionIntensity, setActionIntensity,
    challengeInput, setChallengeInput,
    challengeMessage,
    telemetry,
    soundEnabled, setSoundEnabled,
    musicEnabled,
    hapticsEnabled, setHapticsEnabled,
    highContrast, setHighContrast,
    shortcutsEnabled, setShortcutsEnabled,
    botEnabled, setBotEnabled,
    botRun,
    botActive,
    botPaused,
    botStatus,
    // Turn, report and decision state
    selected, setSelected,
    rolling,
    die,
    report, setReport,
    inlineReport, setInlineReport,
    pendingUndo,
    meterPulse,
    ended,
    // Interface state
    rules, setRules,
    settings, setSettings,
    newConfirm, setNewConfirm,
    missionBriefing, setMissionBriefing,
    debrief, setDebrief,
    tutorial,
    question, setQuestion,
    answer,
    activeWorkspace, setActiveWorkspace,
    storageNotice, setStorageNotice,
    backupInput, setBackupInput,
    backupMessage,
    // Live regions
    announcement,
    criticalAnnouncement,
    // Derived readouts
    activeScenario,
    ScenarioIcon,
    proc,
    config,
    decision,
    guidance,
    trainingPrompt,
    responseProfile,
    outcome,
    activeHypothesis,
    procedureAligned,
    currentAct,
    currentStory,
    currentRouteId,
    currentRoute,
    previewVariant,
    finalEnding,
    challengeCode,
    // Transitions
    start,
    resume,
    run,
    decide,
    chooseHypothesis,
    respond,
    command,
    sectorDecision,
    focusInfrastructure,
    mapAction,
    undo,
    correlate,
    chooseCaseTheory,
    loadChallengeCode,
    generateSeed,
    exportProgress,
    importProgress,
    clearStoredSession,
    dismissReport,
    resetToBriefing,
    lastOperation,
    playRecommended,
    ledger,
    replay,
    replayWithBot,
    dismissTutorial,
    restartTutorial,
    clearLocalRecord,
    setMusic,
    toggleBotPause,
    takeControl,
  };
}

export type GameSession = ReturnType<typeof useGameSession>;
