import { ArrowUp, Circle, Eye, ShieldOff, CircleCheck } from "lucide-react";
import { landOnInvestigation } from "@/hooks/use-recover-focus";
import { attacks, words, procedureById, getMapActionEffect, infrastructureTopologies, type Game, type MapAction, meterEffect, rollEffect } from "@/lib/advanced-game";
import { EffectList } from "@/components/game/effect-list";
import { useMessages, type Translate } from "@/hooks/use-messages";
import { infrastructureConsoleMessages } from "@/lib/i18n/en/infrastructure-console";
import { register, type MessageKey } from "@/lib/i18n";
import { legacyText, lit, msg, sameMessage } from "@/lib/i18n/message";

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


// A node's kind and its state on the map, as words: the topology keys on the
// codes, and the catalogue says them.
const nodeTypes: Record<string, MessageKey> = { APPLICATION: "infrastructureConsole.typeApplication", ASSET: "infrastructureConsole.typeAsset", CONTROL: "infrastructureConsole.typeControl", EDGE: "infrastructureConsole.typeEdge", EXTERNAL: "infrastructureConsole.typeExternal", IDENTITY: "infrastructureConsole.typeIdentity" };
const nodeStates: Record<string, MessageKey> = { isolated: "infrastructureConsole.stateIsolated", monitored: "infrastructureConsole.stateMonitored", restored: "infrastructureConsole.stateRestored", normal: "infrastructureConsole.unassessed" };
const postureIcons = { normal: Circle, monitored: Eye, isolated: ShieldOff, restored: CircleCheck };
export function InfrastructureConsole({ game, blocked, highlightedNode, onFocus, onAction }: { game: Game; blocked?: boolean; highlightedNode?: string | null; onFocus: (node: string) => void; onAction: (node: string, action: MapAction) => void }) {
  const { t, rich, say } = useMessages("infrastructureConsole");
  const topology = infrastructureTopologies[game.scenario];
  const activeStage = Math.min(4, game.revealed.length);
  const focused = topology.nodes.find(node => node.id === game.focusedNode) ?? topology.nodes[0];
  const posture = game.nodePosture[focused.id] ?? "normal";
  const criticalFocus = focused.id === topology.critical;
  return (
    <section id="infrastructure-map" className="infrastructure-console" aria-label={t("interactiveInfrastructureMap")} tabIndex={-1}>
      <div className="map-heading section-heading"><h2>{topology.title}</h2><span className="focus-instruction">{t("mapAction2Plural", { count: game.mapActionsRemaining })}{t("left")}</span></div>
      <div className="incident-flow" aria-hidden="true"><span style={{ width: `${Math.max(8, activeStage / 4 * 100)}%` }} /></div>
      <div className="topology-shell">
        <div className="topology-nodes">
          {topology.nodes.map(node => {
            const nodePosture = game.nodePosture[node.id] ?? "normal";
            const PostureIcon = postureIcons[nodePosture];
            const critical = node.id === topology.critical;
            const findings = game.evidence.filter(item => sameMessage(item.system, words.node(game.scenario, node.id)) || legacyText(item.system) === node.label).length;
            return <button key={node.id} id={`infrastructure-node-${node.id}`} className={`${nodePosture} ${game.focusedNode === node.id ? "focused" : ""} ${highlightedNode === node.id ? "finding-location" : ""}`} disabled={blocked} onClick={() => onFocus(node.id)} aria-pressed={game.focusedNode === node.id}>
              <small>{nodeTypes[node.type] ? t(nodeTypes[node.type]) : node.type}{critical ? t("critical") : ""}</small><strong>{node.label}</strong>
              {/* Collection focus is not proof that a system is compromised. */}
              <em><PostureIcon size={16} aria-hidden="true" /><span>{game.focusedNode === node.id ? t("selected") : ""}{t(nodeStates[nodePosture])}{findings > 0 && <span className="node-findings" role={highlightedNode === node.id ? "status" : undefined}>{highlightedNode === node.id ? t("findingLocation") : t("collectedHere", { findings })}</span>}</span></em>
            </button>;
          })}
        </div>
        <details className="topology-detail">
          <summary>{rich("trustRelationshipsSpan", { edges: topology.edges.length, count: topology.edges.filter(edge => game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated").length }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="topology-routes" role="group" aria-label={t("trustRelationships")}>{topology.edges.map(edge => {
          const isolated = game.nodePosture[edge.from] === "isolated" || game.nodePosture[edge.to] === "isolated";
          return <div className={isolated ? "route-blocked" : ""} key={`${edge.from}-${edge.to}`}>
            <span className="route-source">{topology.nodes.find(node => node.id === edge.from)?.label}</span>
            <b className="route-relation">{say(lit(edge.label, "lower"))}</b>
            <span className="route-target">{topology.nodes.find(node => node.id === edge.to)?.label}</span>
            <i className="route-status">{isolated ? <ShieldOff size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}{isolated ? t("blocked2") : t("unassessed")}</i>
          </div>;
        })}</div>
        </details>
      </div>
      <div className="map-command-bar">
        <div><span><small>{t("selectedNode")}</small><strong>{focused.label}</strong><em>{criticalFocus ? t("criticalDependency2") : ""}{posture === "normal" ? t("noActiveControl") : t(nodeStates[posture])}</em>{/* Map focus applies only to the sources that examine the selected system, so a
            roll showed it on some cards and not others with no word as to why. */}<small className="focus-sources">{t("mapFocusAdds1")}{focused.procedures.map(id => procedureById(game, id)?.title ?? id).join(", ").replace(/, ([^,]*)$/, " and $1")}.</small></span></div>
        <button disabled={blocked || game.mapActionsRemaining === 0 || posture === "monitored" || posture === "isolated"} onClick={() => onAction(focused.id, "monitor")}><span><strong>{t("monitor")}</strong><small>{posture === "monitored" ? (game.nextModifierSources.some(item => sameMessage(item.source, msg("engine.source.monitored", { node: words.node(game.scenario, focused.id) })) || !!legacyText(item.source)?.includes(`Monitored ${focused.label}`)) ? t("monitoredItsBonus") : t("alreadyMonitoredIts")) : posture === "isolated" ? t("isolatedNothingLeft") : <EffectList className="map-cost" items={costLine(t, game, focused.id, "monitor")} />}</small></span></button>
        <button disabled={blocked || game.mapActionsRemaining === 0 || posture === "isolated"} onClick={() => onAction(focused.id, "isolate")}><span><strong>{t("isolate")}</strong><small>{posture === "isolated" ? t("alreadyIsolated") : <EffectList className="map-cost" items={costLine(t, game, focused.id, "isolate")} />}</small></span></button>
      </div>
      {!!game.mapHistory.length && <button className="compare-findings back-to-procedures" onClick={() => landOnInvestigation(true)}>{t("evidenceWorkspace.backToThe")}<ArrowUp size={14} /></button>}
      <details className="map-intel-detail">
        <summary>{t("dependencyAndControl")}<span>{game.revealed.length ? t("techniquesConfirmed", { count: game.revealed.length }) : t("noTechniquesConfirmed")}</span></summary>
        <dl className="map-intel">
          <div><dt>{t("dependencyHeading")}</dt><dd>{topology.criticalRule}</dd></div>
          <div><dt>{t("confirmedHeading")}</dt><dd>{game.revealed.length ? game.revealed.map(id => attacks.find(item => item.id === id)?.title).join(", ") : t("none")}</dd></div>
          <div><dt>{t("controlsHeading")}</dt><dd>{t("mapActionsAre")}</dd></div>
        </dl>
      </details>
    </section>
  );
}
