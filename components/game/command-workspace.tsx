import type { CSSProperties } from "react";
import { Activity, ArrowRight, Check, LockKeyhole } from "lucide-react";
import { CommandEvent } from "@/components/game/command-event";
import { EndState } from "@/components/game/end-state";
import { ResponsePanel } from "@/components/game/response-panel";
import { SectorBoard } from "@/components/game/sector-board";
import { SectorSetPiece } from "@/components/game/sector-set-piece";
import { SectorOperationalScene, SectorSituation } from "@/components/game/living-incident";
import { stageIcons } from "@/components/game/stage-icons";
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
      <section className={`attack-section ${game.status === "won" ? "resolved" : ""}`} hidden={activeWorkspace !== "command"}>
        <div className="section-heading"><h2>Attack chain</h2><span className="mono muted">{game.revealed.length} / 4 REVEALED</span></div>
        <div className="attack-grid">
          {stages.map((stage, index) => {
            const attack = attacks.find(item => item.id === game.chain[index])!;
            const revealed = game.revealed.includes(attack.id);
            const Icon = stageIcons[index];
            return (
              <div className={`attack-card ${revealed ? "revealed" : "concealed"}`} key={stage.name} style={{ "--stage-color": stage.color } as CSSProperties}>
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

      <section className="director-live" hidden={activeWorkspace !== "command"}><div><span className="eyebrow">{campaignRoutes[game.campaignRoute].title.toUpperCase()} ROUTE · {game.variant.title.toUpperCase()}</span><strong>{game.variant.briefing}</strong><small>{game.variant.modifier}</small></div><div><span className="eyebrow">ATTRIBUTION · {getAttributionRead(game).confidence}</span><strong>{getAttributionRead(game).title}</strong><small>{getAttributionRead(game).detail}</small></div></section>

      <div hidden={activeWorkspace !== "command"}><SectorBoard game={game} /></div>
      {activeWorkspace === "command" && <SectorSituation game={game} />}
      {activeWorkspace === "command" && <SectorOperationalScene game={game} />}

      {activeWorkspace === "command" && (ended ? (
        <EndState session={session} />
      ) : game.status === "response" ? (
        <ResponsePanel game={game} onChoose={respond} />
      ) : (<>
        <section className="lead-strip"><Activity size={20} /><div><span className="eyebrow">CURRENT INTELLIGENCE</span><p>{getLead(game)}</p></div></section>
        {!tutorial && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece && <section className="command-next-action"><div><span className="eyebrow">NEXT ACTION</span><strong>Build and test a working hypothesis.</strong><p>Open Investigate to select an explanation, focus the relevant infrastructure and run one evidence procedure.</p></div><button onClick={() => setActiveWorkspace("investigate")}>Open Investigate <ArrowRight size={17} /></button></section>}
      </>))}

      {activeWorkspace === "command" && game.status === "playing" && <CommandEvent game={game} onChoose={command} />}

      {activeWorkspace === "command" && game.status === "playing" && <SectorSetPiece game={game} onChoose={sectorDecision} />}
    </>
  );
}
