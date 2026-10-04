import { Activity, Database, Gauge, HeartPulse, Network, Radio, ShieldCheck, TriangleAlert, Wifi, Zap } from "lucide-react";
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
  return <section className={`sector-situation ${severity}`} aria-label="Live sector condition">
    <span className="situation-icon">{severity === "stable" ? <ShieldCheck size={21} /> : severity === "degraded" ? <Activity size={21} /> : <TriangleAlert size={21} />}</span>
    <div><span className="eyebrow">Live sector condition · {getOperationalLabel(game)}</span><strong>{title}</strong><p>{detail}</p></div>
    <b>{game.continuity}<small>/100</small></b>
  </section>;
}

const clampReadout = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function SectorOperationalScene({ game }: { game: Game }) {
  if (![1, 2, 7].includes(game.scenario)) return null;

  const configs = {
    1: {
      className: "clinical",
      eyebrow: "CLINICAL SERVICE LANES",
      title: "Patient care continuity",
      detail: "Live service lanes show where investigative pressure can become a care-delivery constraint.",
      Icon: HeartPulse,
      lanes: [
        { label: "Clinical access", value: game.continuity, Icon: HeartPulse },
        { label: "Diagnostic services", value: game.sectorHealth, Icon: Activity },
        { label: "Patient records", value: 100 - game.objectiveProgress, Icon: Database },
      ],
    },
    2: {
      className: "energy",
      eyebrow: "ENGINEERING OPERATING ENVELOPE",
      title: "Generation and control stability",
      detail: "Margins combine plant health, operating continuity and resistance to actor control.",
      Icon: Zap,
      lanes: [
        { label: "Generation margin", value: game.sectorHealth, Icon: Gauge },
        { label: "Control room", value: game.continuity, Icon: Activity },
        { label: "Remote maintenance", value: 100 - game.objectiveProgress, Icon: Zap },
      ],
    },
    7: {
      className: "infocomm",
      eyebrow: "ROUTING DOMAIN PULSE",
      title: "Network service propagation",
      detail: "Domain telemetry reflects routing control, management-plane integrity and subscriber service.",
      Icon: Network,
      lanes: [
        { label: "Core routing", value: 100 - game.objectiveProgress, Icon: Network },
        { label: "Management plane", value: game.sectorHealth, Icon: Wifi },
        { label: "Subscriber service", value: game.continuity, Icon: Radio },
      ],
    },
  } as const;
  const config = configs[game.scenario as 1 | 2 | 7];
  const SceneIcon = config.Icon;

  return <section className={`sector-operational-scene ${config.className}`} aria-label={config.title}>
    <header>
      <span className="sector-scene-icon"><SceneIcon size={22} /></span>
      <div><span className="eyebrow">{config.eyebrow}</span><strong>{config.title}</strong><p>{config.detail}</p></div>
    </header>
    <div className="sector-scene-lanes">
      {config.lanes.map(lane => {
        const value = clampReadout(lane.value);
        const status = value > 75 ? "Stable" : value > 45 ? "Constrained" : "At risk";
        const LaneIcon = lane.Icon;
        return <div className={`sector-scene-lane ${value <= 45 ? "at-risk" : value <= 75 ? "constrained" : "stable"}`} key={lane.label}>
          <span><LaneIcon size={17} /></span>
          <div><strong>{lane.label}</strong><div className="sector-scene-track" aria-hidden="true"><i style={{ width: `${value}%` }} /></div><small>{status}</small></div>
          <b>{value}</b>
        </div>;
      })}
    </div>
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
        : readyToCorrelate(game)
          ? `The evidence picture can support a causal test. Confirm whether ${node.label} belongs in the attack path.`
          : `Focus collection on ${node.label}. ${specialist.voice}`;
  return <section className="specialist-transmission" aria-live="polite">
    <span><Radio size={18} /></span><div><small>{specialist.callsign} · {attribution.confidence === "ATTRIBUTED" ? "ATTRIBUTED" : `${attribution.confidence} ATTRIBUTION`}</small><strong>{specialist.name}</strong><p>{advice}</p></div>
  </section>;
}
