"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  attacks,
  procedures,
  scenarios,
  hypotheses,
  difficulties,
  newGame,
  playTurn,
  resolveDecision,
  resolveResponse,
  resolveCommand,
  resolveSetPiece,
  resolveMapAction,
  correlateEvidence,
  setHypothesis,
  setInfrastructureFocus,
  setCaseTheory,
  availableIn,
  getLead,
  getTrainingPrompt,
  guidanceLevel,
  responseOptionsFor,
  getOutcome,
  getDecisionOptions,
  getAdversaryState,
  getAdversaryRead,
  getOperationalLabel,
  getObjectiveRead,
  getTurnLimit,
  adversaryObjectives,
  type Difficulty,
  type GameMode,
  type ProcedureIntensity,
  type ProcedureScope,
  type SpecialistId,
  type HypothesisId,
  type Game,
  type Turn,
  type AdversaryObjectiveId,
  type DecisionChoice,
  type MapAction,
} from "@/lib/advanced-game";
import { parseSession, serialiseSession, SESSION_KEY, type SavedSession } from "@/lib/session";
import { campaignAct, campaignEnding, campaignTier, defaultCampaign, parseCampaign, recordCampaignResult, CAMPAIGN_KEY, type CampaignState } from "@/lib/campaign";
import { playFeedback, setAdaptiveScore } from "@/lib/feedback";
import { clearTelemetry, readTelemetry, recordTelemetry, type BalanceTelemetry } from "@/lib/telemetry";
import { readStored, removeStored, storageWritable, writeStored } from "@/lib/storage";
import { seededChallengeRandom } from "@/lib/phase8";
import { campaignRoutes, incidentVariant, routeForCampaign } from "@/lib/phase9";
import { chooseBotAction, type BotAction } from "@/lib/game-bot";
import { usePreferences } from "@/hooks/use-preferences";
import { useChallengeCode } from "@/hooks/use-challenge-code";

type WorkspaceView = "command" | "investigate" | "briefing";

