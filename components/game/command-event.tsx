import { commandEvents, type CommandEventId, type Game } from "@/lib/advanced-game";
import { ArrowRight, RadioTower } from "lucide-react";
import { useRef } from "react";
import { useRecoverFocus } from "@/hooks/use-recover-focus";

export function CommandEvent({ game, onChoose }: { game: Game; onChoose: (choice: "a" | "b") => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game.pendingCommand);
  if (!game.pendingCommand) return null;
  const event = commandEvents[game.pendingCommand as CommandEventId];
  return (
    <section className="command-event" aria-labelledby="command-event-title">
      <div className="command-event-heading"><RadioTower size={22} /><div><span className="eyebrow">COMMAND EVENT</span><h2 id="command-event-title" ref={heading} tabIndex={-1}>{event.title}</h2><p>{event.prompt}</p></div></div>
      <div className="command-options">
        {(["a", "b"] as const).map(choice => <button key={choice} onClick={() => onChoose(choice)}><strong>{event[choice].title}</strong><span>{event[choice].description}</span><small>{event[choice].signal}</small><ArrowRight size={17} /></button>)}
      </div>
    </section>
  );
}
