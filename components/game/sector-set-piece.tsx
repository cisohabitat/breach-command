import { AlertTriangle, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { describeMeterChange, sectorSetPieces, type Game, type SetPieceChoice } from "@/lib/advanced-game";
import { useRecoverFocus } from "@/hooks/use-recover-focus";

// The change a meter will actually take: "+5 better" at a margin of 100 promised
// nothing it could deliver.
const reachable = (current: number, change: number) => Math.min(100, Math.max(0, current + change)) - current;

export function SectorSetPiece({ game, onChoose }: { game: Game; onChoose: (choice: SetPieceChoice) => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game.pendingSetPiece);
  if (!game.pendingSetPiece) return null;
  const event = sectorSetPieces[game.scenario];
  return <section className="sector-set-piece" aria-live="assertive"><div className="set-piece-title"><AlertTriangle size={24} /><div><span className="eyebrow">SECTOR CRISIS DECISION</span><h2 ref={heading} tabIndex={-1} data-awaiting-heading>{event.title}</h2><p>{event.prompt}</p></div></div><div className="set-piece-options">{(["a", "c", "b"] as const).map(id => <button key={id} onClick={() => onChoose(id)}><strong>{event[id].title}</strong><span>{event[id].detail}</span><small>{describeMeterChange(game, "impact", reachable(game.impact, event[id].impact))} · {describeMeterChange(game, "continuity", reachable(game.continuity, event[id].continuity))} · {describeMeterChange(game, "sector", reachable(game.sectorHealth, event[id].sector))}{event[id].objective ? ` · ${describeMeterChange(game, "objective", reachable(game.objectiveProgress, event[id].objective))}` : ""}</small><ArrowRight size={17} /></button>)}</div></section>;
}
