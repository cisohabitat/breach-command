import { carryModifier, commandEvents, type CommandEventId, type Game, meterEffect, rollEffect } from "@/lib/advanced-game";
import { useRef } from "react";
import { useRecoverFocus } from "@/hooks/use-recover-focus";
import { EffectList } from "@/components/game/effect-list";
import { useMessages, type Translate } from "@/hooks/use-messages";
import { commandEventMessages } from "@/lib/i18n/en/command-event";
import { register } from "@/lib/i18n";

register(commandEventMessages);

export function CommandEvent({ game, onChoose }: { game: Game; onChoose: (choice: "a" | "b") => void }) {
  const { t } = useMessages();
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game.pendingCommand);
  if (!game.pendingCommand) return null;
  const event = commandEvents[game.pendingCommand as CommandEventId];
  return (
    <section className="command-event" aria-labelledby="command-event-title">
      <div className="command-event-heading"><div><h2 id="command-event-title" ref={heading} tabIndex={-1} data-awaiting-heading><span className="heading-kind">{t("commandEvent.commandEvent")}</span> {event.title}</h2><p>{event.prompt}</p></div></div>
      <div className="command-options">
        {/* Numbered ruled rows with the exact effect in a column, as the response
            and the sector decision are set; two cards with corner arrows were not. */}
        {(["a", "b"] as const).map((choice, index) => <button key={choice} onClick={() => onChoose(choice)}><b className="option-no">{index + 1}</b><span className="option-main"><strong>{event[choice].title}</strong><span>{event[choice].description}</span><span className="option-signals">{signalParts(game, event[choice]).map(part => <span key={part}>{part}</span>)}</span></span><span className="option-effects"><EffectList className="command-effect" items={effectLine(t, game, event[choice])} /></span></button>)}
      </div>
    </section>
  );
}

// The exact effect, as sector decisions and map actions state theirs: "Faster
// action · Greater blind-spot risk" was followed by a cost no one had been shown.
function effectLine(t: Translate, game: Game, option: { impact: number; continuity: number; modifier: number; tempo: number }) {
  return [
    meterEffect(game, "impact", option.impact),
    meterEffect(game, "continuity", option.continuity),
    rollEffect(game.nextModifier, option.modifier),
    // Pace runs from 0 to 3; a step past either end changes nothing, and said
    // "one step faster" beside a pace already at "pressing hard".
    option.tempo && Math.min(3, Math.max(0, game.adversaryTempo + option.tempo)) !== game.adversaryTempo
      ? option.tempo > 0 ? t("commandEvent.paceFaster", { amount: Math.abs(option.tempo) * 3 }) : t("commandEvent.paceSlower", { amount: Math.abs(option.tempo) * 3 })
      : option.tempo ? option.tempo > 0 ? t("commandEvent.paceAtFastest") : t("commandEvent.paceAtSlowest") : "",
  ];
}

// The signal words are authored once; a roll the cap leaves unchanged drops its
// "Next roll harder", which otherwise sat beside "next roll unchanged".
function signalParts(game: Game, option: { signal: string; modifier: number }) {
  const moves = carryModifier(game.nextModifier, option.modifier) !== game.nextModifier;
  return option.signal.split(" · ").filter(part => moves || !/next roll|analytical advantage/i.test(part));
}
