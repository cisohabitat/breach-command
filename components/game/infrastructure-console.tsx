import { ArrowUp } from "lucide-react";
import { landOnInvestigation } from "@/hooks/use-recover-focus";
import { attacks, words, procedureById, getMapActionEffect, infrastructureTopologies, type Game, type MapAction, meterEffect, rollEffect } from "@/lib/advanced-game";
import { EffectList } from "@/components/game/effect-list";
import { useMessages, type Translate } from "@/hooks/use-messages";
import { infrastructureConsoleMessages } from "@/lib/i18n/en/infrastructure-console";
import { register } from "@/lib/i18n";
import { legacyText, msg, sameMessage } from "@/lib/i18n/message";

register(infrastructureConsoleMessages);

const reachable = (current: number, change: number) => Math.min(100, Math.max(0, current + change)) - current;

// The full cost of a map action, in the same words and directions every other
// meter change uses. Sector margin and actor progress were missing, and the
// sector margin is one of the meters that can end an operation.
function costLine(t: Translate, game: Game, nodeId: string, action: MapAction) {
  const change = getMapActionEffect(game, nodeId, action);
  return [
    t("infrastructureConsole.spend1Action"),
    rollEffect(game.nextModifier, change.modifier),
    meterEffect(game, "impact", reachable(game.impact, change.impact)),
    change.continuity ? meterEffect(game, "continuity", reachable(game.continuity, change.continuity)) : null,
    meterEffect(game, "sector", reachable(game.sectorHealth, change.sector)),
    meterEffect(game, "objective", reachable(game.objectiveProgress, change.objective)),
  ];
}

