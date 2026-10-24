import { Activity, ShieldCheck } from "lucide-react";
import { getEvidenceAssessment, getEvidenceSpecialist, type EvidenceItem, type Game } from "@/lib/advanced-game";
import { namedSpecialists, specialists } from "@/lib/command-systems";
import { SpecialistPortrait } from "./story-art";
import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { evidenceAssessmentMessages } from "@/lib/i18n/en/evidence-assessment";

register(evidenceAssessmentMessages);

export function EvidenceAxes({ game, item, standalone = false }: { game: Game; item: EvidenceItem; standalone?: boolean }) {
  const { t } = useMessages("evidenceAssessment");
  const read = getEvidenceAssessment(game, item);
  const axes = <span className="evidence-axes">
      <span><Activity size={14} aria-hidden="true" />{t(read.signal === "strong" ? "evidenceAssessment.strongSignal" : "evidenceAssessment.weakSignal")}</span>
      <span><ShieldCheck size={14} aria-hidden="true" />{t(read.confidence === "strong" ? "evidenceAssessment.strongConfidence" : "evidenceAssessment.weakConfidence")}</span>
    </span>;
  return standalone ? <span className="evidence-assessment" data-signal={read.signal} data-confidence={read.confidence}>{axes}</span> : axes;
}

export function EvidenceAssessment({ game, item, compact = false }: { game: Game; item: EvidenceItem; compact?: boolean }) {
  const { t } = useMessages("evidenceAssessment");
  const read = getEvidenceAssessment(game, item);
  const analyst = getEvidenceSpecialist(game, item);
  // The report can disclose the longer basis on demand. Other findings live
  // inside selectable buttons, so their default span never contains a control.
  const Root = compact ? "section" : "span";
  const basis = t(read.basis === "corroborated" ? "evidenceAssessment.basisCorroborated" : read.basis === "exhaustive" ? "evidenceAssessment.basisExhaustive" : read.basis === "single" ? "evidenceAssessment.basisSingle" : "evidenceAssessment.basisRecorded");
  return <Root className="evidence-assessment" data-signal={read.signal} data-confidence={read.confidence}>
    <span className="source-analyst" data-specialist={analyst}><SpecialistPortrait specialist={analyst} /><span>{t("sourceReview", { name: namedSpecialists[analyst].name, role: specialists[analyst].title })}</span></span>
    <EvidenceAxes game={game} item={item} />
    <small>{t(item.supports ? "evidenceAssessment.signalConfirmed" : "evidenceAssessment.signalEmpty")}</small>
    {compact ? <details className="decision-primer"><summary>{t("confidenceBasis")}: {t(read.confidence === "strong" ? "evidenceAssessment.supportedInterpretation" : "evidenceAssessment.seekCorroboration")}</summary><p>{basis}</p></details> : <small>{basis}</small>}
  </Root>;
}

export function SignalGuide() {
  const { t } = useMessages("evidenceAssessment");
  return <details className="signal-guide decision-primer">
    <summary>{t("signalGuide")}</summary>
    <p>{t("axesExplained")}</p>
    <ul>
      <li>{t("exampleStrongStrong")}</li>
      <li>{t("exampleStrongWeak")}</li>
      <li>{t("exampleWeakStrong")}</li>
      <li>{t("exampleWeakWeak")}</li>
    </ul>
    <p>{t("responseTradeoff")}</p>
  </details>;
}
