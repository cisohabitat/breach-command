import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { CommandEvent } from "@/components/game/command-event";
import { EndState } from "@/components/game/end-state";
import { ResponsePanel } from "@/components/game/response-panel";
import { SectorBoard } from "@/components/game/sector-board";
import { SectorSetPiece } from "@/components/game/sector-set-piece";
import { SectorOperationalScene, SectorSituation } from "@/components/game/living-incident";
import { attacks, getLead, stages } from "@/lib/advanced-game";
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
        {/* What needs the player is an entry in the log like the rest, the order
            marked by its rule and its link in the text. A boxed "Next action" with
            a button on the right was the stock empty-state call to action. */}
        <section className="situation-log lead-log" aria-label="Current intelligence">
          <div className="sit-entry"><span className="sit-label">Current intelligence</span><div className="sit-body"><p className="sit-lead">{getLead(game)}</p></div></div>
          {!tutorial && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece && <div className="sit-entry sit-order"><span className="sit-label">Next action</span><div className="sit-body"><p><strong>Build and test a working hypothesis.</strong> Select an explanation, focus the relevant infrastructure and run one evidence procedure.</p><button className="sit-link" onClick={() => setActiveWorkspace("investigate")}>Open Investigate <ArrowRight size={15} /></button></div></div>}
        </section>
      </>))}

      <section className={`attack-section ${game.status === "won" ? "resolved" : ""}`} hidden={activeWorkspace !== "command"}>
        <div className="section-heading"><h2>Attack chain</h2><span className="muted">{game.revealed.length} of 4 revealed</span></div>
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

      <section className="situation-log" hidden={activeWorkspace !== "command"} aria-labelledby="situation-heading">
        <div className="section-heading"><h2 id="situation-heading">Situation</h2></div>
        <div className="sit-entry compact">
          <span className="sit-label">Campaign route<small>{campaignRoutes[game.campaignRoute].title}</small></span>
          <div className="sit-body"><p><strong>{game.variant.title}.</strong> {game.variant.briefing}</p><small>{game.variant.modifier}</small></div>
        </div>
        <SectorBoard game={game} />
        {activeWorkspace === "command" && <SectorSituation game={game} />}
        {activeWorkspace === "command" && <SectorOperationalScene game={game} />}
      </section>
    </>
  );
}
