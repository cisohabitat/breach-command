import { useState } from "react";
import { ArrowUp, Braces, Check, GitBranch, Link2, Search, X } from "lucide-react";
import { landOnInvestigation } from "@/hooks/use-recover-focus";
import { adversaryObjectives, attacks, getObjectiveRead, hypotheses, stages, type AdversaryObjectiveId, type Game } from "@/lib/advanced-game";
import { objectiveTheory } from "@/lib/phase9";

export function EvidenceWorkspace({ game, onCorrelate, onTheory }: { game: Game; onCorrelate: (ids: [string, string], assessment: "causal" | "coincidental") => void; onTheory: (objective: AdversaryObjectiveId) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  // Nothing is chosen until the player chooses: preselected, "Causal sequence"
  // was tested by players who had not yet decided anything.
  const [assessment, setAssessment] = useState<"causal" | "coincidental" | null>(null);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  const confirmed = game.evidence.filter(item => item.supports).length;
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
    return attack ? `${stages[attack.stage].name} · ${hypotheses.find(item => item.id === attack.vector)!.title.toLowerCase()} route` : null;
  };
  return (
    <section className="evidence-workspace" aria-label="Evidence correlation workspace" tabIndex={-1}>
      <div className="map-heading"><div><span className="eyebrow">Evidence workspace</span><h2>Build the causal picture</h2></div><span className="focus-instruction"><Braces size={14} /> {game.correlations.length} {game.correlations.length === 1 ? "correlation" : "correlations"} tested</span></div>
      <div className="case-theory">
        <div><GitBranch size={17} /><span><strong>Case theory</strong><small>Declare intent, then test it against causal evidence. {objective.confidence === "LOW" ? "The objective can be assessed once two stages are confirmed." : `Current assessment: ${objectiveTheory[game.objective].title.toLowerCase()}, ${objective.confidence.toLowerCase()} confidence.`}</small></span></div>
        <div>{(Object.keys(adversaryObjectives) as AdversaryObjectiveId[]).map(id => <button key={id} className={game.caseTheory === id ? "active" : ""} aria-pressed={game.caseTheory === id} disabled={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => onTheory(id)}><strong>{objectiveTheory[id].title}{game.caseTheory === id && <b className="plan-selected">RECORDED</b>}</strong><small>{objectiveTheory[id].question}</small></button>)}</div>
      </div>
      {!game.evidence.length ? <div className="evidence-empty"><Search size={20} /><p>Successful procedures will place findings here. A check can succeed and still settle nothing — that is recorded too. Select two findings to test whether they form a causal sequence.</p></div> : <>
        <details className="evidence-detail" open={game.evidence.length <= 3}>
          {/* A finding is not a stage. A check that succeeds without exposing one is
              kept because it still narrows the search, so the count has to say which
              kind each is or a beginner reads every row as a technique they found. */}
          <summary>Findings<span>{confirmed} confirmed a stage · {game.evidence.length - confirmed} found no stage · {selected.length} selected</span></summary>
          <div className="evidence-timeline" role="group" aria-label="Evidence timeline">{game.evidence.map(item => <span key={item.id} className={selected.includes(item.id) ? "selected" : ""}><b>T+{item.turn}</b><i /></span>)}</div>
          <div className="evidence-cards">{game.evidence.map(item => <button key={item.id} className={selected.includes(item.id) ? "selected" : ""} onClick={() => toggle(item.id)} aria-pressed={selected.includes(item.id)}>
            <span>Turn {item.turn}</span><strong>{item.title}</strong>{placement(item.supports) && <b className="evidence-placement">{placement(item.supports)}</b>}<small>{item.system} · {item.source}</small><em className={`confidence-${item.confidence.toLowerCase()}`}>{item.supports ? "CONFIRMED A STAGE" : "FOUND NO STAGE"} · {item.confidence} CONFIDENCE</em>
          </button>)}</div>
        </details>
        <div className="relationship-assessment" role="group" aria-label="Relationship assessment">
          <span>YOUR ASSESSMENT</span>
          <button className={assessment === "causal" ? "active" : ""} aria-pressed={assessment === "causal"} onClick={() => setAssessment("causal")}>Causal sequence</button>
          <button className={assessment === "coincidental" ? "active" : ""} aria-pressed={assessment === "coincidental"} onClick={() => setAssessment("coincidental")}>Coincidental overlap</button>
        </div>
        <p className="relationship-helper">{selected.length === 0 ? "Select two findings to compare." : selected.length === 1 ? "One finding selected. Choose one more." : assessment ? "Two findings selected. Test your assessment." : "Two findings selected. Choose whether the relationship is causal or coincidental, then test it."} One finding enabled the other only if they are consecutive stages or on the same route. A right call: business impact −3, adversary progress −6 and next roll +2; a right causal call made with a case theory that names the objective earns −5, −10 and +3 instead. A wrong call: business impact +4 and adversary progress +3.</p>
        <button className="correlate-button" disabled={selected.length !== 2 || !assessment || !!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => { if (!assessment) return; onCorrelate(selected as [string, string], assessment); setSelected([]); setAssessment(null); }}><Link2 size={17} /> Test assessment</button>
      </>}
      {!!game.correlations.length && <div className="correlation-results">{game.correlations.slice(-2).reverse().map((record, index) => <div key={`${record.evidence.join("-")}-${index}`} className={record.correct ? "valid" : "invalid"}>{record.correct ? <Check size={16} /> : <X size={16} />}<p><strong>{record.correct ? "Assessment supported" : "Assessment challenged"}</strong><span>{record.finding}</span><small className="correlation-effect">{!record.correct ? "Business impact +4 worse and adversary progress +3 worse." : record.valid ? "Business impact −3, adversary progress −6 and next roll +2, or −5, −10 and +3 when your case theory names the objective; the readouts show which." : "Business impact −3 better, adversary progress −6 better and next roll +2."}</small></p></div>)}</div>}
      {/* The prompts bring a player down here, three screens below the cards on a
          phone; this takes them back to where the next turn starts. */}
      {!!game.correlations.length && <button className="compare-findings back-to-procedures" onClick={() => landOnInvestigation(true)}>Back to the procedures <ArrowUp size={14} /></button>}
    </section>
  );
}
