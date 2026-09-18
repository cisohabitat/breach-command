"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  CircleHelp,
  Clock3,
  Dices,
  Eye,
  FastForward,
  Flag,
  HeartPulse,
  LockKeyhole,
  Maximize2,
  Printer,
  Radio,
  RotateCcw,
  Settings2,
  Shield,
  ShieldCheck,
  Siren,
  Sparkles,
  Terminal,
  Trophy,
  Volume2,
  Vibrate,
  Contrast,
  X,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { HypothesisBoard } from "@/components/game/hypothesis-board";
import { ProcedureGrid } from "@/components/game/procedure-grid";
import { OperationsMap } from "@/components/game/operations-map";
import { CommandEvent } from "@/components/game/command-event";
import {
  attacks,
  procedures,
  scenarios,
  stages,
  difficulties,
  hypotheses,
  scenarioDynamics,
  responseOptions,
  newGame,
  playTurn,
  resolveDecision,
  resolveResponse,
  resolveCommand,
  setHypothesis,
  availableIn,
  getLead,
  getCoachPrompt,
  getOutcome,
  getCounterfactuals,
  getDecisionOptions,
  getAdversaryState,
  getAdversaryRead,
  getOperationalLabel,
  type Difficulty,
  type HypothesisId,
  type Game,
  type Turn,
} from "@/lib/advanced-game";
import { parseSession, serialiseSession, SESSION_KEY, type SavedSession } from "@/lib/session";
import { campaignRank, defaultCampaign, parseCampaign, recordCampaignResult, unlockedCapabilities, CAMPAIGN_KEY, type CampaignState } from "@/lib/campaign";
import { playFeedback } from "@/lib/feedback";

const stageIcons = [LockKeyhole, Activity, RotateCcw, Radio];

