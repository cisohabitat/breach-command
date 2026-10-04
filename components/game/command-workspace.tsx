import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { CommandEvent } from "@/components/game/command-event";
import { EndState } from "@/components/game/end-state";
import { ResponsePanel } from "@/components/game/response-panel";
import { SectorBoard } from "@/components/game/sector-board";
import { SectorSetPiece } from "@/components/game/sector-set-piece";
import { SectorOperationalScene, SectorSituation } from "@/components/game/living-incident";
import { attacks, getAttributionRead, getLead, stages } from "@/lib/advanced-game";
import { campaignRoutes } from "@/lib/phase9";
import type { GameSession } from "@/hooks/use-game-session";

export function CommandWorkspace({ session }: { session: GameSession }) {
  const {
    game, activeWorkspace, ended, tutorial,
    setActiveWorkspace, respond, command, sectorDecision,
  } = session;

  if (!game) return null;

  return (
    <>
      {/* What needs the player leads Command: a pending decision, the response
          sequence, the ending, or otherwise the current intelligence and the next
          move. The situation picture follows. Below it, on a phone, a decision
          sat two screens down with nothing on screen saying one was waiting. */}
      {activeWorkspace === "command" && game.status === "playing" && <CommandEvent game={game} onChoose={command} />}
      {activeWorkspace === "command" && game.status === "playing" && <SectorSetPiece game={game} onChoose={sectorDecision} />}
      {activeWorkspace === "command" && (ended ? (
        <EndState session={session} />
      ) : game.status === "response" ? (
        <ResponsePanel game={game} onChoose={respond} />
      ) : (<>
        <section className="lead-strip"><div><span className="eyebrow">Current intelligence</span><p>{getLead(game)}</p></div></section>
        {!tutorial && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece && <section className="command-next-action"><div><span className="eyebrow">Next action</span><strong>Build and test a working hypothesis.</strong><p>Open Investigate to select an explanation, focus the relevant infrastructure and run one evidence procedure.</p></div><button onClick={() => setActiveWorkspace("investigate")}>Open Investigate <ArrowRight size={17} /></button></section>}
      </>))}

      <section className={`attack-section ${game.status === "won" ? "resolved" : ""}`} hidden={activeWorkspace !== "command"}>
        <div className="section-heading"><h2>Attack chain</h2><span className="mono muted">{game.revealed.length} / 4 REVEALED</span></div>
        {/* The chain as an evidence sheet: what is confirmed is typed in, what is
            not is redacted. Four equal cards with coloured tops and a centred icon
            read as a feature grid. */}
        <ol className="chain-sheet">
          {stages.map((stage, index) => {
            const attack = attacks.find(item => item.id === game.chain[index])!;
            const revealed = game.revealed.includes(attack.id);
            return (
              <li className={revealed ? "confirmed" : "pending"} key={stage.name} style={{ "--stage-color": stage.color, "--redaction": `${[72, 58, 80, 64][index]}%` } as CSSProperties}>
                <span className="chain-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="chain-stage">{stage.name}</span>
                {revealed ? <strong className="chain-technique">{attack.title}</strong> : <span className="chain-redacted"><span className="sr-only">Unknown technique</span></span>}
                <span className="chain-status">{revealed ? "Confirmed" : "Awaiting evidence"}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="director-live" hidden={activeWorkspace !== "command"}><div><span className="eyebrow">{campaignRoutes[game.campaignRoute].title} route · {game.variant.title}</span><strong>{game.variant.briefing}</strong><small>{game.variant.modifier}</small></div><div><span className="eyebrow">ATTRIBUTION · {getAttributionRead(game).confidence}</span><strong>{getAttributionRead(game).title}</strong><small>{getAttributionRead(game).detail}</small></div></section>

      <div hidden={activeWorkspace !== "command"}><SectorBoard game={game} /></div>
      {activeWorkspace === "command" && <SectorSituation game={game} />}
      {activeWorkspace === "command" && <SectorOperationalScene game={game} />}
    </>
  );
}
