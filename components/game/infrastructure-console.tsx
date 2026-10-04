import { ArrowUp, CircleDot, Eye, Network, ShieldAlert, Unplug } from "lucide-react";
import { landOnInvestigation } from "@/hooks/use-recover-focus";
import { attacks, describeMeterChange, procedureById, describeRollShift, getMapActionEffect, infrastructureTopologies, type Game, type MapAction } from "@/lib/advanced-game";

const reachable = (current: number, change: number) => Math.min(100, Math.max(0, current + change)) - current;

// The full cost of a map action, in the same words and directions every other
// meter change uses. Sector margin and actor progress were missing, and the
// sector margin is one of the meters that can end an operation.
function costLine(game: Game, nodeId: string, action: MapAction) {
  const change = getMapActionEffect(game, nodeId, action);
  return [
    "Spend 1 action",
    describeRollShift(game.nextModifier, change.modifier) || null,
    describeMeterChange(game, "impact", reachable(game.impact, change.impact)),
    change.continuity ? describeMeterChange(game, "continuity", reachable(game.continuity, change.continuity)) : null,
    describeMeterChange(game, "sector", reachable(game.sectorHealth, change.sector)),
    describeMeterChange(game, "objective", reachable(game.objectiveProgress, change.objective)),
  ].filter(Boolean).join(" · ");
}

export function InfrastructureConsole({ game, blocked, onFocus, onAction }: { game: Game; blocked?: boolean; onFocus: (node: string) => void; onAction: (node: string, action: MapAction) => void }) {
  const topology = infrastructureTopologies[game.scenario];
  const activeStage = Math.min(4, game.revealed.length);
  const focused = topology.nodes.find(node => node.id === game.focusedNode) ?? topology.nodes[0];
  const posture = game.nodePosture[focused.id] ?? "normal";
  const criticalFocus = focused.id === topology.critical;
  return (
    <section className="infrastructure-console" aria-label="Interactive infrastructure map" tabIndex={-1}>
      <div className="map-heading"><div><span className="eyebrow">Live infrastructure command</span><h2>{topology.title}</h2></div><span className="focus-instruction">{game.mapActionsRemaining} map action{game.mapActionsRemaining === 1 ? "" : "s"} left</span></div>
      <div className="incident-flow" aria-hidden="true"><span style={{ width: `${Math.max(8, activeStage / 4 * 100)}%` }} /></div>
      <div className="topology-shell">
        <div className="topology-nodes">
          {topology.nodes.map((node, index) => {
            const nodePosture = game.nodePosture[node.id] ?? "normal";
            const state = nodePosture === "isolated" ? "isolated" : nodePosture === "restored" ? "restored" : index < activeStage ? "affected" : index === activeStage ? "exposed" : "clear";
            const critical = node.id === topology.critical;
            const findings = game.evidence.filter(item => item.system === node.label).length;
            return <button key={node.id} className={`${state} ${nodePosture} ${game.focusedNode === node.id ? "focused" : ""}`} disabled={blocked} onClick={() => onFocus(node.id)} aria-pressed={game.focusedNode === node.id}>
              <span className="node-icon">{nodePosture === "isolated" ? <Unplug size={18} /> : nodePosture === "monitored" ? <Eye size={18} /> : critical ? <ShieldAlert size={18} /> : state === "affected" ? <CircleDot size={18} /> : <Network size={18} />}</span>
              <small>{node.type}{critical ? " · CRITICAL" : ""}</small><strong>{node.label}</strong>
              {/* Selecting a node no longer hides its state: "SELECTED" in place of
                  "AFFECTED" took the warning away from the node it was about. */}
              <em>{game.focusedNode === node.id ? "SELECTED · " : ""}{nodePosture === "isolated" ? "ISOLATED" : nodePosture === "monitored" ? "MONITORED" : nodePosture === "restored" ? "RESTORED" : findings ? `${findings} COLLECTED HERE` : state.toUpperCase()}</em>
            </button>;
          })}
        </div>
        <details className="topology-detail">
          <summary>Trust relationships<span>{topology.edges.length} paths · {topology.edges.filter(edge => game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated").length} blocked</span></summary>
          <div className="topology-routes" role="group" aria-label="Trust relationships">{topology.edges.map((edge, index) => {
          const isolated = game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated";
          return <div className={isolated ? "route-blocked" : index < Math.max(0, activeStage - 1) ? "route-confirmed" : index === Math.max(0, activeStage - 1) ? "route-suspected" : ""} key={`${edge.from}-${edge.to}`}>
            <span className="route-source">{topology.nodes.find(node => node.id === edge.from)?.label}</span>
            <b className="route-relation">{edge.label}</b>
            <span className="route-target">{topology.nodes.find(node => node.id === edge.to)?.label}</span>
            <i className="route-status">{isolated ? "BLOCKED" : index < Math.max(0, activeStage - 1) ? "CONFIRMED" : index === Math.max(0, activeStage - 1) ? "SUSPECTED" : "UNASSESSED"}</i>
          </div>;
        })}</div>
        </details>
      </div>
      <div className="map-command-bar">
        <div><span><small>SELECTED NODE</small><strong>{focused.label}</strong><em>{criticalFocus ? "CRITICAL DEPENDENCY · " : ""}{posture === "normal" ? "No active control" : posture}</em>{/* Map focus applies only to the sources that examine the selected system, so a
            roll showed it on some cards and not others with no word as to why. */}<small className="focus-sources">Map focus +1 for {focused.procedures.map(id => procedureById(game, id)?.title ?? id).join(" · ")}</small></span></div>
        <button disabled={blocked || game.mapActionsRemaining === 0 || posture === "monitored" || posture === "isolated"} onClick={() => onAction(focused.id, "monitor")}><Eye size={16} /><span><strong>Monitor</strong><small>{posture === "monitored" ? (game.nextModifierSource?.includes(`Monitored ${focused.label}`) ? "Monitored: its bonus is waiting for your next roll" : "Already monitored: its bonus went to the roll after it was set") : posture === "isolated" ? "Isolated: nothing left to monitor here" : costLine(game, focused.id, "monitor")}</small></span></button>
        <button disabled={blocked || game.mapActionsRemaining === 0 || posture === "isolated"} onClick={() => onAction(focused.id, "isolate")}><Unplug size={16} /><span><strong>Isolate</strong><small>{posture === "isolated" ? "Already isolated" : costLine(game, focused.id, "isolate")}</small></span></button>
      </div>
      {!!game.mapHistory.length && <button className="compare-findings back-to-procedures" onClick={() => landOnInvestigation(true)}>Back to the procedures <ArrowUp size={14} /></button>}
      <details className="map-intel-detail">
        <summary>Dependency and control notes<span>{game.revealed.length ? `${game.revealed.length} technique${game.revealed.length === 1 ? "" : "s"} confirmed` : "no techniques confirmed"}</span></summary>
        <p className="map-intel">Critical dependency: {topology.criticalRule} Confirmed techniques: {game.revealed.length ? game.revealed.map(id => attacks.find(item => item.id === id)?.title).join(" · ") : "none"}. Map actions are optional, limited and immediate. Monitoring improves the next procedure; isolation reduces actor opportunity but removes service capacity until recovery.</p>
      </details>
    </section>
  );
}