export default function Home() {
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [campaign, setCampaign] = useState<CampaignState>(defaultCampaign);
  const stateRef = useRef(game);
  const busyRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recordedRuns = useRef(new Set<string>());

  const activeScenario = scenarios[game?.scenario ?? scenarioChoice];
  const ScenarioIcon = activeScenario.icon;
  const proc = procedures.find(procedure => procedure.id === selected);
  const ended = !!game && ["won", "lost", "exercise"].includes(game.status);
  const config = game ? difficulties[game.difficulty] : difficulties[difficulty];
  const decision = game ? getDecisionOptions(game) : null;
  const outcome = game ? getOutcome(game) : null;
  const activeHypothesis = game ? hypotheses.find(item => item.id === game.hypothesis) : null;
  const procedureAligned = !!proc && !!activeHypothesis?.procedures.includes(proc.id);

  function clearStoredSession() {
    localStorage.removeItem(SESSION_KEY);
    setSavedSession(null);
  }

  function start(index = scenarioChoice) {
    if (busyRef.current) return;
    clearStoredSession();
    setGame(newGame(index, difficulty));
    setSelected(null);
    setReport(null);
    setInlineReport(null);
    setQuestion(null);
    setDebrief(false);
    setNewConfirm(false);
    setAnnouncement("New investigation started.");
    playFeedback("open", soundEnabled, hapticsEnabled);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resume(session: SavedSession) {
    setGame(session.game);
    setGuided(session.guided);
    setFastResolve(session.fastResolve);
    setDifficulty(session.game.difficulty);
    setScenarioChoice(session.game.scenario);
    setReport(session.game.pendingDecision ? session.game.turns.at(-1) ?? null : null);
    setInlineReport(null);
    setSavedSession(null);
    setAnnouncement(`Resumed ${scenarios[session.game.scenario].title}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function run(id: string) {
    const current = stateRef.current;
    if (!current || busyRef.current || current.status !== "playing" || current.pendingDecision || current.pendingCommand || availableIn(current, id) > 0) return;
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
      const next = playTurn(current, id);
      const result = next.turns.at(-1)!;
      const requiresDialog = !quick || !!result.revealed || !!result.inject || !!result.adversaryEvent || next.status !== "playing";
      setDie(result.raw);
      setGame(next);
      setReport(requiresDialog ? result : null);
      setInlineReport(requiresDialog ? null : result);
      setRolling(false);
      setAnnouncement(`Turn ${result.number}. ${result.success ? "Procedure succeeded." : "Procedure unsuccessful."} Business impact is ${next.impact}. ${getOperationalLabel(next)} is ${next.continuity}.`);
      playFeedback(result.adversaryEvent ? "warning" : result.success ? "success" : "failure", soundEnabled, hapticsEnabled);
      if (["lost", "exercise"].includes(next.status)) recordProgress(next);
      busyRef.current = false;
    }, quick ? 0 : 850);
    timers.current.push(timeout);
  }

  function decide(choice: "observe" | "act") {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveDecision(current, choice);
    setGame(next);
    playFeedback("decision", soundEnabled, hapticsEnabled);
    setAnnouncement(`Decision recorded. Business impact is ${next.impact}. ${getOperationalLabel(next)} is ${next.continuity}.`);
  }

  function chooseHypothesis(id: HypothesisId) {
    const current = stateRef.current;
    if (!current || current.pendingDecision) return;
    const next = setHypothesis(current, id);
    setGame(next);
    setAnnouncement(`Working hypothesis set to ${hypotheses.find(item => item.id === id)?.title}.`);
  }

  function respond(choice: string) {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveResponse(current, choice);
    setGame(next);
    playFeedback(next.status === "won" ? "complete" : "decision", soundEnabled, hapticsEnabled);
    setAnnouncement(next.status === "won" ? "Response complete. After-action review available." : "Containment decision recorded. Choose a recovery approach.");
    if (next.status === "won") {
      recordProgress(next);
      setDebrief(true);
    }
  }

  function command(choice: "a" | "b") {
    const current = stateRef.current;
    if (!current) return;
    const next = resolveCommand(current, choice);
    setGame(next);
    playFeedback(choice === "a" ? "decision" : "warning", soundEnabled, hapticsEnabled);
    setAnnouncement(`Command decision recorded. Business impact is ${next.impact}.`);
  }

  function recordProgress(result: Game) {
    const marker = `${result.scenario}:${result.status}:${result.turns.length}:${result.responseChoices.join("-")}`;
    if (recordedRuns.current.has(marker)) return;
    recordedRuns.current.add(marker);
    const score = getOutcome(result).breakdown.total;
    setCampaign(current => {
      const updated = recordCampaignResult(current, result, score);
      localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(updated));
      return updated;
    });
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
  }

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;
    const session = parseSession(stored);
    const loadTimer = setTimeout(() => {
      if (session && session.game.status !== "won") setSavedSession(session);
      else if (!session) localStorage.removeItem(SESSION_KEY);
    }, 0);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setCampaign(parseCampaign(localStorage.getItem(CAMPAIGN_KEY)));
      const preferences = localStorage.getItem("breach-command.preferences");
      if (preferences) {
        try {
          const parsed = JSON.parse(preferences) as { sound?: boolean; haptics?: boolean; highContrast?: boolean };
          setSoundEnabled(parsed.sound !== false);
          setHapticsEnabled(parsed.haptics !== false);
          setHighContrast(parsed.highContrast === true);
        } catch {}
      }
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    localStorage.setItem("breach-command.preferences", JSON.stringify({ sound: soundEnabled, haptics: hapticsEnabled, highContrast }));
  }, [soundEnabled, hapticsEnabled, highContrast]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === "f") setRules(value => !value);
      if (event.key.toLowerCase() === "m") setSoundEnabled(value => !value);
      if (event.key.toLowerCase() === "g") setGuided(value => !value);
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  useEffect(() => {
    stateRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!game) return;
    localStorage.setItem(SESSION_KEY, serialiseSession(game, guided, fastResolve));
  }, [game, guided, fastResolve]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
          const currentDifficulty = difficulties[current.difficulty];
          return {
            status: current.status,
            difficulty: current.difficulty,
            incident: scenarios[current.scenario].title,
            turnsUsed: current.turns.length,
            turnsRemaining: Math.max(0, currentDifficulty.maxTurns - current.turns.length),
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

  const answer = game && question === "scope" ? activeScenario.scope
    : question === "constraints" ? activeScenario.constraints
    : question === "impact" ? activeScenario.impact
    : question === "known" ? `${activeScenario.timeline} ${getLead(game!)}`
    : question === "adversary" ? `Assessed objective: ${scenarioDynamics[game!.scenario].objective} Current behaviour: ${getAdversaryState(game!)}. ${getAdversaryRead(game!)}`
    : question === "assumptions" ? "Treat alerts, valid credentials and successful procedures as evidence, not conclusions. Record one working hypothesis for each turn and revise it only when evidence no longer fits."
    : "";

  return (
    <div className={`app-shell ${highContrast ? "high-contrast" : ""}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Breach Command home">
          <span className="brand-mark"><Shield size={24} /></span>
          <span>BREACH<span className="brand-light">COMMAND</span></span>
        </Link>
        <div className="top-actions">
          <span className="solo-label"><Terminal size={14} /> SINGLE PLAYER</span>
          <button className="quiet-button" onClick={() => setRules(true)}><BookOpen size={17} /><span>Field guide</span></button>
          <button className="quiet-button" onClick={() => setSettings(true)} aria-label="Game settings"><Settings2 size={17} /><span>Settings</span></button>
          {game && <button className="quiet-button" disabled={rolling} onClick={() => setNewConfirm(true)} aria-label="New incident"><RotateCcw size={16} /><span>New incident</span></button>}
        </div>
      </header>

      {!game ? (
        <main className="briefing-screen">
          <div className="briefing-main">
            <div className="eyebrow"><span className="status-beacon" /> INCIDENT RESPONSE SIMULATION</div>
            <h1>Find the breach.<br /><span>Outthink the adversary.</span></h1>
            <p className="intro">You lead the investigation. The computer adapts the hidden attack chain, escalates sector-specific consequences and reacts to intervention.</p>
            <div className="briefing-chain" aria-label="Four attack stages">
              {stages.map((stage, index) => {
                const Icon = stageIcons[index];
                return <div key={stage.name} style={{ "--stage-color": stage.color } as React.CSSProperties}><Icon size={22} /><span>{stage.short}</span><small>0{index + 1}</small></div>;
              })}
            </div>
            <div className="first-move"><Dices size={20} /><p>Form a hypothesis, test evidence, command the response.</p></div>
            <section className="career-card" aria-label="Command career progression">
              <div><span className="eyebrow">COMMAND CAREER</span><strong>{campaignRank(campaign.xp)}</strong><small>{campaign.completed.length}/{scenarios.length} incidents completed · {campaign.operations} operations</small></div>
              <b>{campaign.xp}<small> XP</small></b>
              <div className="career-progress"><span style={{ width: `${Math.min(100, campaign.xp / 8)}%` }} /></div>
            </section>
          </div>
          <section className="mission-panel">
            <div className="panel-top"><span className="eyebrow">YOUR NEXT ASSIGNMENT</span><span className="mono muted">{String(scenarioChoice + 1).padStart(2, "0")} / {String(scenarios.length).padStart(2, "0")}</span></div>
            <div className="mission-symbol"><ScenarioIcon size={33} strokeWidth={1.4} /><span>{activeScenario.sector}</span></div>
            <h2>{activeScenario.title}</h2>
            <p>{activeScenario.summary}</p>
            <div className="mission-selector" aria-label="Select incident">
              {scenarios.map((scenario, index) => <button key={scenario.id} aria-label={`${scenario.title}${campaign.completed.includes(index) ? ", completed" : ""}`} aria-pressed={scenarioChoice === index} className={`${scenarioChoice === index ? "active" : ""} ${campaign.completed.includes(index) ? "completed" : ""}`} onClick={() => setScenarioChoice(index)}>{String(index + 1).padStart(2, "0")}</button>)}
            </div>
            <div className="difficulty-picker">
              <span className="eyebrow">DIFFICULTY</span>
              <div>{(Object.keys(difficulties) as Difficulty[]).map(id => <button key={id} className={difficulty === id ? "active" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><strong>{difficulties[id].title}</strong><small>{difficulties[id].maxTurns} turns · {difficulties[id].threshold}+</small></button>)}</div>
              <p>{difficulties[difficulty].description}</p>
            </div>
            <div className="setup-controls">
              <div className="guided-control">
                <div><label htmlFor="guided-start">Guided reflection</label><small>Strategic prompts, never the correct card.</small></div>
                <Switch id="guided-start" checked={guided} onCheckedChange={setGuided} />
              </div>
              <div className="guided-control">
                <div><label htmlFor="fast-start">Fast resolution</label><small>Skip confirmations and dice animation after turn one.</small></div>
                <Switch id="fast-start" checked={fastResolve} onCheckedChange={setFastResolve} />
              </div>
            </div>
            {savedSession && (
              <section className="resume-card">
                <div><Clock3 size={19} /><span><strong>Investigation saved</strong><small>{scenarios[savedSession.game.scenario].title} · Turn {savedSession.game.turns.length} · {savedSession.game.impact} impact</small></span></div>
                <div className="resume-actions">
                  <button onClick={() => resume(savedSession)}>Resume</button>
                  <button onClick={clearStoredSession}>Discard</button>
                </div>
              </section>
            )}
            <button className="primary-button start-button" onClick={() => start()}>Begin investigation <ArrowRight size={19} /></button>
            <div className="mission-meta"><span><Clock3 size={14} /> 20–35 minutes solo</span><span><LockKeyhole size={14} /> No real systems</span></div>
          </section>
          <p className="adaptation-note">An unofficial solo adaptation inspired by <a href="https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/" target="_blank" rel="noreferrer">Backdoors &amp; Breaches</a>. Original scenarios and card text. Rule-based computer facilitator.</p>
        </main>
      ) : (
        <main className="game-screen">
          <section className="game-heading">
            <div><div className="eyebrow">CASE 0{game.scenario + 1} <span className="separator">/</span> {activeScenario.sector} <span className="separator">/</span> {config.title.toUpperCase()}</div><h1>{activeScenario.title}</h1></div>
            <div className="case-meters">
              <div className="turn-meter">
                <span className="mono">{game.status === "response" ? "RESPONSE PHASE" : ended ? "FINAL STATUS" : "INVESTIGATION WINDOW"}</span>
                <div>{!ended && game.status !== "response" ? <><strong>{Math.max(0, config.maxTurns - game.turns.length)}</strong> turns remaining</> : game.status === "response" ? "Contain and recover" : game.status === "won" ? "Response complete" : game.status === "exercise" ? "Exercise concluded" : "Window closed"}</div>
                <Progress value={Math.max(0, (config.maxTurns - game.turns.length) / config.maxTurns * 100)} className="turn-progress" aria-label="Turns remaining" />
              </div>
              <div className={`impact-meter ${game.impact >= 70 ? "critical" : ""}`}>
                <span className="mono">BUSINESS IMPACT</span><strong>{game.impact}</strong>
                <Progress value={game.impact} aria-label="Business impact" />
                <small>{game.impact < 40 ? "Contained" : game.impact < 70 ? "Rising" : "Critical"}</small>
              </div>
              <div className={`continuity-meter ${game.continuity <= 45 ? "critical" : ""}`}>
                <span className="mono">{getOperationalLabel(game).toUpperCase()}</span><strong>{game.continuity}</strong>
                <Progress value={game.continuity} aria-label={getOperationalLabel(game)} />
                <small>{game.continuity > 75 ? "Stable" : game.continuity > 45 ? "Degraded" : "At risk"}</small>
              </div>
            </div>
          </section>

          <div className="game-layout">
            <div className="table-area">
              <section className="attack-section">
                <div className="section-heading"><h2>Attack chain</h2><span className="mono muted">{game.revealed.length} / 4 REVEALED</span></div>
                <div className="attack-grid">
                  {stages.map((stage, index) => {
                    const attack = attacks.find(item => item.id === game.chain[index])!;
                    const revealed = game.revealed.includes(attack.id);
                    const Icon = stageIcons[index];
                    return (
                      <div className={`attack-card ${revealed ? "revealed" : "concealed"}`} key={stage.name} style={{ "--stage-color": stage.color } as React.CSSProperties}>
                        <div className="attack-card-top"><span className="mono">0{index + 1}</span>{revealed ? <Check size={16} /> : <LockKeyhole size={14} />}</div>
                        <div className="attack-emblem"><Icon size={28} strokeWidth={1.3} /></div>
                        <small>{stage.name}</small>
                        <h3>{revealed ? attack.title : "Unknown technique"}</h3>
                        <span className="attack-footer">{revealed ? "EVIDENCE CONFIRMED" : "AWAITING EVIDENCE"}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <OperationsMap game={game} />

              {ended ? (
                <section className="end-banner">
                  <div className="end-icon">{game.status === "won" ? <Trophy /> : <Flag />}</div>
                  <div>
                    <h2>{game.status === "won" ? outcome?.title : game.status === "exercise" ? "This was an authorised exercise." : "The incident outran the response."}</h2>
                    <p>{game.status === "won" ? `Outcome ${outcome?.grade}, ${outcome?.breakdown.total}/100. Review how investigation and response choices shaped the result.` : "The captain has unsealed the case. Review the evidence and decisions."}</p>
                  </div>
                  <button className="primary-button" onClick={() => setDebrief(true)}>View debrief <ArrowRight size={17} /></button>
                </section>
              ) : game.status === "response" ? (
                <ResponsePanel game={game} onChoose={respond} />
              ) : (
                <section className="lead-strip"><Activity size={20} /><div><span className="eyebrow">CURRENT INTELLIGENCE</span><p>{getLead(game)}</p></div></section>
              )}

              {game.status === "playing" && !game.pendingCommand && <HypothesisBoard game={game} onChoose={chooseHypothesis} />}

              {game.status === "playing" && <CommandEvent game={game} onChoose={command} />}

              {inlineReport && (
                <section className={`inline-result ${inlineReport.success ? "success" : "failure"}`} aria-live="polite">
                  <div>
                    <span className="eyebrow">TURN {inlineReport.number} · QUICK RESULT</span>
                    <strong>{inlineReport.success ? "Procedure succeeded" : "Procedure unsuccessful"} · {inlineReport.total}</strong>
                    <p>{inlineReport.narrative}</p>
                  </div>
                  <button onClick={() => setInlineReport(null)} aria-label="Dismiss quick result"><X size={18} /></button>
                </section>
              )}

              {game.status === "playing" && !game.pendingCommand && (
                <section className="procedure-section">
                  <div className="section-heading">
                    <div><h2>Investigation procedures</h2><p>Choose one action per turn. Used actions cool down for three turns.</p></div>
                    <span className="established-key">+3 Established</span>
                  </div>
                  {guided && <div className="guide-nudge"><Sparkles size={15} /><span><strong>Captain’s prompt:</strong> {getCoachPrompt(game)}</span></div>}
                  <ProcedureGrid game={game} disabled={rolling} onChoose={id => fastResolve && game.turns.length > 0 ? run(id) : setSelected(id)} />
                </section>
              )}
            </div>

            <aside className="captain-column">
              <section className="captain-panel">
                <div className="captain-label"><span className="captain-avatar"><Terminal size={23} /></span><div><h2>Incident Captain</h2><span>ADAPTIVE COMPUTER FACILITATOR</span></div></div>
                <div className="brief-label">SITUATION</div>
                <p className="captain-brief">{activeScenario.brief}</p>
                <div className="captain-divider" />
                <div className="brief-label">ASK YOUR CAPTAIN <span>Free action</span></div>
                <div className="question-list">
                  {[
                    { id: "scope", label: "What is in scope?" },
                    { id: "known", label: "What is confirmed?" },
                    { id: "adversary", label: "What is the actor doing?" },
                    { id: "impact", label: "What is at risk?" },
                    { id: "constraints", label: "What limits us?" },
                    { id: "assumptions", label: "What should we challenge?" },
                  ].map(item => <button key={item.id} className={question === item.id ? "active" : ""} onClick={() => setQuestion(question === item.id ? null : item.id)}>{item.label}<ArrowRight size={14} /></button>)}
                </div>
                {question && <div className="captain-answer" aria-live="polite">{answer}</div>}
                <div className="guided-inline"><label htmlFor="guided-game"><Sparkles size={14} /> Guided reflection</label><Switch id="guided-game" checked={guided} onCheckedChange={setGuided} /></div>
                <div className="guided-inline"><label htmlFor="fast-game"><FastForward size={14} /> Fast resolution</label><Switch id="fast-game" checked={fastResolve} onCheckedChange={setFastResolve} /></div>
                <div className="adversary-read"><span className="eyebrow">ACTOR MODEL</span><p>{getAdversaryRead(game)}</p></div>
              </section>

              <section className="journal-panel">
                <div className="section-heading"><h2>Incident log</h2><span className="mono muted">{String(game.turns.length).padStart(2, "0")}</span></div>
                {!game.turns.length ? (
                  <div className="empty-log"><Terminal size={21} /><p>Investigation opened.</p><small>Hypotheses, findings and actor movements will appear here.</small></div>
                ) : (
                  <div className="journal-entries">
                    {[...game.turns].reverse().map(turn => (
                      <button className="log-entry" key={turn.number} onClick={() => setReport(turn)}>
                        <span className={`log-number ${turn.revealed ? "found" : turn.success ? "passed" : "failed"}`}>{String(turn.number).padStart(2, "0")}</span>
                        <div><strong>{procedures.find(procedure => procedure.id === turn.procedure)?.title}</strong><span>{turn.revealed ? "Stage revealed" : turn.adversaryEvent ? "Actor advanced" : turn.success ? "No new evidence" : "Action unsuccessful"} · Impact {turn.impactChange >= 0 ? "+" : ""}{turn.impactChange}</span></div>
                        <span className="roll-total">{turn.total}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
              <div className="rules-reminder"><Dices size={18} /><p>{config.threshold}+ succeeds. A correct hypothesis and a highlighted evidence source can add +1.</p></div>
            </aside>
          </div>

          <footer className="game-footer"><span>BREACH COMMAND <span className="separator">/</span> SINGLE-PLAYER TABLETOP</span><button onClick={() => setRules(true)}>Rules &amp; attribution <CircleHelp size={14} /></button></footer>
        </main>
      )}

      <Dialog open={!!proc && !rolling} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="game-dialog">
          <DialogHeader><div className="eyebrow">PREPARE ACTION</div><DialogTitle>{proc?.title}</DialogTitle><DialogDescription>{proc?.description}</DialogDescription></DialogHeader>
          {proc && game && <>
            <div className="action-note"><span className="eyebrow">HYPOTHESIS CHECK</span><p>{proc.question}</p></div>
            <div className={`alignment-notice ${procedureAligned ? "aligned" : ""}`}>
              <BrainLabel aligned={procedureAligned} />
              <span>{procedureAligned ? "This procedure supports your working hypothesis. It earns +1 if the hypothesis matches the next unresolved stage." : "This procedure does not directly support your working hypothesis. It can still reveal evidence, but cannot earn the hypothesis bonus."}</span>
            </div>
            <div className="roll-preview">
              <div><span>D20</span><small>Dice roll</small></div><span>+</span>
              <div><span>{game.established.includes(proc.id) ? 3 : 0}{game.nextModifier !== 0 ? ` ${game.nextModifier > 0 ? "+" : ""}${game.nextModifier}` : ""}</span><small>Known modifier</small></div><span>≥</span>
              <div><span>{config.threshold}</span><small>To succeed</small></div>
            </div>
            <p className="muted small">Success reveals a stage only when this evidence source matches an undiscovered technique. The action consumes one turn and may increase impact.</p>
            <button className="primary-button full" onClick={() => run(proc.id)}><Dices size={19} /> Run procedure</button>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={rolling} onOpenChange={() => {}}>
        <DialogContent className="roll-dialog" showCloseButton={false} onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
          <DialogHeader><DialogTitle>Running procedure</DialogTitle><DialogDescription>The Incident Captain is resolving evidence and pressure.</DialogDescription></DialogHeader>
          <div className="die rolling"><Dices size={32} /><strong>{die}</strong><span>D20</span></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!report} onOpenChange={open => { if (!open) dismissReport(); }}>
        <DialogContent className="game-dialog report-dialog">
          <DialogHeader>
            <div className="eyebrow">CAPTAIN’S REPORT <span className="separator">/</span> TURN {report?.number}</div>
            <DialogTitle>{report?.revealed ? "Evidence confirmed." : report?.success ? "No new attack identified." : "The action was unsuccessful."}</DialogTitle>
            <DialogDescription>{report && procedures.find(procedure => procedure.id === report.procedure)?.title}</DialogDescription>
          </DialogHeader>
          {report && game && <>
            <div className={`result-roll ${report.success ? "success" : "failure"}`}>
              <span className="result-die">{report.raw}</span>
              <div><span>Natural roll {report.raw} {report.modifier >= 0 ? "+" : "−"} {Math.abs(report.modifier)} modifier{report.planningBonus ? " including hypothesis bonus" : ""}</span><strong>{report.total} <span>/ {report.success ? "Success" : "Failure"}</span></strong></div>
              {report.success ? <CheckCheck size={23} /> : <X size={23} />}
            </div>
            <p>{report.narrative}</p>
            {report.revealed && <div className="discovery"><ShieldCheck size={22} /><div><span>{stages[attacks.find(attack => attack.id === report.revealed)!.stage].name}</span><strong>{attacks.find(attack => attack.id === report.revealed)?.title}</strong></div></div>}
            {report.adversaryEvent && <div className="adversary-event"><Siren size={20} /><div><span className="eyebrow">ACTOR MOVEMENT</span><p>{report.adversaryEvent}</p></div></div>}
            {report.inject && <div className="inject-box"><span className="eyebrow">INJECT <span className="separator">/</span> {report.inject.reason}</span><h3>{report.inject.title}</h3><p>{report.inject.text}</p><strong>{report.inject.effectLabel}</strong></div>}
            {decision && (
              <div className="evidence-decision">
                <span className="eyebrow">OPERATIONAL DECISION REQUIRED</span>
                <h3>{decision.attack.title}: act now or learn more?</h3>
                <div>
                  <button onClick={() => decide("observe")}><Eye size={20} /><strong>{decision.observe.title}</strong><span>{decision.observe.description}<br /><b>{decision.observe.evidence}</b> · {decision.observe.risk}</span></button>
                  <button onClick={() => decide("act")}><Siren size={20} /><strong>{decision.act.title}</strong><span>{decision.act.description}<br /><b>{decision.act.service}</b> · {decision.act.evidence}</span></button>
                </div>
              </div>
            )}
            <p className="small muted">Business impact changed by {report.impactChange >= 0 ? "+" : ""}{report.impactChange}; {getOperationalLabel(game).toLowerCase()} changed by {report.continuityChange}. Decision quality is explained in the debrief.</p>
            {!game.pendingDecision && <button className="primary-button full" onClick={dismissReport}>{game.status === "response" ? "Enter response phase" : ended ? "Open debrief" : "Continue investigation"}<ArrowRight size={17} /></button>}
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={rules} onOpenChange={setRules}>
        <DialogContent className="game-dialog wide-dialog">
          <DialogHeader><div className="eyebrow">FIELD GUIDE</div><DialogTitle>Investigate. Decide. Recover.</DialogTitle><DialogDescription>A complete solo incident-response exercise with hidden information and operational consequences.</DialogDescription></DialogHeader>
          <div className="rules-content">
            <div className="rules-grid">
              <section><h3>01 / Objective</h3><p>Reveal four hidden attack stages before the turn limit or impact reaches 100. Then make containment and recovery decisions.</p></section>
              <section><h3>02 / Hypotheses &amp; dice</h3><p>Record one explanation per turn. Highlighted evidence sources can earn +1 when the hypothesis matches the next unresolved stage. Established procedures add +3.</p></section>
              <section><h3>03 / Adaptive adversary</h3><p>The actor escalates according to its behaviour profile and can move to a route less exposed by your recent procedures after intervention.</p></section>
              <section><h3>04 / Contextual decisions</h3><p>Each discovery creates a technique-specific choice: gather stronger evidence or intervene. The best choice depends on current impact and adversary tempo.</p></section>
              <section><h3>05 / Hidden consequences</h3><p>Decision cards show disruption, confidence and residual risk rather than exact scores. Natural rolls and failure streaks can trigger injects.</p></section>
              <section><h3>06 / Score &amp; recovery</h3><p>The 100-point review covers investigation speed, impact, continuity, decision quality, response quality and hypothesis accuracy.</p></section>
              <section><h3>07 / Saved sessions</h3><p>Your current investigation is saved on this device. Refresh safely and resume from the assignment screen.</p></section>
              <section><h3>08 / Fast resolution</h3><p>After turn one, fast mode skips confirmation and dice animation for routine actions. Discoveries and major events still receive full reports.</p></section>
              <section><h3>09 / Command events</h3><p>Operational interruptions test scoping, leadership communication and specialist allocation. These choices affect pressure, continuity and adversary tempo.</p></section>
              <section><h3>10 / Campaign progression</h3><p>Completed incidents, best scores and command experience remain on this device. Progress unlocks professional capability milestones.</p></section>
            </div>
            <section className="attribution"><h3>About this adaptation</h3><p>Inspired by Backdoors &amp; Breaches, created by Black Hills Information Security and Active Countermeasures. This unofficial adaptation is not affiliated with or endorsed by the creators. It uses original wording, fictional settings and a rule-based facilitator. It does not reproduce the commercial deck, official artwork or expansion content.</p><a href="https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf" target="_blank" rel="noreferrer">Read the official classic rules <ArrowRight size={14} /></a></section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={debrief} onOpenChange={setDebrief}>
        <DialogContent className="game-dialog wide-dialog debrief-dialog">
          <DialogHeader>
            <div className="eyebrow">AFTER-ACTION REVIEW</div>
            <DialogTitle>{game?.status === "won" ? `${outcome?.grade} / ${outcome?.title}` : game?.status === "exercise" ? "Exercise concluded." : "The response window closed."}</DialogTitle>
            <DialogDescription>{game?.status === "won" ? outcome?.detail : game ? `${game.revealed.length} of 4 stages found in ${game.turns.length} turns. This is a learning outcome, not a security assessment.` : ""}</DialogDescription>
          </DialogHeader>
          {game && outcome && <>
            <div className="debrief-stats">
              <div><strong>{game.turns.filter(turn => turn.success).length}/{game.turns.length}</strong><span>Rolls succeeded</span></div>
              <div><strong>{game.impact}</strong><span>Final impact</span></div>
              <div><strong>{game.continuity}</strong><span>{getOperationalLabel(game)}</span></div>
            </div>
            <section className="score-card">
              <div className="score-total"><span>FINAL SCORE</span><strong>{outcome.breakdown.total}<small>/100</small></strong></div>
              <div className="score-breakdown">
                {[
                  ["Investigation", outcome.breakdown.investigation, 25],
                  ["Impact control", outcome.breakdown.impact, 15],
                  ["Continuity", outcome.breakdown.continuity, 15],
                  ["Operational decisions", outcome.breakdown.decisions, 15],
                  ["Containment & recovery", outcome.breakdown.response, 20],
                  ["Hypothesis accuracy", outcome.breakdown.hypothesis, 10],
                ].map(([label, value, maximum]) => <div key={String(label)}><span>{label}</span><strong>{value}/{maximum}</strong></div>)}
              </div>
            </section>
            <section className="advanced-review">
              <div><strong>{game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0)}</strong><span>Hypothesis revisions</span></div>
              <div><strong>{game.turns.filter(turn => turn.planningBonus > 0).length}</strong><span>Evidence-aligned actions</span></div>
              <div><strong>{game.commandHistory.length}</strong><span>Command events resolved</span></div>
              <div><strong>{game.turns.filter(turn => turn.success && !turn.revealed).length}</strong><span>Successful but non-discriminating actions</span></div>
            </section>
            <section className="timeline">
              <span className="eyebrow">EVIDENCE &amp; DECISION TIMELINE</span>
              {game.turns.map(turn => (
                <div key={turn.number}>
                  <span>{String(turn.number).padStart(2, "0")}</span>
                  <p><strong>{procedures.find(procedure => procedure.id === turn.procedure)?.title}</strong>{turn.hypothesis ? ` · Hypothesis: ${hypotheses.find(item => item.id === turn.hypothesis)?.title}` : " · No hypothesis recorded"}<small>{turn.revealed ? `Revealed ${attacks.find(attack => attack.id === turn.revealed)?.title}` : turn.narrative}</small></p>
                </div>
              ))}
            </section>
            {(game.decisions.length > 0 || game.commandHistory.length > 0) && (
              <div className="decision-summary">
                <span className="eyebrow">YOUR DECISIONS</span>
                {game.decisions.map((record, index) => <p key={`${record.stage}-${index}`}><strong>{attacks.find(attack => attack.id === record.stage)?.title}:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.rationale}</em>{record.adaptedTo && <em>Actor adaptation: {record.adaptationReason ?? `the hidden route changed to ${attacks.find(attack => attack.id === record.adaptedTo)?.title}.`}</em>}</p>)}
                {game.commandHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>Command event:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.effect}</em></p>)}
                {game.responseChoices.map(id => {
                  const option = [...responseOptions.containment, ...responseOptions.recovery].find(item => item.id === id);
                  return <p key={id}><strong>Response:</strong> {option?.title}<span>{option?.confidence} confidence · {option?.residual} residual risk</span></p>;
                })}
              </div>
            )}
            <section className="counterfactuals"><span className="eyebrow">WHAT MIGHT HAVE CHANGED</span>{getCounterfactuals(game).map((item, index) => <p key={index}>{item}</p>)}</section>
            <div className="debrief-chain">
              {game.chain.map((id, index) => {
                const attack = attacks.find(item => item.id === id)!;
                const tactic = ["Initial Access", "Lateral Movement", "Persistence", "Command and Control / Exfiltration"][index];
                return <section key={id} style={{ "--stage-color": stages[index].color } as React.CSSProperties}><span className="eyebrow">0{index + 1} / {stages[index].name}<span className={game.revealed.includes(id) ? "found-label" : "missed-label"}>{game.revealed.includes(id) ? "FOUND" : "UNRESOLVED"}</span></span><h3>{attack.title}</h3><p>{attack.evidence}</p><small>MITRE ATT&amp;CK lens: {tactic}<br />Detectable with: {attack.detect.map(source => procedures.find(procedure => procedure.id === source)?.title).join(" · ")}</small></section>;
              })}
            </div>
            <section className="debrief-learning"><h3>Take this back to your team</h3><p>{game.turns.some(turn => turn.success && !turn.revealed) ? "Some actions passed without finding new evidence. Did each action separate plausible explanations, or simply use an available tool?" : "Which evidence sources or decision authorities would be weakest in a real response?"}</p><p>{activeScenario.lesson}</p></section>
            <section className="capability-review"><span className="eyebrow">CAMPAIGN CAPABILITIES</span>{unlockedCapabilities(campaign.xp).map(item => <div key={item.title} className={item.unlocked ? "unlocked" : "locked"}><strong>{item.title}</strong><span>{item.unlocked ? item.detail : "Continue the campaign to unlock this milestone."}</span></div>)}</section>
            <div className="debrief-actions">
              <button className="secondary-button" onClick={() => window.print()}><Printer size={17} /> Print review</button>
              <button className="primary-button" onClick={() => { const nextScenario = (game.scenario + 1) % scenarios.length; resetToBriefing(); setScenarioChoice(nextScenario); }}>Choose next incident <ArrowRight size={18} /></button>
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="game-dialog settings-dialog">
          <DialogHeader><div className="eyebrow">GAME SETTINGS</div><DialogTitle>Command interface</DialogTitle><DialogDescription>Adjust feedback, accessibility and display behaviour. Preferences stay on this device.</DialogDescription></DialogHeader>
          <div className="settings-list">
            <label htmlFor="sound-setting"><span><Volume2 size={19} /><b>Sound cues</b><small>Procedural audio for discoveries, warnings and outcomes.</small></span><Switch id="sound-setting" checked={soundEnabled} onCheckedChange={setSoundEnabled} /></label>
            <label htmlFor="haptic-setting"><span><Vibrate size={19} /><b>Haptic feedback</b><small>Short vibration cues on supported mobile devices.</small></span><Switch id="haptic-setting" checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} /></label>
            <label htmlFor="contrast-setting"><span><Contrast size={19} /><b>High contrast</b><small>Strengthens borders, text and interactive states.</small></span><Switch id="contrast-setting" checked={highContrast} onCheckedChange={setHighContrast} /></label>
          </div>
          <button className="secondary-button full" onClick={() => { const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); Promise.resolve(action).catch(() => {}); }}><Maximize2 size={17} /> Toggle full screen</button>
          <p className="shortcut-note">Keyboard: F field guide · M sound · G guided reflection</p>
        </DialogContent>
      </Dialog>

      <AlertDialog open={newConfirm} onOpenChange={setNewConfirm}>
        <AlertDialogContent className="game-dialog">
          <AlertDialogHeader><AlertDialogTitle>Leave this investigation?</AlertDialogTitle><AlertDialogDescription>Your current case, turn history and saved session will be cleared.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep investigating</AlertDialogCancel><AlertDialogAction onClick={resetToBriefing}>Choose a new incident</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BrainLabel({ aligned }: { aligned: boolean }) {
  return <span aria-hidden="true" className="alignment-icon">{aligned ? <CheckCheck size={18} /> : <CircleHelp size={18} />}</span>;
}

function ResponsePanel({ game, onChoose }: { game: Game; onChoose: (choice: string) => void }) {
  const containment = game.responseChoices.length === 0;
  const options = containment ? responseOptions.containment : responseOptions.recovery;
  return (
    <section className="response-panel">
      <div className="response-heading">
        <span className="response-icon">{containment ? <Zap size={24} /> : <HeartPulse size={24} />}</span>
        <div><span className="eyebrow">{containment ? "CONTAINMENT DECISION" : "RECOVERY DECISION"}</span><h2>{containment ? "The chain is known. Stop the active risk." : "The threat is constrained. Restore trusted service."}</h2><p>{containment ? "There is no perfect choice. Balance attacker access, evidence and operational continuity." : "Choose how much confidence, time and disruption the organisation can accept. Exact scoring is revealed in the review."}</p></div>
      </div>
      <div className="response-options">
        {options.map(option => <button key={option.id} onClick={() => onChoose(option.id)}><strong>{option.title}</strong><span>{option.description}</span><small>DISRUPTION {option.disruption} · CONFIDENCE {option.confidence} · RESIDUAL RISK {option.residual}</small><ArrowRight size={17} /></button>)}
      </div>
    </section>
  );
}
