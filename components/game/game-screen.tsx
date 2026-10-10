import { useEffect, useRef, useState } from "react";
import { CircleHelp, TriangleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMessages } from "@/hooks/use-messages";
import { TutorialCoach } from "@/components/game/tutorial-coach";
import { CommandWorkspace } from "@/components/game/command-workspace";
import { InvestigateWorkspace } from "@/components/game/investigate-workspace";
import { BriefingWorkspace } from "@/components/game/briefing-workspace";
import { FaultBoundary } from "@/components/game/fault-boundary";
import { BotControl } from "@/components/game/bot-control";
import { gameModes, getAdversaryState, getLossReason, getOperationalLabel, getSectorAlert, getTurnLimit, SECTOR_ALERT_AT, sectorSystems, type LossCause } from "@/lib/advanced-game";
import { CONTINUITY_AT_RISK, IMPACT_CRITICAL, OBJECTIVE_IMMINENT, type GameSession } from "@/hooks/use-game-session";
import { gameScreenMessages } from "@/lib/i18n/en/game-screen";
import { register, type MessageKey } from "@/lib/i18n";

register(gameScreenMessages);


// The final status names what ended a lost operation. It said "Window closed"
// for all five endings, under a banner that said impact had reached its limit.
const lossStatus: Record<LossCause, MessageKey> = {
  objective: "gameScreen.adversaryObjectiveReached",
  impact: "gameScreen.impactLimitReached",
  continuity: "gameScreen.essentialServiceStopped",
  sector: "gameScreen.sectorMarginExhausted",
  window: "gameScreen.windowClosed",
};

