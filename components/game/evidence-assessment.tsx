import { Activity, ShieldCheck } from "lucide-react";
import { getEvidenceAssessment, type EvidenceItem, type Game } from "@/lib/advanced-game";
import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { evidenceAssessmentMessages } from "@/lib/i18n/en/evidence-assessment";

register(evidenceAssessmentMessages);

export function EvidenceAssessment({ game, item }: { game: Game; item: EvidenceItem }) {
  const { t } = useMessages();
  const read = getEvidenceAssessment(game, item);
  return <span className="evidence-assessment" data-signal={read.signal} data-confidence={read.confidence}>
    <span className="evidence-axes">
      <span><Activity size={14} aria-hidden="true" />{t(read.signal === "strong" ? "evidenceAssessment.strongSignal" : "evidenceAssessment.weakSignal")}</span>
      <span><ShieldCheck size={14} aria-hidden="true" />{t(read.confidence === "strong" ? "evidenceAssessment.strongConfidence" : "evidenceAssessment.weakConfidence")}</span>
    </span>
    <small>{t(item.supports ? "evidenceAssessment.signalConfirmed" : "evidenceAssessment.signalEmpty")}</small>
    <small>{t(read.basis === "corroborated" ? "evidenceAssessment.basisCorroborated" : read.basis === "exhaustive" ? "evidenceAssessment.basisExhaustive" : read.basis === "single" ? "evidenceAssessment.basisSingle" : "evidenceAssessment.basisRecorded")}</small>
  </span>;
}

export function SignalGuide() {
  const { t } = useMessages();
  return <details className="signal-guide decision-primer">
    <summary>{t("evidenceAssessment.signalGuide")}</summary>
    <p>{t("evidenceAssessment.axesExplained")}</p>
    <ul>
      <li>{t("evidenceAssessment.exampleStrongStrong")}</li>
      <li>{t("evidenceAssessment.exampleStrongWeak")}</li>
      <li>{t("evidenceAssessment.exampleWeakStrong")}</li>
      <li>{t("evidenceAssessment.exampleWeakWeak")}</li>
    </ul>
    <p>{t("evidenceAssessment.responseTradeoff")}</p>
  </details>;
}
