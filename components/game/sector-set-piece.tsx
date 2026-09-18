import { AlertTriangle, ArrowRight } from "lucide-react";
import { sectorSetPieces, type Game } from "@/lib/advanced-game";

export function SectorSetPiece({ game, onChoose }: { game: Game; onChoose: (choice: "a" | "b") => void }) {
  if (!game.pendingSetPiece) return null;
  const event = sectorSetPieces[game.scenario];
  return <section className="sector-set-piece" aria-live="assertive"><div className="set-piece-title"><AlertTriangle size={24} /><div><span className="eyebrow">SECTOR CRISIS DECISION</span><h2>{event.title}</h2><p>{event.prompt}</p></div></div><div className="set-piece-options">{(["a", "b"] as const).map(id => <button key={id} onClick={() => onChoose(id)}><strong>{event[id].title}</strong><span>{event[id].detail}</span><small>IMPACT {event[id].impact >= 0 ? "+" : ""}{event[id].impact} · CONTINUITY {event[id].continuity >= 0 ? "+" : ""}{event[id].continuity} · SECTOR {event[id].sector >= 0 ? "+" : ""}{event[id].sector}</small><ArrowRight size={17} /></button>)}</div></section>;
}
