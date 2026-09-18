import { Activity, Radio, ShieldCheck, TriangleAlert } from "lucide-react";
import { getAttributionRead, getOperationalLabel, infrastructureTopologies, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";

const sectorMoments = [
  ["Payroll window open", "Privileged administration is being watched against a fixed processing deadline."],
  ["Clinical demand rising", "Care teams are balancing safe access with the need to constrain the support path."],
  ["Generation margin stable", "Engineering changes remain inside the operating envelope, but remote trust is uncertain."],
  ["Vessel plan approaching", "The terminal must protect planning integrity before the next operational cut-off."],
  ["Tenant boundary active", "Shared control-plane evidence may change the proportionate isolation boundary."],
  ["Partner cell engaged", "Dependent organisations are waiting for a qualified view of the shared trust path."],
  ["Public demand elevated", "Administrative controls must not unnecessarily interrupt citizen transactions."],
  ["Routing domain unstable", "Network changes can propagate service impact faster than the investigation."],
  ["Manual control available", "Operators can create a safer response window if process conditions remain stable."],
  ["Settlement cut-off nearing", "Approval integrity and service availability are now competing operational priorities."],
] as const;

export function SectorSituation({ game }: { game: Game }) {
  const [title, detail] = sectorMoments[game.scenario];
  const severity = game.continuity <= 45 ? "critical" : game.continuity <= 75 ? "degraded" : "stable";
  return <section className={`sector-situation ${severity}`} aria-label="Live sector condition">
    <span className="situation-icon">{severity === "stable" ? <ShieldCheck size={21} /> : severity === "degraded" ? <Activity size={21} /> : <TriangleAlert size={21} />}</span>
    <div><span className="eyebrow">LIVE SECTOR CONDITION · {getOperationalLabel(game).toUpperCase()}</span><strong>{title}</strong><p>{detail}</p></div>
    <b>{game.continuity}<small>/100</small></b>
  </section>;
}

export function SpecialistTransmission({ game }: { game: Game }) {
  const specialist = namedSpecialists[game.specialist];
  const topology = infrastructureTopologies[game.scenario];
  const node = topology.nodes.find(item => item.id === game.focusedNode) ?? topology.nodes[0];
  const isolated = Object.values(game.nodePosture).filter(value => value === "isolated").length;
  const attribution = getAttributionRead(game);
  const advice = game.pendingSetPiece
    ? "The sector decision is now the critical path. Protect the service without treating uncertainty as safety."
    : game.impact >= 70
      ? `Pressure is critical. Use the next action to reduce actor opportunity around ${node.label}.`
      : isolated
        ? `${isolated} node${isolated === 1 ? " is" : "s are"} isolated. Preserve enough evidence to justify the recovery sequence.`
        : game.evidence.length >= 2
          ? `The evidence picture can support a causal test. Confirm whether ${node.label} belongs in the attack path.`
          : `Focus collection on ${node.label}. ${specialist.voice}`;
  return <section className="specialist-transmission" aria-live="polite">
    <span><Radio size={18} /></span><div><small>{specialist.callsign} · {attribution.confidence} ATTRIBUTION</small><strong>{specialist.name}</strong><p>{advice}</p></div>
  </section>;
}
