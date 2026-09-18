import { Activity, CircleDot, Crosshair, Eye, Network, ShieldAlert, Unplug } from "lucide-react";
import { attacks, infrastructureTopologies, type Game, type MapAction } from "@/lib/advanced-game";

export function InfrastructureConsole({ game, onFocus, onAction }: { game: Game; onFocus: (node: string) => void; onAction: (node: string, action: MapAction) => void }) {
  const topology = infrastructureTopologies[game.scenario];
  const activeStage = Math.min(4, game.revealed.length);
  const focused = topology.nodes.find(node => node.id === game.focusedNode) ?? topology.nodes[0];
  const posture = game.nodePosture[focused.id] ?? "normal";
  return (
    <section className="infrastructure-console" aria-label="Interactive infrastructure map">
      <div className="map-heading"><div><span className="eyebrow">LIVE INFRASTRUCTURE COMMAND</span><h2>{topology.title}</h2></div><span className="focus-instruction"><Activity size={14} /> {game.mapActionsRemaining} command actions</span></div>
      <div className="incident-flow" aria-hidden="true"><span style={{ width: `${Math.max(8, activeStage / 4 * 100)}%` }} /></div>
      <div className="topology-shell">
        <div className="topology-nodes">
          {topology.nodes.map((node, index) => {
            const nodePosture = game.nodePosture[node.id] ?? "normal";
            const state = nodePosture === "isolated" ? "isolated" : nodePosture === "restored" ? "restored" : index < activeStage ? "affected" : index === activeStage ? "exposed" : "clear";
            const critical = node.id === topology.critical;
            const findings = game.evidence.filter(item => item.system === node.label).length;
            return <button key={node.id} className={`${state} ${nodePosture} ${game.focusedNode === node.id ? "focused" : ""}`} onClick={() => onFocus(node.id)} aria-pressed={game.focusedNode === node.id}>
              <span className="node-icon">{nodePosture === "isolated" ? <Unplug size={18} /> : nodePosture === "monitored" ? <Eye size={18} /> : critical ? <ShieldAlert size={18} /> : state === "affected" ? <CircleDot size={18} /> : <Network size={18} />}</span>
              <small>{node.type}{critical ? " · CRITICAL" : ""}</small><strong>{node.label}</strong>
              <em>{nodePosture === "isolated" ? "ISOLATED" : nodePosture === "monitored" ? "MONITORED" : nodePosture === "restored" ? "RESTORED" : game.focusedNode === node.id ? "SELECTED" : findings ? `${findings} FINDING${findings === 1 ? "" : "S"}` : state.toUpperCase()}</em>
            </button>;
          })}
        </div>
        <div className="topology-routes" aria-label="Trust relationships">{topology.edges.map((edge, index) => {
          const isolated = game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated";
          return <div className={isolated ? "route-blocked" : index < Math.max(0, activeStage - 1) ? "route-confirmed" : index === Math.max(0, activeStage - 1) ? "route-suspected" : ""} key={`${edge.from}-${edge.to}`}><span>{topology.nodes.find(node => node.id === edge.from)?.label}</span><b>{edge.label}</b><span>{topology.nodes.find(node => node.id === edge.to)?.label}</span><i>{isolated ? "BLOCKED" : index < Math.max(0, activeStage - 1) ? "CONFIRMED" : index === Math.max(0, activeStage - 1) ? "SUSPECTED" : "UNASSESSED"}</i></div>;
        })}</div>
      </div>
      <div className="map-command-bar">
        <div><Crosshair size={17} /><span><small>SELECTED NODE</small><strong>{focused.label}</strong><em>{posture === "normal" ? "No active control" : posture}</em></span></div>
        <button disabled={game.mapActionsRemaining === 0 || posture === "monitored" || posture === "isolated"} onClick={() => onAction(focused.id, "monitor")}><Eye size={16} /><span><strong>Monitor</strong><small>Improve evidence quality</small></span></button>
        <button disabled={game.mapActionsRemaining === 0 || posture === "isolated"} onClick={() => onAction(focused.id, "isolate")}><Unplug size={16} /><span><strong>Isolate</strong><small>Reduce risk, disrupt service</small></span></button>
      </div>
      <p className="map-intel">Confirmed techniques: {game.revealed.length ? game.revealed.map(id => attacks.find(item => item.id === id)?.title).join(" · ") : "none"}. Actions are scarce and their service consequences carry into recovery.</p>
    </section>
  );
}
