import { useRef } from "react";
import { useRecoverFocus } from "@/hooks/use-recover-focus";
import { CONTINUITY_AT_RISK } from "@/hooks/use-meter-pulse";
import { getOperationalLabel, responseOptionsFor, type Game, meterEffect } from "@/lib/advanced-game";
import { EffectList } from "@/components/game/effect-list";
import { useMessages } from "@/hooks/use-messages";
import { responsePanelMessages } from "@/lib/i18n/en/response-panel";
import { register } from "@/lib/i18n";

register(responsePanelMessages);

export function ResponsePanel({ game, onChoose }: { game: Game; onChoose: (choice: string) => void }) {
  const { t } = useMessages();
  const phase = game.responseChoices.length === 0 ? "containment" : game.responseChoices.length === 1 ? "assurance" : "recovery";
  const containment = phase === "containment";
  const assurance = phase === "assurance";
  const profile = responseOptionsFor(game);
  const options = profile[phase];
  const previousPhase = assurance ? "containment" : phase === "recovery" ? "assurance" : null;
  const previous = previousPhase ? profile[previousPhase].find(option => option.id === game.responseChoices[game.responseChoices.length - 1]) : null;
  // Each phase brings new options, so the button just pressed is gone. Focus
  // moves to the new phase's heading rather than dropping to the page.
  const heading = useRef<HTMLHeadingElement>(null);
  useRecoverFocus(heading, phase);
  return (
    <section className="response-panel" data-phase={phase}>
      {/* The sequence is a line of text with the current phase marked, not a
          stepper of three boxes; a phase already chosen says so in words. */}
      <ol className="response-sequence" aria-label={t("responsePanel.responseSequence")}>
        {([t("responsePanel.contain"), t("responsePanel.assure"), t("responsePanel.recover")] as const).map((name, index) => <li key={name} className={index < game.responseChoices.length ? "done" : index === game.responseChoices.length ? "current" : ""} aria-current={index === game.responseChoices.length ? "step" : undefined}>{name}{index < game.responseChoices.length && <small>{t("responsePanel.recorded")}</small>}</li>)}
      </ol>
      {/* Each phase swaps the animation on this wrapper, so the beat restarts without remounting the controls. */}
      <div className="response-stage">
        <div className="response-heading">
          <div><h2 ref={heading} tabIndex={-1} data-awaiting-heading>{containment ? t("responsePanel.containmentDecision") : assurance ? t("responsePanel.assuranceGate") : t("responsePanel.recoveryDecision")}</h2><p><strong>{containment ? t("responsePanel.stopTheConfirmed") : assurance ? t("responsePanel.proveTheBoundary") : t("responsePanel.restoreTrustedService")}</strong> {containment ? t("responsePanel.balanceAttackerAccess") : assurance ? t("responsePanel.decideWhatMust") : t("responsePanel.chooseHowMuch")}</p>{containment
            ? <p className="muted small"><strong>{t("responsePanel.sectorConstraint")}</strong> {profile.constraint}</p>
            // Each later phase opens on what the one before it did, in place of the
            // constraint already read: a playtest saw no result between choices.
            : previous && <p className="response-recorded"><strong>{assurance ? t("responsePanel.containment") : t("responsePanel.assurance")}{t("responsePanel.recorded2")}</strong> {t("responsePanel.leavingBusinessImpact2", { previousTitle: previous.title, impact: game.impact, getOperationalLabel: getOperationalLabel(game).toLowerCase(), continuity: game.continuity })}</p>}</div>
        </div>
        <div className="response-options">
          {/* Numbered ruled rows: the option and what it does on the left, its
              terms and its exact effect in a column on the right. Three equal
              cards with an arrow in the corner read as a feature grid. */}
          {options.map((option, index) => <button key={option.id} onClick={() => onChoose(option.id)}><b className="option-no">{index + 1}</b><span className="option-main"><strong>{option.title}</strong><span>{option.description}</span><span className="option-terms-line">{t("responsePanel.disruptionConfidenceResidual", { disruption: option.disruption, confidence: option.confidence.toLowerCase(), residual: option.residual.toLowerCase() })}</span></span><span className="option-effects"><OptionEffect game={game} impact={option.impact} continuity={option.continuity} /></span></button>)}
        </div>
      </div>
    </section>
  );
}

// What the option does to the two meters, and where it leaves them. The words
// above — disruption, confidence — did not say that taking the decisive option
// in all three phases spends a third of the service.
function OptionEffect({ game, impact, continuity }: { game: Game; impact: number; continuity: number }) {
  const { t } = useMessages();
  const after = { impact: Math.min(100, Math.max(0, game.impact + impact)), continuity: Math.min(100, Math.max(0, game.continuity + continuity)) };
  const ends = after.impact >= 100 || after.continuity <= 0;
  // Crossing into the meter's "At risk" band is said here, in the meter's own
  // word, rather than left for the player to work out from the number.
  const atRisk = !ends && game.continuity > CONTINUITY_AT_RISK && after.continuity <= CONTINUITY_AT_RISK;
  return (
    <span className={`response-effect ${ends ? "ends" : atRisk ? "at-risk" : ""}`}>
      {/* The change the meter will actually show: "−22 better" at an impact of 0 promised nothing. */}
      <EffectList items={[meterEffect(game, "impact", after.impact - game.impact), meterEffect(game, "continuity", after.continuity - game.continuity)]} />
      <small>{t("responsePanel.endsAt2", { getOperationalLabel: getOperationalLabel(game), continuity: after.continuity })}{ends && <b>{t("responsePanel.whichEndsThe")}</b>}{atRisk && <b>{t("responsePanel.atRisk")}</b>}</small>
    </span>
  );
}
