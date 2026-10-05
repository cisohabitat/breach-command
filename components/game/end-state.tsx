import { useRef, useState } from "react";
import { getLossReason, getOperationalLabel, getResultSummary, type Game } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { useRecoverFocus } from "@/hooks/use-recover-focus";

// Three end states, three different beats. A win is a stand-down that the
// incident visibly settles out of; a loss is a quiet closure with nothing
// recovered; an exercise is a controlled stop at the drill boundary. The
// debrief opens on request in every case so the resolution lands first.
export function EndState({ session }: { session: GameSession }) {
  const { game, outcome, setDebrief } = session;
  // A choice that ends the operation removes the control that made it.
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game?.status);
  if (!game) return null;
  const loss = getLossReason(game);
  const openDebrief = () => setDebrief(true);

  if (game.status === "won") {
    return (
      <section className="resolution resolution-won" data-resolution="won">
        <div className="end-banner end-won">
          <div>
            <span className="eyebrow">Resolution: stand down</span>
            <h2 ref={heading} tabIndex={-1} data-awaiting-heading>{outcome?.title}</h2>
            <p>{outcome?.detail} Impact is {game.impact} and {getOperationalLabel(game).toLowerCase()} is {game.continuity}. The captain has closed the active response.</p>
          </div>
          <button className="primary-button" onClick={openDebrief}>Open after-action review</button>
        </div>
        <ol className="resolution-steps">
          {/* What closed the case, as lines of the record with their status in
              the margin, not a checklist of ticks. */}
          <li><b>Confirmed</b><span>Attack chain: {game.revealed.length} of 4 stages identified.</span></li>
          <li><b>Recorded</b><span>Response: containment, assurance and recovery.</span></li>
          <li><b>Scored</b><span>Outcome: grade {outcome?.grade}, {outcome?.breakdown.total} of 100.</span></li>
        </ol>
        <ShareResult game={game} />
      </section>
    );
  }

  if (game.status === "lost") {
    return (
      <section className="resolution resolution-lost" data-resolution="lost">
        <div className="end-banner end-lost">
          <div>
            <span className="eyebrow">Operation closed</span>
            <h2 ref={heading} tabIndex={-1} data-awaiting-heading>{loss.title}.</h2>
            <p>{loss.detail} {loss.cause === "window" ? "" : `${game.revealed.length} of 4 stages were confirmed. `}Impact stands at {game.impact}. No stand-down was issued.</p>
          </div>
          <button className="secondary-button" onClick={openDebrief}>Review the record</button>
        </div>
        <p className="resolution-note">Unresolved stages remain open questions, not conclusions. The record is preserved for the next shift.</p>
        <ShareResult game={game} />
      </section>
    );
  }

  if (game.status === "exercise") {
    return (
      <section className="resolution resolution-exercise" data-resolution="exercise">
        <div className="end-banner end-exercise">
          <div>
            <span className="eyebrow">Authorised exercise</span>
            <h2 ref={heading} tabIndex={-1} data-awaiting-heading>Exercise concluded at the boundary.</h2>
            <p>{game.revealed.length} of 4 stages were identified before the controller confirmed the activity as an authorised exercise. No response phase was run, so containment and recovery are not scored; the decisions you made along the way still are. The case counts as cleared in the campaign: the investigation earned this conclusion.</p>
          </div>
          <button className="secondary-button" onClick={openDebrief}>Review the drill</button>
        </div>
        <ShareResult game={game} />
      </section>
    );
  }

  return null;
}

// The result as a few lines of text, with the challenge code when the operation
// was reproducible, so a friend can play the same one. Counts only: it names no
// technique, so it spoils nothing. Where the clipboard is refused, the text is
// shown to copy by hand.
function ShareResult({ game }: { game: Game }) {
  const [state, setState] = useState<{ status: "idle" | "copied" | "manual"; text: string }>({ status: "idle", text: "" });
  const copy = () => {
    const text = [...getResultSummary(game), window.location.origin].join("\n");
    const manual = () => setState({ status: "manual", text });
    if (!navigator.clipboard?.writeText) return manual();
    navigator.clipboard.writeText(text).then(() => setState({ status: "copied", text }), manual);
  };
  return (
    <div className="share-result">
      <button className="text-action" onClick={copy}>Copy result</button>
      <span aria-live="polite">{state.status === "copied" ? (game.seed === null ? "Result copied." : "Result and challenge code copied.") : ""}</span>
      {state.status === "manual" && <textarea readOnly aria-label="Result to copy" value={state.text} onFocus={event => event.currentTarget.select()} />}
    </div>
  );
}