// Moment-to-moment feedback for the case meters. The deltas describe what the
// last resolved step did to business impact and operational continuity, plus
// whether that step pushed either readout across a meaningful threshold.
export type MeterPulse = {
  key: number;
  impact: number;
  continuity: number;
  objective: number;
  impactCritical: boolean;
  continuityAtRisk: boolean;
  objectiveImminent: boolean;
};
export const IMPACT_CRITICAL = 70;
export const CONTINUITY_AT_RISK = 45;
// Adversary progress is the clock that actually closes most operations, so it
// gets the same threshold treatment as the other two pressure readouts.
export const OBJECTIVE_IMMINENT = 70;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

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
  const [announcement, setAnnouncement] = useState("");
  const [settings, setSettings] = useState(false);
  const [mode, setMode] = useState<GameMode>("campaign");
  const [specialist, setSpecialist] = useState<SpecialistId>("hunter");
  const [actionScope, setActionScope] = useState<ProcedureScope>("focused");
  const [actionIntensity, setActionIntensity] = useState<ProcedureIntensity>("balanced");
  const [missionBriefing, setMissionBriefing] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [telemetry, setTelemetry] = useState<BalanceTelemetry>(() => readTelemetry());
  const [campaign, setCampaign] = useState<CampaignState>(defaultCampaign);
  const [backupInput, setBackupInput] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceView>("command");
  const [storageNotice, setStorageNotice] = useState("");
  const { soundEnabled, setSoundEnabled, musicEnabled, setMusicEnabled, hapticsEnabled, setHapticsEnabled, highContrast, setHighContrast } = usePreferences(setStorageNotice);
  const { challengeSeed, challengeActive, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed, codeFor } = useChallengeCode(setup => {
    setScenarioChoice(setup.scenario);
    setDifficulty(setup.difficulty);
    setMode(setup.mode);
    setSpecialist(setup.specialist);
  });

  const [pendingUndo, setPendingUndo] = useState<{ label: string; game: Game } | null>(null);
  const [meterPulse, setMeterPulse] = useState<MeterPulse | null>(null);
  const [botEnabled, setBotEnabled] = useState(false);
  const [botRun, setBotRun] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [botPaused, setBotPaused] = useState(false);
  const [botStatus, setBotStatus] = useState("Waiting for the operation to begin.");
  const stateRef = useRef(game);
  const campaignRef = useRef(campaign);
  const busyRef = useRef(false);
  const botRunRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recordedRuns = useRef(new Set<string>());
  const pulseKey = useRef(0);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeScenario = scenarios[game?.scenario ?? scenarioChoice];
  const ScenarioIcon = activeScenario.icon;
  const proc = procedures.find(procedure => procedure.id === selected);
  const ended = !!game && ["won", "lost", "exercise"].includes(game.status);
  const config = game ? difficulties[game.difficulty] : difficulties[difficulty];
  const decision = game ? getDecisionOptions(game) : null;
  const guidance = game ? guidanceLevel(game, guided) : "off";
  const trainingPrompt = game ? getTrainingPrompt(game, guided) : null;
  const responseProfile = game ? responseOptionsFor(game) : null;
  const outcome = game ? getOutcome(game) : null;
  const activeHypothesis = game ? hypotheses.find(item => item.id === game.hypothesis) : null;
  const procedureAligned = !!proc && !!activeHypothesis?.procedures.includes(proc.id);
  const currentAct = campaignAct(campaign.completed.length);
  const currentRouteId = routeForCampaign(campaign);
  const currentRoute = campaignRoutes[currentRouteId];
  const previewVariant = incidentVariant(scenarioChoice, currentRouteId, challengeSeed);
  const finalEnding = campaignEnding(campaign);
  const challengeCode = codeFor(scenarioChoice, difficulty, mode, specialist);

  function clearStoredSession() {
    removeStored(SESSION_KEY);
    setSavedSession(null);
  }

  // Describe the meter movement caused by one resolved step. Threshold crossings
  // are recorded as a boolean so the interface can mark them as an event even
  // when the underlying number only moved by a single point.
  function pulseMeters(previous: Game | null, next: Game) {
    if (!previous) return;
    const impact = next.impact - previous.impact;
    const continuity = next.continuity - previous.continuity;
    const objective = next.objectiveProgress - previous.objectiveProgress;
    const impactCritical = previous.impact < IMPACT_CRITICAL && next.impact >= IMPACT_CRITICAL;
    const continuityAtRisk = previous.continuity > CONTINUITY_AT_RISK && next.continuity <= CONTINUITY_AT_RISK;
    const objectiveImminent = previous.objectiveProgress < OBJECTIVE_IMMINENT && next.objectiveProgress >= OBJECTIVE_IMMINENT;
    if (!impact && !continuity && !objective && !impactCritical && !continuityAtRisk && !objectiveImminent) return;
    pulseKey.current += 1;
    setMeterPulse({ key: pulseKey.current, impact, continuity, objective, impactCritical, continuityAtRisk, objectiveImminent });
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setMeterPulse(null), 1400);
  }

  function clearMeterPulse() {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setMeterPulse(null);
  }

  function start(index = scenarioChoice) {
    if (busyRef.current) return;
    clearStoredSession();
    const random = seededChallengeRandom(challengeSeed);
    const posture = campaign.commandPosture.observe > campaign.commandPosture.act + 2 ? "observe" : campaign.commandPosture.act > campaign.commandPosture.observe + 2 ? "act" : "balanced";
    const route = routeForCampaign(campaign);
    const automated = botEnabled;
    // Daily Operation and any challenge configuration promise that the same
    // code replays the same operation, so those runs carry their seed into the
    // procedure rolls. Ordinary campaign play stays unpredictable.
    const reproducible = mode === "daily" || challengeActive;
    const next = newGame(index, difficulty, random, { mode, specialist, campaignTier: campaignTier(campaign.xp), inheritedFatigue: campaign.specialistFatigue[specialist] ?? 0, readiness: campaign.readiness, leadershipTrust: campaign.leadershipTrust, unresolvedThreads: campaign.unresolvedThreads, doctrine: posture, campaignRoute: route, variant: incidentVariant(index, route, challengeSeed), seed: reproducible ? challengeSeed : null });
    setGame(next);
    botRunRef.current = automated;
    setBotRun(automated);
    setBotActive(automated);
    setBotPaused(false);
    setBotStatus(automated ? "Reviewing the mission briefing before the first move." : "Waiting for the operation to begin.");
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
    setAnnouncement("New investigation started.");
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
    setAnnouncement(`Resumed ${scenarios[session.game.scenario].title}.`);
    // A saved operation already in the response phase has no investigation left to
    // resume into — that workspace is disabled — so the response sequence, which is
    // itself a blocking decision, sends the player to Command like any other.
    const blocked = session.game.pendingDecision || session.game.pendingCommand || session.game.pendingSetPiece || session.game.status === "response";
    setActiveWorkspace(blocked ? "command" : "investigate");
    scrollToTop();
  }

  function run(id: string, plan = { scope: actionScope, intensity: actionIntensity }) {
    const current = stateRef.current;
    if (!current || busyRef.current || current.status !== "playing" || current.pendingDecision || current.pendingCommand || current.pendingSetPiece || availableIn(current, id) > 0) return;
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
      const next = playTurn(current, id, undefined, plan);
      const result = next.turns.at(-1)!;
      const requiresDialog = !!result.revealed || !!result.inject || !!result.adversaryEvent || next.status !== "playing";
      setDie(result.raw);
      setGame(next);
      pulseMeters(current, next);
      if (next.pendingDecision || next.pendingCommand || next.pendingSetPiece || next.status !== "playing") setActiveWorkspace("command");
      setReport(requiresDialog ? result : null);
      setInlineReport(requiresDialog ? null : result);
      const blockedNow = !!next.pendingDecision || !!next.pendingCommand || !!next.pendingSetPiece;
      setPendingUndo(quick && next.status === "playing" && !blockedNow ? { label: procedures.find(item => item.id === id)?.title ?? "Procedure", game: current } : null);
      setRolling(false);
      setAnnouncement(`Turn ${result.number}. ${result.success ? "Procedure succeeded." : "Procedure unsuccessful."} Business impact is ${next.impact}. ${getOperationalLabel(next)} is ${next.continuity}. Adversary progress is ${next.objectiveProgress}.`);
      playFeedback(result.adversaryEvent ? "warning" : result.success ? "success" : "failure", soundEnabled, hapticsEnabled, {
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
      busyRef.current = false;
    }, quick ? 0 : 850);
    timers.current.push(timeout);
  }

  function decide(choice: DecisionChoice) {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveDecision(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    setActiveWorkspace(next.status === "playing" ? "investigate" : "command");
    playFeedback("decision", soundEnabled, hapticsEnabled);
    setAnnouncement(`Decision recorded. Business impact is ${next.impact}. ${getOperationalLabel(next)} is ${next.continuity}.`);
  }

  function chooseHypothesis(id: HypothesisId) {
    const current = stateRef.current;
    if (!current || current.pendingDecision || current.pendingCommand || current.pendingSetPiece) return;
    const next = setHypothesis(current, id);
    setGame(next);
    setAnnouncement(`Working hypothesis set to ${hypotheses.find(item => item.id === id)?.title}.`);
  }

  function respond(choice: string) {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveResponse(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    playFeedback(next.status === "won" ? "complete" : "decision", soundEnabled, hapticsEnabled);
    setAnnouncement(next.status === "won" ? "Response complete. The incident is standing down. The after-action review is ready when you are." : next.responseChoices.length === 1 ? "Containment recorded. Establish an assurance gate." : "Assurance recorded. Choose a recovery approach.");
    if (next.status === "won") {
      // The stand-down panel is the player's arrival point. The review opens on
      // request so the resolution is seen before the analysis.
      setActiveWorkspace("command");
      recordProgress(next);
    }
  }

  function command(choice: "a" | "b") {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveCommand(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    setActiveWorkspace("investigate");
    playFeedback(choice === "a" ? "decision" : "warning", soundEnabled, hapticsEnabled);
    setAnnouncement(`Command decision recorded. Business impact is ${next.impact}.`);
  }

  function sectorDecision(choice: "a" | "b") {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveSetPiece(current, choice);
    setGame(next);
    pulseMeters(current, next);
    setPendingUndo(null);
    setActiveWorkspace("investigate");
    playFeedback(choice === "a" ? "decision" : "warning", soundEnabled, hapticsEnabled);
    setAnnouncement(`Sector decision recorded. ${getOperationalLabel(next)} is ${next.continuity}.`);
  }

  function focusInfrastructure(nodeId: string) {
    const current = stateRef.current;
    if (!current) return;
    setGame(setInfrastructureFocus(current, nodeId));
  }

  function mapAction(nodeId: string, action: MapAction) {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveMapAction(current, nodeId, action);
    setGame(next);
    pulseMeters(current, next);
    const blockedNow = !!next.pendingDecision || !!next.pendingCommand || !!next.pendingSetPiece;
    setPendingUndo(next.status === "playing" && !blockedNow ? { label: action === "isolate" ? "Isolation" : "Monitoring", game: current } : null);
    playFeedback(action === "isolate" ? "warning" : "decision", soundEnabled, hapticsEnabled);
    setAnnouncement(next.mapHistory.at(-1)?.effect ?? "Infrastructure action recorded.");
  }

  function undo() {
    if (!pendingUndo) return;
    setGame(pendingUndo.game);
    setReport(null);
    setInlineReport(null);
    clearMeterPulse();
    setAnnouncement(`Undid ${pendingUndo.label}.`);
    setPendingUndo(null);
  }

  function correlate(ids: [string, string], assessment: "causal" | "coincidental") {
    const current = stateRef.current;
    if (!current) return;
    const next = correlateEvidence(current, ids, assessment);
    setGame(next);
    setPendingUndo(null);
    const correct = next.correlations.at(-1)?.correct;
    playFeedback(correct ? "success" : "failure", soundEnabled, hapticsEnabled);
    setAnnouncement(correct ? "Evidence assessment supported." : "Evidence assessment challenged.");
  }

  function chooseCaseTheory(objective: AdversaryObjectiveId) {
    const current = stateRef.current;
    if (!current) return;
    setGame(setCaseTheory(current, objective));
    setAnnouncement(`Case theory set to ${adversaryObjectives[objective].title}.`);
  }

  function exportProgress() {
    const payload = JSON.stringify({ format: "breach-command-backup", version: 1, campaign, session: game && game.mode !== "ironman" && !botRun ? serialiseSession(game, guided, fastResolve) : null });
    setBackupInput(payload);
    navigator.clipboard?.writeText(payload).then(() => setBackupMessage("Backup copied to the clipboard."), () => setBackupMessage("Backup prepared. Copy the text below."));
  }

  function importProgress() {
    try {
      const payload = JSON.parse(backupInput) as { format?: string; campaign?: unknown; session?: string | null };
      if (payload.format !== "breach-command-backup") throw new Error("format");
      const nextCampaign = parseCampaign(JSON.stringify(payload.campaign));
      // The operation travels as text too, so it is validated by the same
      // migration the local save goes through before it is allowed to replace
      // anything. An unreadable operation never blocks the campaign restore.
      const restoredSession = typeof payload.session === "string" ? parseSession(payload.session) : null;
      setCampaign(nextCampaign);
      const storedCampaign = writeStored(CAMPAIGN_KEY, JSON.stringify(nextCampaign));
      if (restoredSession) writeStored(SESSION_KEY, serialiseSession(restoredSession.game, restoredSession.guided, restoredSession.fastResolve));
      if (!storedCampaign) setBackupMessage("Progress restored for this visit, but this browser is not allowing saved data.");
      else if (typeof payload.session === "string" && !restoredSession) setBackupMessage("Campaign progress restored. The saved operation in this backup could not be read and was left out.");
      else setBackupMessage("Progress restored. Return to assignments to load any saved operation.");
    } catch { setBackupMessage("Backup not recognised. Paste a complete Breach Command backup."); }
  }

  function recordProgress(result: Game) {
    if (botRunRef.current) return;
    const marker = `${result.scenario}:${result.status}:${result.turns.length}:${result.responseChoices.join("-")}`;
    if (recordedRuns.current.has(marker)) return;
    recordedRuns.current.add(marker);
    recordTelemetry(result.status === "won" ? "win" : "loss", { scenario: result.scenario });
    setTelemetry(readTelemetry());
    const score = getOutcome(result).breakdown.total;
    // The updater stays pure; the campaign is persisted from the value it
    // produced rather than from inside the reducer.
    const updated = recordCampaignResult(campaignRef.current, result, score);
    campaignRef.current = updated;
    setCampaign(updated);
    if (!writeStored(CAMPAIGN_KEY, JSON.stringify(updated))) setStorageNotice("This browser is not allowing saved data, so campaign progress was not kept.");
  }

  function dismissReport() {
    if (game?.pendingDecision) return;
    setReport(null);
    if (ended) setDebrief(true);
  }

  function resetToBriefing() {
    clearStoredSession();
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
    setBotStatus("Waiting for the operation to begin.");
    clearMeterPulse();
    setAdaptiveScore(false);
  }

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
      setBotStatus(next ? "Automation paused. The current operation state is unchanged." : "Automation resumed. Reassessing the visible incident state.");
      return next;
    });
  }

  function takeControl() {
    setBotActive(false);
    setBotPaused(false);
    setBotEnabled(false);
    setBotStatus("Manual control resumed. This remains a practice operation without campaign rewards.");
    setAnnouncement("Manual control resumed. Bot-assisted operations do not award campaign progress.");
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

  useEffect(() => {
    const stored = readStored(SESSION_KEY);
    if (!stored) return;
    const session = parseSession(stored);
    const loadTimer = setTimeout(() => {
      if (session && session.game.status !== "won") setSavedSession(session);
      else if (!session) {
        removeStored(SESSION_KEY);
        setStorageNotice("The saved operation on this device could not be restored and has been set aside.");
      }
    }, 0);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setCampaign(parseCampaign(readStored(CAMPAIGN_KEY)));
      if (!storageWritable()) setStorageNotice("This browser is not allowing saved data, so progress from this visit will not be kept.");
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => clearTimeout(loadTimer);
  }, []);


  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === "f") setRules(value => !value);
      if (event.key.toLowerCase() === "m") setSoundEnabled(value => !value);
      if (event.key.toLowerCase() === "g") setGuided(value => !value);
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [setSoundEnabled]);

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    stateRef.current = game;
    if (game && musicEnabled) setAdaptiveScore(true, Math.max(game.impact, game.objectiveProgress, 100 - game.sectorHealth) / 100, game.scenario);
  }, [game, musicEnabled]);

  useEffect(() => {
    if (!game || game.mode === "ironman" || botRunRef.current) return;
    if (writeStored(SESSION_KEY, serialiseSession(game, guided, fastResolve))) return;
    const notice = setTimeout(() => setStorageNotice("This browser is not allowing saved data, so this operation is being played from memory only."), 0);
    return () => clearTimeout(notice);
  }, [game, guided, fastResolve]);

  useEffect(() => {
    if (!game || !botActive || botPaused || rolling || missionBriefing || settings || rules || newConfirm || debrief || tutorial || selected) return;
    const delay = prefersReducedMotion() ? 350 : 900;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (!current) return;
      if (report && !current.pendingDecision) {
        setBotStatus(current.status === "response" ? "Entering the three-stage response sequence." : "Closing the completed action report.");
        setReport(null);
        if (["won", "lost", "exercise"].includes(current.status)) setDebrief(true);
        return;
      }
      const action = chooseBotAction(current);
      setBotStatus(action.reason);
      executeBotAction(action);
    }, delay);
    return () => clearTimeout(timer);
  }, [game, botActive, botPaused, rolling, missionBriefing, settings, rules, newConfirm, debrief, tutorial, selected, report]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      const registration = context.registerTool({
        name: "read_incident_state",
        title: "Read incident state",
        description: "Read the visible incident, working hypothesis, operational condition and available procedures. Hidden attacks are not disclosed.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input: unknown) {
          if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) throw new Error("Expected an empty object.");
          const current = stateRef.current;
          if (!current) return { status: "briefing" };
          return {
            status: current.status,
            difficulty: current.difficulty,
            incident: scenarios[current.scenario].title,
            turnsUsed: current.turns.length,
            turnsRemaining: Math.max(0, getTurnLimit(current) - current.turns.length),
            impact: current.impact,
            operationalCondition: current.continuity,
            hypothesis: current.hypothesis,
            adversaryState: getAdversaryState(current),
            discovered: current.revealed.map(id => attacks.find(attack => attack.id === id)?.title),
            lead: getLead(current),
            procedures: procedures.map(procedure => ({
              id: procedure.id,
              title: procedure.title,
              established: current.established.includes(procedure.id),
              cooldown: availableIn(current, procedure.id),
            })),
          };
        },
      }, { signal: lifecycle.signal });
      Promise.resolve(registration).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);

  // Derived, never stored: the warning can only ever describe the meters as they
  // are now, and it clears itself the moment the operation is no longer running.
  const criticalAnnouncement = game && game.status === "playing"
    && (game.impact >= IMPACT_CRITICAL || game.continuity <= CONTINUITY_AT_RISK || game.objectiveProgress >= OBJECTIVE_IMMINENT)
    ? `Warning. Business impact ${game.impact}. ${getOperationalLabel(game)} ${game.continuity}. Adversary progress ${game.objectiveProgress}.`
    : "";

  const answer = game && question === "scope" ? activeScenario.scope
    : question === "constraints" ? activeScenario.constraints
    : question === "impact" ? activeScenario.impact
    : question === "known" ? `${activeScenario.timeline} ${getLead(game!)}`
    : question === "adversary" ? `${getObjectiveRead(game!).title}: ${getObjectiveRead(game!).detail} Current behaviour: ${getAdversaryState(game!)}. ${getAdversaryRead(game!)}`
    : question === "assumptions" ? "Treat alerts, valid credentials and successful procedures as evidence, not conclusions. Record one working hypothesis for each turn and revise it only when evidence no longer fits."
    : "";

  return {
    // Campaign, session and operation state
    game,
    campaign,
    savedSession,
    difficulty, setDifficulty,
    scenarioChoice, setScenarioChoice,
    mode, setMode,
    specialist, setSpecialist,
    guided, setGuided,
    fastResolve, setFastResolve,
    actionScope, setActionScope,
    actionIntensity, setActionIntensity,
    challengeSeed,
    challengeInput, setChallengeInput,
    challengeMessage,
    telemetry,
    soundEnabled, setSoundEnabled,
    musicEnabled,
    hapticsEnabled, setHapticsEnabled,
    highContrast, setHighContrast,
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
    dismissTutorial,
    restartTutorial,
    clearLocalRecord,
    setMusic,
    toggleBotPause,
    takeControl,
  };
}

export type GameSession = ReturnType<typeof useGameSession>;
