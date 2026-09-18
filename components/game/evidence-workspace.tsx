import { useState } from "react";
import { Braces, Check, Link2, Search, X } from "lucide-react";
import type { Game } from "@/lib/advanced-game";

export function EvidenceWorkspace({ game, onCorrelate }: { game: Game; onCorrelate: (ids: [string, string]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  return (
    <section className="evidence-workspace" aria-label="Evidence correlation workspace">
      <div className="map-heading"><div><span className="eyebrow">EVIDENCE WORKSPACE</span><h2>Build the causal picture</h2></div><span className="focus-instruction"><Braces size={14} /> {game.correlations.length} correlations tested</span></div>
      {!game.evidence.length ? <div className="evidence-empty"><Search size={20} /><p>Successful procedures will place findings here. Select two findings to test whether they form a causal sequence.</p></div> : <>
        <div className="evidence-cards">{game.evidence.map(item => <button key={item.id} className={selected.includes(item.id) ? "selected" : ""} onClick={() => toggle(item.id)} aria-pressed={selected.includes(item.id)}>
          <span>{item.id} · T+{item.turn}</span><strong>{item.title}</strong><small>{item.system} · {item.source}</small><em className={`confidence-${item.confidence.toLowerCase()}`}>{item.confidence} CONFIDENCE</em>
        </button>)}</div>
        <button className="correlate-button" disabled={selected.length !== 2 || !!game.pendingDecision || !!game.pendingCommand || !!game.pendingSetPiece} onClick={() => { onCorrelate(selected as [string, string]); setSelected([]); }}><Link2 size={17} /> Test selected relationship</button>
      </>}
      {!!game.correlations.length && <div className="correlation-results">{game.correlations.slice(-2).reverse().map((record, index) => <div key={`${record.evidence.join("-")}-${index}`} className={record.valid ? "valid" : "invalid"}>{record.valid ? <Check size={16} /> : <X size={16} />}<p><strong>{record.valid ? "Causal relationship supported" : "Correlation is not causation"}</strong><span>{record.finding}</span></p></div>)}</div>}
    </section>
  );
}
