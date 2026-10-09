import { useRef } from "react";
import { describeMeterChange, setPieceById, type Game, type SetPieceChoice } from "@/lib/advanced-game";
import { useRecoverFocus } from "@/hooks/use-recover-focus";
import { EffectList } from "@/components/game/effect-list";

// The change a meter will actually take: "+5 better" at a margin of 100 promised
// nothing it could deliver.
const reachable = (current: number, change: number) => Math.min(100, Math.max(0, current + change)) - current;

export function SectorSetPiece({ game, onChoose }: { game: Game; onChoose: (choice: SetPieceChoice) => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game.pendingSetPiece);
  if (!game.pendingSetPiece) return null;
  const event = setPieceById(game.pendingSetPiece, game.scenario);
  // Numbered ruled rows like the response phase, the warning a rule in the margin
  // of the section: a tinted alert box holding three cards with corner arrows was
  // the stock "choose an option" grid.
  return <section className="sector-set-piece" aria-live="assertive"><div className="set-piece-title"><div><h2 ref={heading} tabIndex={-1} data-awaiting-heading><span className="heading-kind">Sector decision:</span> {event.title}</h2><p>{event.prompt}</p></div></div><div className="set-piece-options">{(["a", "c", "b"] as const).map((id, index) => <button key={id} onClick={() => onChoose(id)}><b className="option-no">{index + 1}</b><span className="option-main"><strong>{event[id].title}</strong><span>{event[id].detail}</span></span><span className="option-effects"><EffectList items={[describeMeterChange(game, "impact", reachable(game.impact, event[id].impact)), describeMeterChange(game, "continuity", reachable(game.continuity, event[id].continuity)), describeMeterChange(game, "sector", reachable(game.sectorHealth, event[id].sector)), !!event[id].objective && describeMeterChange(game, "objective", reachable(game.objectiveProgress, event[id].objective))]} /></span></button>)}</div></section>;
}
