import { commandEvents, describeMeterChange, describeRollShift, type CommandEventId, type Game } from "@/lib/advanced-game";
import { useRef } from "react";
import { useRecoverFocus } from "@/hooks/use-recover-focus";
import { EffectList } from "@/components/game/effect-list";

export function CommandEvent({ game, onChoose }: { game: Game; onChoose: (choice: "a" | "b") => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game.pendingCommand);
  if (!game.pendingCommand) return null;
  const event = commandEvents[game.pendingCommand as CommandEventId];
  return (
    <section className="command-event" aria-labelledby="command-event-title">
      <div className="command-event-heading"><div><span className="eyebrow">Command event</span><h2 id="command-event-title" ref={heading} tabIndex={-1} data-awaiting-heading>{event.title}</h2><p>{event.prompt}</p></div></div>
      <div className="command-options">
        {/* Numbered ruled rows with the exact effect in a column, as the response
            and the sector decision are set; two cards with corner arrows were not. */}
        {(["a", "b"] as const).map((choice, index) => <button key={choice} onClick={() => onChoose(choice)}><b className="option-no">{index + 1}</b><span className="option-main"><strong>{event[choice].title}</strong><span>{event[choice].description}</span><span className="option-signals">{event[choice].signal.split(" · ").map(part => <span key={part}>{part}</span>)}</span></span><span className="option-effects"><EffectList className="command-effect" items={effectLine(game, event[choice])} /></span></button>)}
      </div>
    </section>
  );
}

// The exact effect, as sector decisions and map actions state theirs: "Faster
// action · Greater blind-spot risk" was followed by a cost no one had been shown.
function effectLine(game: Game, option: { impact: number; continuity: number; modifier: number; tempo: number }) {
  return [
    describeMeterChange(game, "impact", option.impact),
    describeMeterChange(game, "continuity", option.continuity),
    describeRollShift(game.nextModifier, option.modifier),
    // Pace runs from 0 to 3; a step past either end changes nothing, and said
    // "one step faster" beside a pace already at "pressing hard".
    option.tempo && Math.min(3, Math.max(0, game.adversaryTempo + option.tempo)) !== game.adversaryTempo
      ? `adversary pace one step ${option.tempo > 0 ? "faster" : "slower"}: about ${Math.abs(option.tempo) * 3} ${option.tempo > 0 ? "more" : "less"} adversary progress each turn`
      : option.tempo ? `adversary pace unchanged (already ${option.tempo > 0 ? "at its fastest" : "at its slowest"})` : "",
  ];
}