export function GameScreen({ session }: { session: GameSession }) {
  const { t } = useMessages();
  const {
    game, activeScenario, config, ended, activeWorkspace, setActiveWorkspace,
    tutorial, dismissTutorial, setRules, meterPulse,
  } = session;
  const tabs = useRef<HTMLElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const meters = useRef<HTMLDivElement>(null);
  // Once the readouts have scrolled away, a compact copy rides under the pinned
  // tabs. After each report Investigate lands on the reading and the cards, and
  // the meters' change marks played where nobody was looking.
  const [metersAway, setMetersAway] = useState(false);
  const scenarioShown = game ? game.scenario : -1;
  useEffect(() => {
    const target = meters.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setMetersAway(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, [scenarioShown]);

  // A workspace change is a change of page. Keeping the previous page's scroll
  // position dropped a player half-way down the infrastructure map after a
  // sector decision. The tabs are sticky, so the top is measured from the shell
  // beneath them, and a player already above it is left where they are.
  // Only a change counts: on mount the screen is already being scrolled to the
  // top by whatever started or resumed the operation.
  const shownWorkspace = useRef(activeWorkspace);
  useEffect(() => {
    if (shownWorkspace.current === activeWorkspace) return;
    shownWorkspace.current = activeWorkspace;
    if (!shell.current) return;
    const top = shell.current.getBoundingClientRect().top + window.scrollY - (tabs.current?.offsetHeight ?? 0) - 16;
    if (window.scrollY > top) window.scrollTo({ top });
  }, [activeWorkspace]);

  if (!game) return null;
  const sectorAlert = getSectorAlert(game);

  return (
    <main className={`game-screen sector-theme-${game.scenario}`} id="main-content">
      <section className="game-heading">
        <div className="game-identity">
          {/* Each separator travels with the segment after it, so a breadcrumb that
              wraps on a narrow phone never ends a line on a bare "/". */}
          <div className="eyebrow case-line"><span>{t("briefingScreen.case")}<span className="mono">{String(game.scenario + 1)}</span></span>{[activeScenario.sector, config.title, gameModes[game.mode].title].map(part => <span key={part} className="crumb"><span className="separator">/</span> {part}</span>)}</div>
          <h1>{activeScenario.title}</h1>
          {/* The investigation window rarely decides an operation, so it reads as
              context under the title rather than competing with the three
              pressures that do. */}
          <div className="operation-status">
            <span className="mono">{game.status === "response" ? t("gameScreen.responsePhase") : ended ? t("gameScreen.finalStatus") : t("gameScreen.investigationWindow")}</span>
            <span>{!ended && game.status !== "response" ? <><strong>{Math.max(0, getTurnLimit(game) - game.turns.length)}</strong> {t("gameScreen.ofTurnsRemaining", { limit: getTurnLimit(game) })}</> : game.status === "response" ? t("gameScreen.containAssureAnd") : game.status === "won" ? t("gameScreen.responseComplete") : game.status === "exercise" ? t("gameScreen.exerciseConcluded") : t(lossStatus[getLossReason(game).cause])}</span>
            <Progress value={Math.max(0, (getTurnLimit(game) - game.turns.length) / getTurnLimit(game) * 100)} className="turn-progress" aria-label={t("window.label")} />
          </div>
          {/* The sector's own margin ends an operation at zero like the three
              readouts, and a Crisis playtest lost to it having never seen it:
              it lived on Command's board until the alert at 35. It stays in
              view here, in the readout's own name. */}
          <p className={`sector-margin-line ${game.sectorHealth <= SECTOR_ALERT_AT ? "low" : ""}`}><span className="mono"><span className="margin-prefix">{t("gameScreen.sector")}</span><span className="margin-word">{t("gameScreen.margin")}</span></span> <strong>{game.sectorHealth}</strong> {sectorSystems[game.scenario].title}</p>
        </div>
        <div className="case-meters" ref={meters}>
          <div className={`impact-meter ${game.impact >= IMPACT_CRITICAL ? "critical" : game.impact >= 40 ? "rising" : ""} ${meterPulse?.impactCritical ? "crossing" : ""}`}>
            <span className="mono">{t("gameScreen.businessImpact")}</span><strong>{game.impact}</strong>
            <Progress value={game.impact} aria-label={t("gameScreen.businessImpact")} />
            <small>{game.impact < 40 ? t("gameScreen.contained") : game.impact < IMPACT_CRITICAL ? t("gameScreen.rising") : t("gameScreen.critical")}</small>
            {meterPulse?.impactCritical && <span key={`impact-cross-${meterPulse.key}`} className="meter-crossing" aria-hidden="true" />}
            {meterPulse && meterPulse.impact !== 0 && (
              <span key={`impact-delta-${meterPulse.key}`} className={`meter-delta ${meterPulse.impact > 0 ? "adverse" : "favourable"}`} aria-hidden="true">
                {meterPulse.impact > 0 ? "+" : "−"}{Math.abs(meterPulse.impact)} {meterPulse.impact > 0 ? "worse" : "better"}
              </span>
            )}
          </div>
          <div className={`continuity-meter ${game.continuity <= CONTINUITY_AT_RISK ? "critical" : ""} ${meterPulse?.continuityAtRisk ? "crossing" : ""}`}>
            <span className="mono">{getOperationalLabel(game)}</span><strong>{game.continuity}</strong>
            <Progress value={game.continuity} aria-label={getOperationalLabel(game)} />
            <small>{game.continuity > 75 ? t("gameScreen.stable") : game.continuity > CONTINUITY_AT_RISK ? t("gameScreen.degraded") : t("gameScreen.atRisk")}</small>
            {meterPulse?.continuityAtRisk && <span key={`continuity-cross-${meterPulse.key}`} className="meter-crossing" aria-hidden="true" />}
            {meterPulse && meterPulse.continuity !== 0 && (
              <span key={`continuity-delta-${meterPulse.key}`} className={`meter-delta ${meterPulse.continuity < 0 ? "adverse" : "favourable"}`} aria-hidden="true">
                {meterPulse.continuity > 0 ? "+" : "−"}{Math.abs(meterPulse.continuity)} {meterPulse.continuity < 0 ? "worse" : "better"}
              </span>
            )}
          </div>
          <div className={`objective-meter ${game.objectiveProgress >= OBJECTIVE_IMMINENT ? "critical" : ""} ${meterPulse?.objectiveImminent ? "crossing" : ""}`}>
            <span className="mono">{t("gameScreen.adversaryProgress")}</span><strong>{game.objectiveProgress}</strong>
            <Progress value={game.objectiveProgress} aria-label={t("gameScreen.adversaryProgress")} />
            {/* The caption carries the pace as well, so "PACE: PRESSING HARD" beside a low
                number reads as one picture: little done so far, rising fast. */}
            <small>{game.objectiveProgress < 40 ? t("gameScreen.early") : game.objectiveProgress < OBJECTIVE_IMMINENT ? t("gameScreen.advancing") : t("gameScreen.imminent")}{game.adversaryTempo >= 2 && (game.status === "playing" || game.status === "response") ? `, pace ${getAdversaryState(game).toLowerCase()}` : ""}</small>
            {meterPulse?.objectiveImminent && <span key={`objective-cross-${meterPulse.key}`} className="meter-crossing" aria-hidden="true" />}
            {meterPulse && meterPulse.objective !== 0 && (
              <span key={`objective-delta-${meterPulse.key}`} className={`meter-delta ${meterPulse.objective > 0 ? "adverse" : "favourable"}`} aria-hidden="true">
                {meterPulse.objective > 0 ? "+" : "−"}{Math.abs(meterPulse.objective)} {meterPulse.objective > 0 ? "worse" : "better"}
              </span>
            )}
          </div>
        </div>
        {/* On a phone the sector's rule folds behind "What moves it"; written out,
            the alert was a hundred and seventy pixels above the procedures. */}
        {sectorAlert && <div className="sector-alert" role="status"><TriangleAlert size={16} aria-hidden="true" /><span><strong>{sectorAlert.title}.</strong> {sectorAlert.detail} <span className="sector-rule">{sectorAlert.rule}</span><details className="sector-rule-fold"><summary>{t("gameScreen.whatMovesIt")}</summary>{sectorAlert.rule}</details></span></div>}
      </section>

      <BotControl session={session} />

      <nav className="workspace-tabs" aria-label={t("gameScreen.commandWorkspace")} ref={tabs}>
        <button className={activeWorkspace === "command" ? "active" : ""} aria-pressed={activeWorkspace === "command"} onClick={() => setActiveWorkspace("command")}><span><strong>{t("tabs.command")}</strong></span>{(game.pendingDecision || game.pendingCommand || game.pendingSetPiece || game.status === "response") && <b>{t("tabs.decisionWaiting")}</b>}</button>
        <button className={activeWorkspace === "investigate" ? "active" : ""} aria-pressed={activeWorkspace === "investigate"} onClick={() => setActiveWorkspace("investigate")} disabled={game.status !== "playing"}><span><strong>{t("tabs.investigate")}</strong></span><b>{t("tabs.stages", { found: game.revealed.length })}</b></button>
        <button className={activeWorkspace === "briefing" ? "active" : ""} aria-pressed={activeWorkspace === "briefing"} onClick={() => setActiveWorkspace("briefing")}><span><strong>{t("tabs.briefing")}</strong></span><b>{t("tabs.turns", { count: game.turns.length })}</b></button>
        {/* A copy for sighted players who have scrolled past the readouts; the
            readouts themselves stay the accessible source. */}
        <div className={`pinned-readouts ${metersAway ? "shown" : ""}`} aria-hidden="true">
          <span>{t("gameScreen.businessImpact2")}<em>{game.impact}</em></span>
          <span>{getOperationalLabel(game)} <em>{game.continuity}</em></span>
          <span>{t("gameScreen.adversaryProgress2")}<em>{game.objectiveProgress}</em></span>
          <span>{t("gameScreen.sectorMargin")}<em>{game.sectorHealth}</em></span>
        </div>
      </nav>

      <div className="game-layout workspace-shell" ref={shell}>
        <div className="table-area" hidden={activeWorkspace === "briefing"}>
          {activeWorkspace !== "briefing" && tutorial && game.status === "playing" && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece && <TutorialCoach game={game} workspace={activeWorkspace} onNavigate={() => setActiveWorkspace("investigate")} onDismiss={dismissTutorial} />}
          <FaultBoundary name="Command workspace"><CommandWorkspace session={session} /></FaultBoundary>
          {activeWorkspace === "investigate" && game.status === "playing" && <FaultBoundary name="Investigate workspace"><InvestigateWorkspace session={session} /></FaultBoundary>}
        </div>

        <FaultBoundary name="Briefing workspace"><BriefingWorkspace session={session} /></FaultBoundary>
      </div>

      <footer className="game-footer"><span><span className="nowrap">{t("gameScreen.breachCommand")}</span> <span className="separator">/</span> <span className="nowrap">{t("gameScreen.singlePlayerTabletop")}</span></span><button onClick={() => setRules(true)}>{t("gameScreen.rulesAttribution")}<CircleHelp size={14} /></button></footer>
    </main>
  );
}
