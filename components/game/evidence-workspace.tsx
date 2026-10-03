import { useState } from "react";
import { Braces, Check, GitBranch, Link2, Search, X } from "lucide-react";
import { adversaryObjectives, attacks, getObjectiveRead, hypotheses, stages, type AdversaryObjectiveId, type Game } from "@/lib/advanced-game";
import { objectiveTheory } from "@/lib/phase9";

export function EvidenceWorkspace({ game, onCorrelate, onTheory }: { game: Game; onCorrelate: (ids: [string, string], assessment: "causal" | "coincidental") => void; onTheory: (objective: AdversaryObjectiveId) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<"causal" | "coincidental">("causal");
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
      <div className="map-heading"><div><span className="eyebrow">EVIDENCE WORKSPACE</span><h2>Build the causal picture</h2></div><span className="focus-instruction"><Braces size={14} /> {game.correlations.length} {game.correlations.length === 1 ? "correlation" : "correlations"} tested</span></div>
      <div className="case-theory">
        <div><GitBranch size={17} /><span><strong>Case theory</strong><small>Declare intent, then test it against causal evidence. {objective.confidence === "LOW" ? "The objective can be assessed once two stages are confirmed." : `Current assessment: ${objectiveTheory[game.objective].title.toLowerCase()}, ${objective.confidence.toLowerCase()} confidence.`}</small></span></div>
        <div>{(Object.keys(adversaryObjectives) as AdversaryObjectiveId[]).map(id => <button key={id} className={game.caseTheory === id ? "active" : ""} aria-pressed={game.caseTheory === id} disabled={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => onTheory(id)} title={objectiveTheory[id].question}>{objectiveTheory[id].title}</button>)}</div>
      </div>
      {!game.evidence.length ? <div className="evidence-empty"><Search size={20} /><p>Successful procedures will place findings here. A check can succeed and still settle nothing — that is recorded too. Select two findings to test whether they form a causal sequence.</p></div> : <>
        <details className="evidence-detail" open={game.evidence.length <= 3}>
          {/* A finding is not a stage. A check that succeeds without exposing one is
              kept because it still narrows the search, so the count has to say which
              kind each is or a beginner reads every row as a technique they found. */}
          <summary>Findings<span>{confirmed} confirmed a stage · {game.evidence.length - confirmed} settled nothing · {selected.length} selected</span></summary>
          <div className="evidence-timeline" role="group" aria-label="Evidence timeline">{game.evidence.map(item => <span key={item.id} className={selected.includes(item.id) ? "selected" : ""}><b>T+{item.turn}</b><i /></span>)}</div>
          <div className="evidence-cards">{game.evidence.map(item => <button key={item.id} className={selected.includes(item.id) ? "selected" : ""} onClick={() => toggle(item.id)} aria-pressed={selected.includes(item.id)}>
            <span>Turn {item.turn}</span><strong>{item.title}</strong>{placement(item.supports) && <b className="evidence-placement">{placement(item.supports)}</b>}<small>{item.system} · {item.source}</small><em className={`confidence-${item.confidence.toLowerCase()}`}>{item.supports ? "CONFIRMED A STAGE" : "SETTLED NOTHING"} · {item.confidence} CONFIDENCE</em>
          </button>)}</div>
        </details>
        <div className="relationship-assessment" role="group" aria-label="Relationship assessment">
          <span>YOUR ASSESSMENT</span>
          <button className={assessment === "causal" ? "active" : ""} aria-pressed={assessment === "causal"} onClick={() => setAssessment("causal")}>Causal sequence</button>
          <button className={assessment === "coincidental" ? "active" : ""} aria-pressed={assessment === "coincidental"} onClick={() => setAssessment("coincidental")}>Coincidental overlap</button>
        </div>
        <p className="relationship-helper">{selected.length === 0 ? "Select two findings to compare." : selected.length === 1 ? "One finding selected. Choose one more." : "Two findings selected. Choose whether the relationship is causal or coincidental, then test it."}</p>
        <button className="correlate-button" disabled={selected.length !== 2 || !!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => { onCorrelate(selected as [string, string], assessment); setSelected([]); }}><Link2 size={17} /> Test assessment</button>
      </>}
      {!!game.correlations.length && <div className="correlation-results">{game.correlations.slice(-2).reverse().map((record, index) => <div key={`${record.evidence.join("-")}-${index}`} className={record.correct ? "valid" : "invalid"}>{record.correct ? <Check size={16} /> : <X size={16} />}<p><strong>{record.correct ? "Assessment supported" : "Assessment challenged"}</strong><span>{record.finding}</span></p></div>)}</div>}
    </section>
  );
}
