import { useState } from "react";
import { Braces, Check, GitBranch, Link2, Search, X } from "lucide-react";
import { adversaryObjectives, type AdversaryObjectiveId, type Game } from "@/lib/advanced-game";
import { objectiveTheory } from "@/lib/phase9";

export function EvidenceWorkspace({ game, onCorrelate, onTheory }: { game: Game; onCorrelate: (ids: [string, string], assessment: "causal" | "coincidental") => void; onTheory: (objective: AdversaryObjectiveId) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<"causal" | "coincidental">("causal");
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  return (
    <section className="evidence-workspace" aria-label="Evidence correlation workspace">
      <div className="map-heading"><div><span className="eyebrow">EVIDENCE WORKSPACE</span><h2>Build the causal picture</h2></div><span className="focus-instruction"><Braces size={14} /> {game.correlations.length} correlations tested</span></div>
      <div className="case-theory">
        <div><GitBranch size={17} /><span><strong>Case theory</strong><small>Declare intent, then test it against causal evidence.</small></span></div>
        <div>{(Object.keys(adversaryObjectives) as AdversaryObjectiveId[]).map(id => <button key={id} className={game.caseTheory === id ? "active" : ""} aria-pressed={game.caseTheory === id} disabled={!!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => onTheory(id)} title={objectiveTheory[id].question}>{objectiveTheory[id].title}</button>)}</div>
      </div>
      {!game.evidence.length ? <div className="evidence-empty"><Search size={20} /><p>Successful procedures will place findings here. Select two findings to test whether they form a causal sequence.</p></div> : <>
        <div className="evidence-timeline" role="group" aria-label="Evidence timeline">{game.evidence.map(item => <span key={item.id} className={selected.includes(item.id) ? "selected" : ""}><b>T+{item.turn}</b><i /></span>)}</div>
        <div className="evidence-cards">{game.evidence.map(item => <button key={item.id} className={selected.includes(item.id) ? "selected" : ""} onClick={() => toggle(item.id)} aria-pressed={selected.includes(item.id)}>
          <span>{item.id} · T+{item.turn}</span><strong>{item.title}</strong><small>{item.system} · {item.source}</small><em className={`confidence-${item.confidence.toLowerCase()}`}>{item.confidence} CONFIDENCE</em>
        </button>)}</div>
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
