import { CircleDot, Crosshair, Network, ShieldAlert } from "lucide-react";
import { attacks, infrastructureTopologies, type Game } from "@/lib/advanced-game";

export function InfrastructureConsole({ game, onFocus }: { game: Game; onFocus: (node: string) => void }) {
  const topology = infrastructureTopologies[game.scenario];
  const activeStage = Math.min(4, game.revealed.length);
  return (
    <section className="infrastructure-console" aria-label="Interactive infrastructure map">
      <div className="map-heading"><div><span className="eyebrow">INFRASTRUCTURE COMMAND MAP</span><h2>{topology.title}</h2></div><span className="focus-instruction"><Crosshair size={14} /> Select the next evidence boundary</span></div>
      <div className="topology-shell">
        <div className="topology-nodes">
          {topology.nodes.map((node, index) => {
            const state = index < activeStage ? "affected" : index === activeStage ? "exposed" : "clear";
            const critical = node.id === topology.critical;
            const findings = game.evidence.filter(item => item.system === node.label).length;
            return <button key={node.id} className={`${state} ${game.focusedNode === node.id ? "focused" : ""}`} onClick={() => onFocus(node.id)} aria-pressed={game.focusedNode === node.id}>
              <span className="node-icon">{critical ? <ShieldAlert size={18} /> : state === "affected" ? <CircleDot size={18} /> : <Network size={18} />}</span>
              <small>{node.type}{critical ? " · CRITICAL" : ""}</small><strong>{node.label}</strong>
              <em>{game.focusedNode === node.id ? "EVIDENCE FOCUS" : findings ? `${findings} FINDING${findings === 1 ? "" : "S"}` : state.toUpperCase()}</em>
            </button>;
          })}
        </div>
        <div className="topology-routes" aria-label="Trust relationships">{topology.edges.map((edge, index) => <div className={index < Math.max(0, activeStage - 1) ? "route-confirmed" : index === Math.max(0, activeStage - 1) ? "route-suspected" : ""} key={`${edge.from}-${edge.to}`}><span>{topology.nodes.find(node => node.id === edge.from)?.label}</span><b>{edge.label}</b><span>{topology.nodes.find(node => node.id === edge.to)?.label}</span><i>{index < Math.max(0, activeStage - 1) ? "CONFIRMED" : index === Math.max(0, activeStage - 1) ? "SUSPECTED" : "UNASSESSED"}</i></div>)}</div>
      </div>
      <p className="map-intel">Confirmed techniques: {game.revealed.length ? game.revealed.map(id => attacks.find(item => item.id === id)?.title).join(" · ") : "none"}. Select the boundary your next action should test. Aligned procedures receive +1.</p>
    </section>
  );
}
