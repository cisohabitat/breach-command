import { getAttributionRead, getOperationalLabel, infrastructureTopologies, readyToCorrelate, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { useMessages } from "@/hooks/use-messages";
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
  const { t } = useMessages();
  const [title, detail] = sectorMoments[game.scenario];
  const severity = game.continuity <= 45 ? "critical" : game.continuity <= 75 ? "degraded" : "stable";
  return <div className={`sit-entry sector-condition ${severity}`}>
    <span className="sit-label">{t("fieldGuideDialog.sectorCondition")}</span>
    {/* The figure is the continuity readout's, already in the top row; here the
        condition is said in words. */}
    <div className="sit-body"><p><strong>{t(title)}.</strong> {t(detail)}</p><small>{t("livingIncident.is", { getOperationalLabel: getOperationalLabel(game) })}{severity === "critical" ? t("livingIncident.atRisk") : severity === "degraded" ? t("livingIncident.degraded") : t("livingIncident.stable2")}.</small></div>
  </div>;
}

const clampReadout = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function SectorOperationalScene({ game }: { game: Game }) {
  const { t } = useMessages();
  if (![1, 2, 7].includes(game.scenario)) return null;

  const configs = {
    1: {
      eyebrow: t("livingIncident.clinicalServiceLanes"),
      title: t("livingIncident.patientCareContinuity"),
      detail: t("livingIncident.liveServiceLanes"),
      lanes: [
        { label: t("livingIncident.clinicalAccess"), value: game.continuity },
        { label: t("livingIncident.diagnosticServices"), value: game.sectorHealth },
        { label: t("livingIncident.patientRecords"), value: 100 - game.objectiveProgress },
      ],
    },
    2: {
      eyebrow: t("livingIncident.engineeringOperatingEnvelope"),
      title: t("livingIncident.generationAndControl"),
      detail: t("livingIncident.marginsCombinePlant"),
      lanes: [
        { label: t("livingIncident.generationMargin"), value: game.sectorHealth },
        { label: t("livingIncident.controlRoom"), value: game.continuity },
        { label: t("livingIncident.remoteMaintenance"), value: 100 - game.objectiveProgress },
      ],
    },
    7: {
      eyebrow: t("livingIncident.routingDomainPulse"),
      title: t("livingIncident.networkServicePropagation"),
      detail: t("livingIncident.domainTelemetryReflects"),
      lanes: [
        { label: t("livingIncident.coreRouting"), value: 100 - game.objectiveProgress },
        { label: t("livingIncident.managementPlane"), value: game.sectorHealth },
        { label: t("livingIncident.subscriberService"), value: game.continuity },
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
      const status = value > 75 ? t("livingIncident.stable") : value > 45 ? t("livingIncident.constrained") : t("livingIncident.atRisk2");
      return <div className={`sit-entry sit-lane ${value <= 45 ? "at-risk" : value <= 75 ? "constrained" : "stable"}`} key={lane.label}>
        <span className="sit-label">{lane.label}</span>
        <div className="sit-body"><div className="sector-scene-track" aria-hidden="true"><i style={{ width: `${value}%` }} /></div><small>{status}</small></div>
        <b className="sit-figure">{value}</b>
      </div>;
    })}
  </>;
}

export function SpecialistTransmission({ game }: { game: Game }) {
  const { t } = useMessages();
  const specialist = namedSpecialists[game.specialist];
  const topology = infrastructureTopologies[game.scenario];
  const node = topology.nodes.find(item => item.id === game.focusedNode) ?? topology.nodes[0];
  const isolated = Object.values(game.nodePosture).filter(value => value === "isolated").length;
  const attribution = getAttributionRead(game);
  const advice = game.pendingSetPiece
    ? t("livingIncident.theSectorDecision")
    : game.impact >= 70
      ? t("livingIncident.pressureIsCritical", { nodeLabel: node.label })
      : isolated
        ? t("livingIncident.nodesIsolated", { count: isolated })
        : readyToCorrelate(game)
          ? t("livingIncident.theEvidencePicture", { nodeLabel: node.label })
          : t("livingIncident.focusCollectionOn", { nodeLabel: node.label, voice: specialist.voice });
  return <section className="specialist-transmission" aria-live="polite">
    <div><small>{specialist.callsign}, {attribution.confidence === "ATTRIBUTED" ? t("livingIncident.attributed") : t("livingIncident.confidenceAttribution", { confidence: attribution.confidence.toLowerCase() })}</small><strong>{specialist.name}</strong><p>{advice}</p></div>
  </section>;
}
