import type { Game } from "@/lib/engine/types";
import { useEffect, useState, type RefObject } from "react";
import { getEvidenceAssessment } from "@/lib/evidence-assessment";
import type { Confidence } from "@/lib/learning";
import { recommendPractice, recordReflection } from "@/lib/learning";
import { useLearning } from "@/hooks/use-learning";
import { useMessages } from "@/hooks/use-messages";
import { learningMessages } from "@/lib/i18n/en/learning";
import { register } from "@/lib/i18n";
register(learningMessages);
const labels = { low: "learning.low", medium: "learning.medium", high: "learning.high" } as const;
export function LearningHistory() {
  const { t } = useMessages();
  const record = useLearning();
  return record.reflections.length > 0 && <details><summary>{t("learning.recentReflections")}</summary><dl>{record.reflections.slice(-10).reverse().map(row => <div key={`${row.operation}-${row.phase}`}><dt>{t("learning.response", { phase: row.phase + 1, confidence: t(labels[row.confidence]) })}</dt><dd>{t("learning.snapshot", { confirmed: row.confirmed, strong: row.strong, findings: row.findings, impact: row.impact, continuity: row.continuity })}</dd></div>)}</dl><p>{t("learning.measured")}</p></details>;
}
export function ConfidenceReflection({ game, operation, rememberRef }: { game: Game; operation: string; rememberRef: RefObject<((choice: string) => void) | null> }) {
  const { t } = useMessages();
  const [value, onChange] = useState<Confidence | null>(null);
  useEffect(() => {
    rememberRef.current = choice => {
      if (value && operation) recordReflection({ operation, phase: game.responseChoices.length, confidence: value, choice, confirmed: game.revealed.length, findings: game.evidence.length, strong: game.evidence.filter(item => getEvidenceAssessment(game, item).confidence === "strong").length, impact: game.impact, continuity: game.continuity });
    };
    return () => { rememberRef.current = null; };
  }, [game, operation, rememberRef, value]);
  return <details className="decision-primer confidence-reflection"><summary>{t("learning.confidence")}</summary><p>{t("learning.intro")}</p><fieldset><legend className="sr-only">{t("learning.confidence")}</legend>{([null, "low", "medium", "high"] as const).map(level => <label className="confidence-choice" key={level ?? "skip"}><input type="radio" name="response-confidence" checked={value === level} onChange={() => onChange(level)} />{t(level ? labels[level] : "learning.skip")}</label>)}</fieldset></details>;
}
export function LearningReview({ game, operation }: { game: Game; operation: string }) {
  const { t, locale } = useMessages();
  const record = useLearning();
  if (game.status === "playing" || game.status === "response") return null;
  const lesson = recommendPractice(game);
  const rows = record.reflections.filter(row => row.operation === operation && game.responseChoices[row.phase] === row.choice);
  return <section className="first-read" aria-label={t("learning.practice")}>
    <h3>{t("learning.practice")}: {t(lesson === "signal" ? "learning.signal" : lesson === "confidence" ? "learning.comparison" : "learning.containment")}</h3>
    <p>{t(lesson === "signal" ? "learning.signalReason" : lesson === "confidence" ? "learning.comparisonReason" : "learning.containmentReason")}</p>
    <a className="primary-button" href={`/practice?lesson=${lesson}&locale=${locale}`}>{t("learning.practice")}</a>
    {rows.length > 0 && <details className="debrief-fold"><summary>{t("learning.reflections")}</summary><dl>{rows.map(row => <div key={row.phase}><dt>{t("learning.response", { phase: row.phase + 1, confidence: t(labels[row.confidence]) })}</dt><dd>{t("learning.snapshot", { confirmed: row.confirmed, strong: row.strong, findings: row.findings, impact: row.impact, continuity: row.continuity })}<p>{t(row.confidence === "high" && (row.strong < row.findings || row.findings === 0) ? "learning.bounded" : "learning.measured")}</p></dd></div>)}</dl></details>}
    <p><a href={`/practice?locale=${locale}`}>{t("learning.recordLink")}</a></p>
  </section>;
}
