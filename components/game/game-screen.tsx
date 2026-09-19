import { CircleHelp, LayoutDashboard, MessagesSquare, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TutorialCoach } from "@/components/game/tutorial-coach";
import { CommandWorkspace } from "@/components/game/command-workspace";
import { InvestigateWorkspace } from "@/components/game/investigate-workspace";
import { BriefingWorkspace } from "@/components/game/briefing-workspace";
import { gameModes, getOperationalLabel, getTurnLimit } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";

export function GameScreen({ session }: { session: GameSession }) {
  const {
    game, activeScenario, config, ended, activeWorkspace, setActiveWorkspace,
    tutorial, dismissTutorial, setRules,
  } = session;

  if (!game) return null;

  return (
    <main className={`game-screen sector-theme-${game.scenario}`} id="main-content">
      <section className="game-heading">
        <div><div className="eyebrow">CASE 0{game.scenario + 1} <span className="separator">/</span> {activeScenario.sector} <span className="separator">/</span> {config.title.toUpperCase()} <span className="separator">/</span> {gameModes[game.mode].title.toUpperCase()}</div><h1>{activeScenario.title}</h1></div>
        <div className="case-meters">
          <div className="turn-meter">
            <span className="mono">{game.status === "response" ? "RESPONSE PHASE" : ended ? "FINAL STATUS" : "INVESTIGATION WINDOW"}</span>
            <div>{!ended && game.status !== "response" ? <><strong>{Math.max(0, getTurnLimit(game) - game.turns.length)}</strong> turns remaining</> : game.status === "response" ? "Contain, assure and recover" : game.status === "won" ? "Response complete" : game.status === "exercise" ? "Exercise concluded" : "Window closed"}</div>
            <Progress value={Math.max(0, (getTurnLimit(game) - game.turns.length) / getTurnLimit(game) * 100)} className="turn-progress" aria-label="Turns remaining" />
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

      <nav className="workspace-tabs" aria-label="Command workspace">
        <button className={activeWorkspace === "command" ? "active" : ""} aria-pressed={activeWorkspace === "command"} onClick={() => setActiveWorkspace("command")}><LayoutDashboard size={18} /><span><strong>Command</strong><small>Situation and decisions</small></span>{(game.pendingDecision || game.pendingCommand || game.pendingSetPiece || game.status === "response") && <b>Action</b>}</button>
        <button className={activeWorkspace === "investigate" ? "active" : ""} aria-pressed={activeWorkspace === "investigate"} onClick={() => setActiveWorkspace("investigate")} disabled={game.status !== "playing"}><Search size={18} /><span><strong>Investigate</strong><small>Map, theory and evidence</small></span><b>{game.evidence.length}</b></button>
        <button className={activeWorkspace === "briefing" ? "active" : ""} aria-pressed={activeWorkspace === "briefing"} onClick={() => setActiveWorkspace("briefing")}><MessagesSquare size={18} /><span><strong>Briefing</strong><small>Captain and incident log</small></span><b>{game.turns.length}</b></button>
      </nav>

      <div className="game-layout workspace-shell">
        <div className="table-area" hidden={activeWorkspace === "briefing"}>
          {activeWorkspace !== "briefing" && tutorial && game.status === "playing" && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece && <TutorialCoach game={game} workspace={activeWorkspace} onNavigate={() => setActiveWorkspace("investigate")} onDismiss={dismissTutorial} />}
          <CommandWorkspace session={session} />
          {activeWorkspace === "investigate" && game.status === "playing" && <InvestigateWorkspace session={session} />}
        </div>

        <BriefingWorkspace session={session} />
      </div>

      <footer className="game-footer"><span>BREACH COMMAND <span className="separator">/</span> SINGLE-PLAYER TABLETOP</span><button onClick={() => setRules(true)}>Rules &amp; attribution <CircleHelp size={14} /></button></footer>
    </main>
  );
}
