import { useRef, useState } from "react";
import { getLossReason, getOperationalLabel, getResultSummary, getShareCard, type Game } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { useRecoverFocus } from "@/hooks/use-recover-focus";
import { useMessages } from "@/hooks/use-messages";
import { endStateMessages } from "@/lib/i18n/en/end-state";
import { register } from "@/lib/i18n";
import { withForm } from "@/lib/i18n/message";

register(endStateMessages);

// Three end states, three different beats. A win is a stand-down that the
// incident visibly settles out of; a loss is a quiet closure with nothing
// recovered; an exercise is a controlled stop at the drill boundary. The
// debrief opens on request in every case so the resolution lands first.
export function EndState({ session }: { session: GameSession }) {
  const { game, outcome, setDebrief } = session;
  const { t, say } = useMessages();
  // A choice that ends the operation removes the control that made it.
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, game?.status);
  if (!game) return null;
  const loss = getLossReason(game);
  const openDebrief = () => setDebrief(true);

  if (game.status === "won") {
    // Expert withholds every aid, so its win is its own ending and its own mark
    // on the case.
    const expert = game.mode === "expert";
    return (
      <section className="resolution resolution-won" data-resolution="won" data-expert={expert || undefined}>
        <div className="end-banner end-won">
          <div>
            <h2 ref={heading} tabIndex={-1} data-awaiting-heading>{expert ? t("endState.clearedInExpert2", { outcomeTitle: outcome ? say(withForm(outcome.title, "lower")) : "undefined" }) : outcome && say(outcome.title)}</h2>
            <p>{expert ? t("endState.noClueStanding") : ""}{outcome && say(outcome.detail)}{t("endState.impactIsAnd", { impact: game.impact, getOperationalLabel: getOperationalLabel(game).toLowerCase(), continuity: game.continuity })}</p>
          </div>
          <button className="primary-button" onClick={openDebrief}>{t("ending.openReview")}</button>
        </div>
        <ol className="resolution-steps">
          {/* What closed the case, as lines of the record with their status in
              the margin, not a checklist of ticks. */}
          <li><b>{t("endState.confirmed")}</b><span>{t("endState.attackChainOf", { revealed: game.revealed.length })}</span></li>
          <li><b>{t("endState.recorded")}</b><span>{t("endState.responseContainmentAssurance")}</span></li>
          <li><b>{t("endState.scored")}</b><span>{t("endState.outcomeGrade")}{outcome?.grade}, {outcome?.breakdown.total}{t("endState.of100")}</span></li>
          {expert && <li><b>{t("endState.marked")}</b><span>{t("endState.clearedInExpert")}</span></li>}
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
            <h2 ref={heading} tabIndex={-1} data-awaiting-heading>{say(loss.title)}.</h2>
            <p>{say(loss.detail)} {loss.cause === "window" ? "" : t("endState.of4Stages", { revealed: game.revealed.length })}{t("endState.impactStandsAt2", { impact: game.impact })}</p>
          </div>
          <button className="secondary-button" onClick={openDebrief}>{t("ending.reviewRecord")}</button>
        </div>
        <p className="resolution-note">{t("endState.unresolvedStagesRemain")}</p>
        <ShareResult game={game} />
      </section>
    );
  }

  if (game.status === "exercise") {
    return (
      <section className="resolution resolution-exercise" data-resolution="exercise">
        <div className="end-banner end-exercise">
          <div>
            <h2 ref={heading} tabIndex={-1} data-awaiting-heading>{t("endState.exerciseConcludedAt")}</h2>
            <p>{t("endState.of4Stages2", { revealed: game.revealed.length })}</p>
          </div>
          <button className="secondary-button" onClick={openDebrief}>{t("ending.reviewDrill")}</button>
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
  const { t, say } = useMessages();
  const [state, setState] = useState<{ status: "idle" | "copied" | "manual"; text: string }>({ status: "idle", text: "" });
  const copy = () => {
    const text = [...getResultSummary(game).map(line => say(line)), window.location.origin].join("\n");
    const manual = () => setState({ status: "manual", text });
    if (!navigator.clipboard?.writeText) return manual();
    navigator.clipboard.writeText(text).then(() => setState({ status: "copied", text }), manual);
  };
  // The image is drawn on the device, from the share card alone, and saved as
  // a file; the drawing code loads only when it is asked for.
  const [image, setImage] = useState("");
  const saveImage = () => {
    setImage(t("ending.drawing"));
    import("@/lib/share-image").then(({ drawShareCard }) => drawShareCard(getShareCard(game), window.location.origin)).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "breach-command-result.png";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setImage(t("ending.imageSaved"));
    }).catch(() => setImage(t("ending.imageFailed")));
  };
  return (
    <div className="share-result">
      <button className="text-action" onClick={copy}>{t("ending.copy")}</button>
      <button className="text-action" onClick={saveImage}>{t("ending.saveImage")}</button>
      <span aria-live="polite">{image}</span>
      <span aria-live="polite">{state.status === "copied" ? t(game.seed === null ? "ending.copied" : "ending.copiedWithCode") : ""}</span>
      {state.status === "manual" && <textarea readOnly aria-label={t("ending.resultLabel")} value={state.text} onFocus={event => event.currentTarget.select()} />}
    </div>
  );
}
