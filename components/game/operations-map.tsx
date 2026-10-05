import { attacks, getAdversaryState, getOperationalLabel, stages, type Game } from "@/lib/advanced-game";
import { Cloud, Database, Globe2, Network, Server, ShieldAlert, UserRound } from "lucide-react";

const icons = [Globe2, UserRound, Server, Cloud];

export function OperationsMap({ game }: { game: Game }) {
  const activeIndex = Math.min(3, game.revealed.length);
  return (
    <section className="operations-map" aria-label="Live incident operations map">
      <div className="map-heading">
        <div><span className="eyebrow"><Network size={15} /> Live operations map</span><h2>Observed attack path</h2></div>
        <span className={`map-tempo tempo-${game.adversaryTempo}`}><ShieldAlert size={14} /> {getAdversaryState(game)}</span>
      </div>
      <div className="map-path">
        {stages.map((stage, index) => {
          const attack = attacks.find(item => item.id === game.chain[index])!;
          const revealed = game.revealed.includes(attack.id);
          const Icon = icons[index];
          return (
            <div className={`map-step ${revealed ? "confirmed" : index === activeIndex ? "active" : "unknown"}`} key={stage.name} style={{ "--stage-color": stage.color } as React.CSSProperties}>
              <span className="map-node"><Icon size={20} /></span>
              <small>{stage.short}</small>
              <strong>{revealed ? attack.title : index === activeIndex ? "Suspected activity" : "Unmapped"}</strong>
              {index < stages.length - 1 && <span className="map-link" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div className="service-node"><Database size={17} /><span><small>Protected service</small><strong>{getOperationalLabel(game)}</strong></span><b>{game.continuity}</b></div>
    </section>
  );
}