export function InfrastructureConsole({ game, blocked, onFocus, onAction }: { game: Game; blocked?: boolean; onFocus: (node: string) => void; onAction: (node: string, action: MapAction) => void }) {
  const { t, rich } = useMessages();
  const topology = infrastructureTopologies[game.scenario];
  const activeStage = Math.min(4, game.revealed.length);
  const focused = topology.nodes.find(node => node.id === game.focusedNode) ?? topology.nodes[0];
  const posture = game.nodePosture[focused.id] ?? "normal";
  const criticalFocus = focused.id === topology.critical;
  return (
    <section className="infrastructure-console" aria-label={t("infrastructureConsole.interactiveInfrastructureMap")} tabIndex={-1}>
      <div className="map-heading"><div><h2>{topology.title}</h2></div><span className="focus-instruction">{t("infrastructureConsole.mapAction2Plural", { count: game.mapActionsRemaining })}{t("infrastructureConsole.left")}</span></div>
      <div className="incident-flow" aria-hidden="true"><span style={{ width: `${Math.max(8, activeStage / 4 * 100)}%` }} /></div>
      <div className="topology-shell">
        <div className="topology-nodes">
          {topology.nodes.map((node, index) => {
            const nodePosture = game.nodePosture[node.id] ?? "normal";
            const state = nodePosture === "isolated" ? "isolated" : nodePosture === "restored" ? "restored" : index < activeStage ? "affected" : index === activeStage ? "exposed" : "clear";
            const critical = node.id === topology.critical;
            const findings = game.evidence.filter(item => sameMessage(item.system, words.node(game.scenario, node.id)) || legacyText(item.system) === node.label).length;
            return <button key={node.id} className={`${state} ${nodePosture} ${game.focusedNode === node.id ? "focused" : ""}`} disabled={blocked} onClick={() => onFocus(node.id)} aria-pressed={game.focusedNode === node.id}>
              <small>{node.type.charAt(0) + node.type.slice(1).toLowerCase()}{critical ? ", critical" : ""}</small><strong>{node.label}</strong>
              {/* Selecting a node no longer hides its state: "SELECTED" in place of
                  "AFFECTED" took the warning away from the node it was about. */}
              <em>{game.focusedNode === node.id ? t("infrastructureConsole.selected") : ""}{nodePosture === "isolated" ? "isolated" : nodePosture === "monitored" ? "monitored" : nodePosture === "restored" ? "restored" : findings ? t("infrastructureConsole.collectedHere", { findings }) : state}</em>
            </button>;
          })}
        </div>
        <details className="topology-detail">
          <summary>{rich("infrastructureConsole.trustRelationshipsSpan", { edges: topology.edges.length, count: topology.edges.filter(edge => game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated").length }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="topology-routes" role="group" aria-label={t("infrastructureConsole.trustRelationships")}>{topology.edges.map((edge, index) => {
          const isolated = game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated";
          return <div className={isolated ? "route-blocked" : index < Math.max(0, activeStage - 1) ? "route-confirmed" : index === Math.max(0, activeStage - 1) ? "route-suspected" : ""} key={`${edge.from}-${edge.to}`}>
            <span className="route-source">{topology.nodes.find(node => node.id === edge.from)?.label}</span>
            <b className="route-relation">{edge.label.toLowerCase()}</b>
            <span className="route-target">{topology.nodes.find(node => node.id === edge.to)?.label}</span>
            <i className="route-status">{isolated ? t("infrastructureConsole.blocked2") : index < Math.max(0, activeStage - 1) ? t("infrastructureConsole.confirmed") : index === Math.max(0, activeStage - 1) ? t("infrastructureConsole.suspected") : t("infrastructureConsole.unassessed")}</i>
          </div>;
        })}</div>
        </details>
      </div>
      <div className="map-command-bar">
        <div><span><small>{t("infrastructureConsole.selectedNode")}</small><strong>{focused.label}</strong><em>{criticalFocus ? t("infrastructureConsole.criticalDependency2") : ""}{posture === "normal" ? t("infrastructureConsole.noActiveControl") : posture}</em>{/* Map focus applies only to the sources that examine the selected system, so a
            roll showed it on some cards and not others with no word as to why. */}<small className="focus-sources">{t("infrastructureConsole.mapFocusAdds1")}{focused.procedures.map(id => procedureById(game, id)?.title ?? id).join(", ").replace(/, ([^,]*)$/, " and $1")}.</small></span></div>
        <button disabled={blocked || game.mapActionsRemaining === 0 || posture === "monitored" || posture === "isolated"} onClick={() => onAction(focused.id, "monitor")}><span><strong>{t("infrastructureConsole.monitor")}</strong><small>{posture === "monitored" ? (game.nextModifierSources.some(item => sameMessage(item.source, msg("engine.source.monitored", { node: words.node(game.scenario, focused.id) })) || !!legacyText(item.source)?.includes(`Monitored ${focused.label}`)) ? t("infrastructureConsole.monitoredItsBonus") : t("infrastructureConsole.alreadyMonitoredIts")) : posture === "isolated" ? t("infrastructureConsole.isolatedNothingLeft") : <EffectList className="map-cost" items={costLine(t, game, focused.id, "monitor")} />}</small></span></button>
        <button disabled={blocked || game.mapActionsRemaining === 0 || posture === "isolated"} onClick={() => onAction(focused.id, "isolate")}><span><strong>{t("infrastructureConsole.isolate")}</strong><small>{posture === "isolated" ? t("infrastructureConsole.alreadyIsolated") : <EffectList className="map-cost" items={costLine(t, game, focused.id, "isolate")} />}</small></span></button>
      </div>
      {!!game.mapHistory.length && <button className="compare-findings back-to-procedures" onClick={() => landOnInvestigation(true)}>{t("evidenceWorkspace.backToThe")}<ArrowUp size={14} /></button>}
      <details className="map-intel-detail">
        <summary>{t("infrastructureConsole.dependencyAndControl")}<span>{game.revealed.length ? t("infrastructureConsole.techniquesConfirmed", { count: game.revealed.length }) : t("infrastructureConsole.noTechniquesConfirmed")}</span></summary>
        <p className="map-intel">{t("infrastructureConsole.criticalDependencyConfirmed", { criticalRule: topology.criticalRule })}{game.revealed.length ? game.revealed.map(id => attacks.find(item => item.id === id)?.title).join(", ") : t("infrastructureConsole.none")}{t("infrastructureConsole.mapActionsAre")}</p>
      </details>
    </section>
  );
}
