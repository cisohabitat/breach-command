import { getAttributionRead, getOperationalLabel, infrastructureTopologies, readyToCorrelate, scenarios, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { useMessages } from "@/hooks/use-messages";
import { level, withForm } from "@/lib/i18n/message";
import { livingIncidentMessages } from "@/lib/i18n/en/living-incident";
import { register } from "@/lib/i18n";

register(livingIncidentMessages);

const sectorMoments = [
  ["livingIncident.payrollWindowOpen", "livingIncident.privilegedAdministrationIs"],
  ["livingIncident.clinicalDemandRising", "livingIncident.careTeamsAre"],
  ["livingIncident.generationMarginStable", "livingIncident.engineeringChangesRemain"],
  ["livingIncident.vesselPlanApproaching", "livingIncident.theTerminalMust"],
  ["livingIncident.tenantBoundaryActive", "livingIncident.sharedControlPlane"],
  ["livingIncident.partnerCellEngaged", "livingIncident.dependentOrganisationsAre"],
  ["livingIncident.publicDemandElevated", "livingIncident.administrativeControlsMust"],
  ["livingIncident.routingDomainUnstable", "livingIncident.networkChangesCan"],
  ["livingIncident.manualControlAvailable", "livingIncident.operatorsCanCreate"],
  ["livingIncident.settlementCutOff", "livingIncident.approvalIntegrityAnd"],
] as const;

export function SectorSituation({ game }: { game: Game }) {
  const { t } = useMessages("livingIncident");
  const [title, detail] = sectorMoments[game.scenario];
  const severity = game.continuity <= 45 ? "critical" : game.continuity <= 75 ? "degraded" : "stable";
  return <div className={`sit-entry sector-condition ${severity}`}>
    <span className="sit-label">{t("fieldGuideDialog.sectorCondition")}</span>
    {/* The figure is the continuity readout's, already in the top row; here the
        condition is said in words. */}
    <div className="sit-body"><p><strong>{t(title)}.</strong> {game.revealed.length >= 2 ? scenarios[game.scenario].constraints : t(detail)}</p><small>{t("is", { getOperationalLabel: getOperationalLabel(game) })}{severity === "critical" ? t("atRisk") : severity === "degraded" ? t("degraded") : t("stable2")}.</small></div>
  </div>;
}

const clampReadout = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function SectorOperationalScene({ game }: { game: Game }) {
  const { t } = useMessages("livingIncident");
  if (![1, 2, 7].includes(game.scenario)) return null;

  const configs = {
    1: {
      eyebrow: t("clinicalServiceLanes"),
      title: t("patientCareContinuity"),
      detail: t("liveServiceLanes"),
      lanes: [
        { label: t("clinicalAccess"), value: game.continuity },
        { label: t("diagnosticServices"), value: game.sectorHealth },
        { label: t("patientRecords"), value: 100 - game.objectiveProgress },
      ],
    },
    2: {
      eyebrow: t("engineeringOperatingEnvelope"),
      title: t("generationAndControl"),
      detail: t("marginsCombinePlant"),
      lanes: [
        { label: t("generationMargin"), value: game.sectorHealth },
        { label: t("controlRoom"), value: game.continuity },
        { label: t("remoteMaintenance"), value: 100 - game.objectiveProgress },
      ],
    },
    7: {
      eyebrow: t("routingDomainPulse"),
      title: t("networkServicePropagation"),
      detail: t("domainTelemetryReflects"),
      lanes: [
        { label: t("coreRouting"), value: 100 - game.objectiveProgress },
        { label: t("managementPlane"), value: game.sectorHealth },
        { label: t("subscriberService"), value: game.continuity },
      ],
    },
  } as const;
  const config = configs[game.scenario as 1 | 2 | 7];

  // The scene's lanes are entries in the same log, so their figures fall in the
  // column with the margin's and the objective's.
  return <>
    <div className="sit-entry">
      <span className="sit-label">{config.eyebrow}</span>
      <div className="sit-body"><p><strong>{config.title}.</strong> {config.detail}</p></div>
    </div>
    {config.lanes.map(lane => {
      const value = clampReadout(lane.value);
      const status = value > 75 ? t("stable") : value > 45 ? t("constrained") : t("atRisk2");
      return <div className={`sit-entry sit-lane ${value <= 45 ? "at-risk" : value <= 75 ? "constrained" : "stable"}`} key={lane.label}>
        <span className="sit-label">{lane.label}</span>
        <div className="sit-body"><div className="sector-scene-track" aria-hidden="true"><i style={{ width: `${value}%` }} /></div><small>{status}</small></div>
        <b className="sit-figure">{value}</b>
      </div>;
    })}
  </>;
}

export function SpecialistTransmission({ game }: { game: Game }) {
  const { t, say } = useMessages("livingIncident");
  const specialist = namedSpecialists[game.specialist];
  const topology = infrastructureTopologies[game.scenario];
  const node = topology.nodes.find(item => item.id === game.focusedNode) ?? topology.nodes[0];
  const isolated = Object.values(game.nodePosture).filter(value => value === "isolated").length;
  const attribution = getAttributionRead(game);
  const advice = game.pendingSetPiece
    ? t("theSectorDecision")
    : game.impact >= 70
      ? t("pressureIsCritical", { nodeLabel: node.label })
      : isolated
        ? t("nodesIsolated", { count: isolated })
        : readyToCorrelate(game)
          ? t("theEvidencePicture", { nodeLabel: node.label })
          : t("focusCollectionOn", { nodeLabel: node.label, voice: specialist.voice });
  return <section className="specialist-transmission" data-specialist={game.specialist} aria-live="polite">
    <div><small>{specialist.callsign}, {attribution.confidence === "ATTRIBUTED" ? t("attributed") : t("confidenceAttribution", { confidence: say(withForm(level(attribution.confidence), "lower")) })}</small><strong>{specialist.name}</strong><p>{advice}</p></div>
  </section>;
}
