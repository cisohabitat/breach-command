import { getAttributionRead, getOperationalLabel, infrastructureTopologies, readyToCorrelate, type Game } from "@/lib/advanced-game";
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
  return <div className={`log-entry sector-condition ${severity}`}>
    <span className="log-label">Sector condition</span>
    <div className="log-body"><p><strong>{title}.</strong> {detail}</p><small>{getOperationalLabel(game)}</small></div>
    <b className="log-figure">{game.continuity}<small>/100</small></b>
  </div>;
}

const clampReadout = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function SectorOperationalScene({ game }: { game: Game }) {
  if (![1, 2, 7].includes(game.scenario)) return null;

  const configs = {
    1: {
      eyebrow: "Clinical service lanes",
      title: "Patient care continuity",
      detail: "Live service lanes show where investigative pressure can become a care-delivery constraint.",
      lanes: [
        { label: "Clinical access", value: game.continuity },
        { label: "Diagnostic services", value: game.sectorHealth },
        { label: "Patient records", value: 100 - game.objectiveProgress },
      ],
    },
    2: {
      eyebrow: "Engineering operating envelope",
      title: "Generation and control stability",
      detail: "Margins combine plant health, operating continuity and resistance to actor control.",
      lanes: [
        { label: "Generation margin", value: game.sectorHealth },
        { label: "Control room", value: game.continuity },
        { label: "Remote maintenance", value: 100 - game.objectiveProgress },
      ],
    },
    7: {
      eyebrow: "Routing domain pulse",
      title: "Network service propagation",
      detail: "Domain telemetry reflects routing control, management-plane integrity and subscriber service.",
      lanes: [
        { label: "Core routing", value: 100 - game.objectiveProgress },
        { label: "Management plane", value: game.sectorHealth },
        { label: "Subscriber service", value: game.continuity },
      ],
    },
  } as const;
  const config = configs[game.scenario as 1 | 2 | 7];

  // The scene's lanes are entries in the same log, so their figures fall in the
  // column with the margin's and the objective's.
  return <>
    <div className="log-entry">
      <span className="log-label">{config.eyebrow}</span>
      <div className="log-body"><p><strong>{config.title}.</strong> {config.detail}</p></div>
    </div>
    {config.lanes.map(lane => {
      const value = clampReadout(lane.value);
      const status = value > 75 ? "Stable" : value > 45 ? "Constrained" : "At risk";
      return <div className={`log-entry log-lane ${value <= 45 ? "at-risk" : value <= 75 ? "constrained" : "stable"}`} key={lane.label}>
        <span className="log-label">{lane.label}</span>
        <div className="log-body"><div className="sector-scene-track" aria-hidden="true"><i style={{ width: `${value}%` }} /></div><small>{status}</small></div>
        <b className="log-figure">{value}</b>
      </div>;
    })}
  </>;
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
        : readyToCorrelate(game)
          ? `The evidence picture can support a causal test. Confirm whether ${node.label} belongs in the attack path.`
          : `Focus collection on ${node.label}. ${specialist.voice}`;
  return <section className="specialist-transmission" aria-live="polite">
    <div><small>{specialist.callsign} · {attribution.confidence === "ATTRIBUTED" ? "attributed" : `${attribution.confidence.toLowerCase()} attribution`}</small><strong>{specialist.name}</strong><p>{advice}</p></div>
  </section>;
}
