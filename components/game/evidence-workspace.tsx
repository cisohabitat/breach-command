import { useState, type RefObject } from "react";
import { getConfidenceChanges } from "@/lib/advanced-game";
import { CaptainVoice } from "./captain-voice-lazy";
import { EvidenceAssessment, SignalGuide } from "./evidence-assessment";
import { EvidenceLinks } from "./evidence-links";
import { ArrowUp, Check, Link2, X } from "lucide-react";
import { landOnInvestigation } from "@/hooks/use-recover-focus";
import { adversaryObjectives, attacks, getObjectiveRead, hypotheses, stages, type AdversaryObjectiveId, type Game } from "@/lib/advanced-game";
import { objectiveTheory } from "@/lib/phase9";
import { useMessages } from "@/hooks/use-messages";
import { level, lit, withForm } from "@/lib/i18n/message";
import { evidenceWorkspaceMessages } from "@/lib/i18n/en/evidence-workspace";
import { register } from "@/lib/i18n";

register(evidenceWorkspaceMessages);

export function EvidenceWorkspace({ game, onCorrelate, onTheory, voiceEnabled, voiceHistory }: { game: Game; onCorrelate: (ids: [string, string], assessment: "causal" | "coincidental") => void; onTheory: (objective: AdversaryObjectiveId) => void; voiceEnabled: boolean; voiceHistory: RefObject<Set<string>> }) {
  const { t, rich, say } = useMessages();
  const [selected, setSelected] = useState<string[]>([]);
  // Only a comparison made here triggers feedback. Loading a saved record must
  // not announce an old gain or replay narration. Object identity also prevents
  // a new operation with the same finding ids from inheriting this notice.
  const [compared, setCompared] = useState<{ first: Game["evidence"][number]; index: number; turn: number } | null>(null);
  const changed = compared && compared.first === game.evidence[0] && compared.turn === game.turns.length ? getConfidenceChanges(game, compared.index) : [];
  const changedIds = changed.map(item => item.id);
  const sources = compared ? game.correlations[compared.index]?.evidence.map(id => game.evidence.find(item => item.id === id)).filter(item => !!item).map(item => say(item.source)).join(" + ") : "";
  // Nothing is chosen until the player chooses: preselected, "Causal sequence"
  // was tested by players who had not yet decided anything.
  const [assessment, setAssessment] = useState<"causal" | "coincidental" | null>(null);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  const confirmed = game.evidence.filter(item => item.supports).length;
  const alreadyCompared = selected.length === 2 && game.correlations.some(record => record.evidence.every(id => selected.includes(id)));
  // The objective read the case-theory prompt refers to, shown where the theory
  // is chosen. It is what the game already shows elsewhere once two stages are
  // confirmed, and nothing before that.
  // Named as its button is, so the two can be matched at a glance; the read is
  // only consulted once its confidence says it may be shown.
  const objective = getObjectiveRead(game);
  // A causal judgement turns on stage and route, so a confirmed finding says
  // both. Without them a player could only guess, and timing was all they had.
  const placement = (supports: string | null) => {
    const attack = supports ? attacks.find(item => item.id === supports) : null;
    return attack ? t("evidenceWorkspace.placement", { stage: stages[attack.stage].name, route: say(lit(hypotheses.find(item => item.id === attack.vector)!.title, "lower")) }) : null;
  };
  return (
    <section className="evidence-workspace" aria-label={t("evidenceWorkspace.evidenceCorrelationWorkspace")} tabIndex={-1}>
      <div className="map-heading"><div><h2>{t("evidenceWorkspace.evidenceWorkspace")}</h2></div><span className="focus-instruction">{t("evidenceWorkspace.correlationsTested", { count: game.correlations.length })}</span></div>
      {game.difficulty === "training" && game.mode !== "expert" && !!game.evidence.length && <SignalGuide />}
      <details className="theory-guide decision-primer" open={game.difficulty !== "training" || game.mode === "expert" || confirmed >= 2 || !!game.caseTheory}>
        <summary>{t("evidenceWorkspace.theoryWhenReady")}</summary>
        <div className="case-theory">
        <div><span><strong>{t("evidenceWorkspace.caseTheory")}</strong><small>{t("evidenceWorkspace.declareIntentThen")}{objective.confidence === "LOW" ? t("evidenceWorkspace.theObjectiveCan") : t("evidenceWorkspace.currentAssessmentConfidence", { objectiveTheoryTitle: objectiveTheory[game.objective].title.toLowerCase(), confidence: say(withForm(level(objective.confidence), "lower")) })}</small></span></div>
        <div>{(Object.keys(adversaryObjectives) as AdversaryObjectiveId[]).map(id => <button key={id} className={game.caseTheory === id ? "active" : ""} aria-pressed={game.caseTheory === id} disabled={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => onTheory(id)}><strong>{objectiveTheory[id].title}{game.caseTheory === id && <b className="plan-selected">{t("endState.recorded")}</b>}</strong><small>{objectiveTheory[id].question}</small></button>)}</div>
      </div>
      </details>
      {!game.evidence.length ? <div className="evidence-empty"><p>{rich("evidenceWorkspace.strongNoFindings", {  }, { strong: chunk => <strong>{chunk}</strong> })}</p></div> : <>
        <details className="evidence-detail" open={game.evidence.length <= 3}>
          {/* A finding is not a stage. A check that succeeds without exposing one is
              kept because it still narrows the search, so the count has to say which
              kind each is or a beginner reads every row as a technique they found. */}
          <summary>{rich("evidenceWorkspace.findingsSpanConfirmed", { confirmed, evidence: game.evidence.length - confirmed, selected: selected.length }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="evidence-timeline" role="group" aria-label={t("evidenceWorkspace.evidenceTimeline")}>{game.evidence.map(item => <span key={item.id} className={selected.includes(item.id) ? "selected" : ""}><b>T+{item.turn}</b><i /></span>)}</div>
          <div className="evidence-cards">{game.evidence.map(item => <button key={item.id} data-source={item.id.replace(/^E\d+-/, "")} className={[selected.includes(item.id) ? "selected" : "", changedIds.includes(item.id) ? "confidence-strengthened" : ""].join(" ")} onClick={() => toggle(item.id)} aria-pressed={selected.includes(item.id)}>
            <span>{t("evidenceWorkspace.turn2", { turn: item.turn })}</span><strong>{say(item.title)}</strong>{placement(item.supports) && <b className="evidence-placement">{placement(item.supports)}</b>}<small>{t("evidenceWorkspace.at", { source: say(item.source), system: say(item.system) })}</small><em>{item.supports ? t("evidenceWorkspace.confirmedAStage") : t("evidenceWorkspace.foundNoStage2")}</em><EvidenceAssessment game={game} item={item} />
          </button>)}</div>
        </details>
        {game.evidence.length >= 2 && <EvidenceLinks game={game} selected={selected} />}
        {game.evidence.length >= 2 ? <>
        <div className="relationship-assessment" role="group" aria-label={t("evidenceWorkspace.relationshipAssessment")}>
          <span>{t("evidenceWorkspace.yourAssessment")}</span>
          <button className={assessment === "causal" ? "active" : ""} aria-pressed={assessment === "causal"} onClick={() => setAssessment("causal")}>{t("evidenceWorkspace.causalSequence")}</button>
          <button className={assessment === "coincidental" ? "active" : ""} aria-pressed={assessment === "coincidental"} onClick={() => setAssessment("coincidental")}>{t("evidenceWorkspace.coincidentalOverlap")}</button>
        </div>
        <p className="relationship-helper">{alreadyCompared ? t("evidenceWorkspace.alreadyCompared") : selected.length === 0 ? t("evidenceWorkspace.selectTwoFindings") : selected.length === 1 ? t("evidenceWorkspace.oneFindingSelected") : assessment ? t("evidenceWorkspace.twoFindingsSelected") : t("evidenceWorkspace.twoFindingsSelected2")}{t("evidenceWorkspace.oneFindingEnabled")}</p>
        <button className="correlate-button" disabled={selected.length !== 2 || !assessment || alreadyCompared || !!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => { if (!assessment) return; onCorrelate(selected as [string, string], assessment); setCompared({ first: game.evidence[0], index: game.correlations.length, turn: game.turns.length }); setSelected([]); setAssessment(null); }}><Link2 size={17} />{t("evidenceWorkspace.testAssessment")}</button>
        </> : <p className="relationship-helper">{t("evidenceWorkspace.collectAnotherFinding")}</p>}
      </>}
      {!!changed.length && <section className="confidence-change" key={compared!.index}>
        <p role="status"><strong>{t("evidenceWorkspace.confidenceStrengthened")}</strong> {t("evidenceWorkspace.confidenceChanged", { count: changed.length, sources })}</p>
        <CaptainVoice cue="confidenceStrengthened" enabled={voiceEnabled && game.status === "playing"} history={voiceHistory} />
      </section>}
      {!!game.correlations.length && <div className="correlation-results">{game.correlations.slice(-2).reverse().map((record, index) => <div key={`${record.evidence.join("-")}-${index}`} className={record.correct ? "valid" : "invalid"}>{record.correct ? <Check size={16} /> : <X size={16} />}<p><strong>{record.correct ? t("evidenceWorkspace.assessmentSupported") : t("evidenceWorkspace.assessmentChallenged")}</strong><span>{say(record.finding)}</span><small className="correlation-effect">{!record.correct ? t("evidenceWorkspace.businessImpact4") : record.valid ? t("evidenceWorkspace.businessImpact3") : t("evidenceWorkspace.businessImpact32")}</small></p></div>)}</div>}
      {/* The prompts bring a player down here, three screens below the cards on a
          phone; this takes them back to where the next turn starts. */}
      {/* A recorded case theory left a phone playtest at the foot of the page as
          a comparison did, with no way back but three screens of scrolling. */}
      {(!!game.correlations.length || !!game.caseTheory) && <button className="compare-findings back-to-procedures" onClick={() => landOnInvestigation(true)}>{t("evidenceWorkspace.backToThe")}<ArrowUp size={14} /></button>}
    </section>
  );
}
