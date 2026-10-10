import { useEffect, useRef, useState, type RefObject } from "react";
import { Siren } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { attacks, decisionRollShift, describePart, injectCard, hypotheses, getHypothesisStanding, getLossReason, procedureIntensities, procedureScopes, procedureById, getAdversaryState, resolveDecision, stages, type DecisionChoice, type Game, meterEffect, rollEffect } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { Glossed } from "@/components/game/glossed";
import { EffectList } from "@/components/game/effect-list";
import { useMessages, type Translate } from "@/hooks/use-messages";
import { captainReportDialogMessages } from "@/lib/i18n/en/captain-report-dialog";
import { register, type Locale, type MessageKey } from "@/lib/i18n";
import { legacyText, say as sayIn, withForm } from "@/lib/i18n/message";

register(captainReportDialogMessages);

// The business impact an inject added to the turn's movement, so a protected
// failed check beside "Business impact +16 worse" says where the rest came from.
function injectImpact(report: Game["turns"][number]) {
  const card = report.inject ? injectCard(report.inject.id) : null;
  return card?.effect === "penalty" ? 6 : card?.effect === "pressure" ? 8 : card?.effect === "relief" ? -8 : card?.effect === "adjust" ? card.impact ?? 0 : 0;
}

// The pressure line names the options as their buttons do: "acting fits best"
// sat beside buttons titled Revoke, Segment, Remove and Block.
function optionTitle(options: { id: DecisionChoice; title: string }[], id: DecisionChoice) {
  return `“${options.find(option => option.id === id)?.title ?? id}”`;
}

// The report names the roll's parts as the action sheet named them. It once said
// "own source +1, other parts +5" beside a sheet that listed all four.
function rollParts(t: Translate, report: Game["turns"][number], locale: Locale) {
  if (report.parts?.length) return ` (${report.parts.map(part => sayIn(describePart(part), locale)).join("; ")})`;
  return report.planningBonus > 0 || report.specialistBonus > 0 ? ` (${[report.planningBonus > 0 ? t("captainReportDialog.ownSource", { planningBonus: report.planningBonus }) : "", report.specialistBonus > 0 ? t("captainReportDialog.specialist", { specialistBonus: report.specialistBonus }) : "", report.modifier - report.planningBonus - report.specialistBonus ? t("captainReportDialog.otherParts", { change: `${report.modifier - report.planningBonus - report.specialistBonus > 0 ? "+" : "−"}${Math.abs(report.modifier - report.planningBonus - report.specialistBonus)}` }) : ""].filter(Boolean).join(", ")})` : "";
}

export function CaptainReportDialog({ session }: { session: GameSession }) {
  const { t, rich, say, locale } = useMessages();
  const { report, game, ended, config, dismissReport, decide } = session;
  // The turn that ends an operation is headed by how it ended: "Evidence
  // confirmed." with a green tick sat above "OPERATION LOST".
  const lostHere = !!(ended && report && game && report.number === game.turns.length && game.status !== "won");
  const content = useRef<HTMLDivElement>(null);
  const optionList = useRef<HTMLDivElement>(null);
  // A decision belongs to a running operation. Once the operation has ended the
  // options are not offered, whatever the engine left behind.
  // Expert operations withhold every read, this one included.
  const standing = game && game.mode !== "expert" ? getHypothesisStanding(game) : null;
  // The standing is computed from the operation as it is now, so it belongs only
  // on the latest turn's report, not on an earlier one reopened from the log.
  const settled = !!report && !!game && report.number === game.turns.length && report.success && (!report.revealed || report.windfall) && !report.injectReveal && !!game.hypothesis;
  const decision = game?.status === "playing" ? session.decision : null;
  const awaitingDecision = !!decision && !!game?.pendingDecision;
  const injectBox = report?.inject && <div className="inject-box"><span className="eyebrow">{rich("captainReportDialog.injectSpanSpan", { reason: say(report.inject.reason) }, { span: chunk => <span className="separator">{chunk}</span> })}</span><h3>{injectCard(report.inject.id).title}</h3><p>{injectCard(report.inject.id).text}</p><strong>{report.inject.effectLabel ? say(report.inject.effectLabel) : injectCard(report.inject.id).effectLabel}</strong></div>;

  return (
    <Dialog open={!!report} onOpenChange={open => { if (!open) dismissReport(); }}>
      <DialogContent
        ref={content}
        className="game-dialog paper-dialog report-dialog"
        showCloseButton={!awaitingDecision}
        onEscapeKeyDown={event => { if (awaitingDecision) event.preventDefault(); }}
        // With a decision pending there is no close button, so the first tabbable
        // control is a decision option. Focus the report itself so Space or Enter,
        // pressed to read, cannot commit a command choice.
        onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus(); }}
        onCloseAutoFocus={returnFocusToAwaiting}
      >
        <DialogHeader>
          <div className="eyebrow">{rich("captainReportDialog.formBc2012", {  }, { span: chunk => <span className="separator">{chunk}</span> })}</div>
          <DialogTitle>{lostHere ? (game?.status === "exercise" ? t("captainReportDialog.theOperationStood") : t("captainReportDialog.theOperationIs")) : report?.revealed ? (report.windfall ? t("captainReportDialog.aLaterStage") : t("captainReportDialog.evidenceConfirmed")) : report?.injectReveal ? t("captainReportDialog.aPartnerDisclosed") : report?.success ? t("captainReportDialog.theCheckCame") : t("captainReportDialog.theActionWas")}</DialogTitle>
          <DialogDescription className="sr-only">{report && game && procedureById(game, report.procedure)?.title}</DialogDescription>
          {/* The report's header is a row of form fields, the result among them,
              not a rotated rubber stamp: a stamp had become a stock case-file
              ornament. */}
          {report && game && <dl className="form-row report-fields">
            <div><dt>{t("captainReportDialog.turn")}</dt><dd>{report.number}</dd></div>
            <div><dt>{t("captainReportDialog.source")}</dt><dd>{procedureById(game, report.procedure)?.title}</dd></div>
            <div><dt>{t("captainReportDialog.result")}</dt><dd className={lostHere ? "failed" : report.revealed || report.injectReveal ? "confirmed" : report.success ? "" : "failed"}>{lostHere ? (game.status === "exercise" ? t("captainReportDialog.stoodDown") : t("captainReportDialog.operationLost")) : report.revealed || report.injectReveal ? t("captainReportDialog.stageConfirmed") : report.success ? t("captainReportDialog.noStageFound") : t("captainReportDialog.checkFailed")}</dd></div>
          </dl>}
        </DialogHeader>
        {report && game && <>
          {/* The turn that ends an operation is still reported as a turn, so its
              headline can be good news on a lost operation. Say how it ended first. */}
          {ended && report.number === game.turns.length && game.status !== "won" && (
            <div className={`report-ending ending-${game.status}`} role="status">
              <span className="eyebrow">{game.status === "exercise" ? t("captainReportDialog.exerciseConcluded") : t("captainReportDialog.operationLost")}</span>
              <strong>{game.status === "exercise" ? t("captainReportDialog.theControllerStood") : `${say(getLossReason(game).title)}.`}</strong>
              {game.status === "lost" && <p>{say(getLossReason(game).detail)}</p>}
            </div>
          )}
          <div className={`report-layout ${report.inject || decision ? "with-briefing" : "single"}`}>
            <section className="report-summary" aria-label={t("captainReportDialog.procedureResult")}>
              <div className={`result-roll ${report.success ? "success" : "failure"}`}>
                <span className="result-die">{report.raw}</span>
                <div><span>{t("captainReportDialog.rolledOnThe", { raw: report.raw })}{report.modifier >= 0 ? "+" : "−"} {t("captainReportDialog.modifier2", { modifier: Math.abs(report.modifier), rollParts: rollParts(t, report, locale) })}</span><strong>{report.total} <span>{t("captainReportDialog.needed2", { threshold: config.threshold })}{report.success ? t("captainReportDialog.aSuccess") : t("captainReportDialog.aFailure")}</span></strong></div>
              </div>
              {/* The plan and the turn's movement are told apart: a playtest read
                  "Focused: impact unchanged" in the sheet, then a rise here, as the
                  game going back on its word. The reason says what moved them. */}
              <p className="turn-plan">{t("captainReportDialog.planScopeAnalysis", { procedureScopesTitle: procedureScopes[report.plan.scope].title.toLowerCase(), procedureIntensitiesTitle: procedureIntensities[report.plan.intensity].title.toLowerCase() })}</p>
              <div className="turn-movement"><b>{t("captainReportDialog.thisTurn")}</b><EffectList items={[meterEffect(game, "impact", report.impactChange), meterEffect(game, "continuity", report.continuityChange), meterEffect(game, "sector", report.sectorChange), meterEffect(game, "objective", report.objectiveChange)]} /><p>{report.revealed
                ? t("captainReportDialog.findingTheStage")
                : report.success
                  ? t("captainReportDialog.theCheckCompleted")
                  : report.planningBonus > 0
                    ? t("captainReportDialog.theCheckFailed2", { change: `${report.objectiveChange >= 0 ? "+" : "−"}${Math.abs(report.objectiveChange)}` })
                    : t("captainReportDialog.theCheckFailed")}{injectImpact(report) ? t("captainReportDialog.theInjectBelow", { change: `${injectImpact(report) > 0 ? "+" : "−"}${Math.abs(injectImpact(report))}` }) : ""}{report.adversaryEvent ? t("captainReportDialog.theSituationAlso") : ""}</p></div>
              <p className="report-narrative"><Glossed text={say(report.narrative)} /></p>
              {report.revealed && <div className="discovery"><div><span>{stages[attacks.find(attack => attack.id === report.revealed)!.stage].short}: {stages[attacks.find(attack => attack.id === report.revealed)!.stage].name}</span><strong>{attacks.find(attack => attack.id === report.revealed)?.title}</strong><small>{t("captainReportDialog.onTheRoute", { title: hypotheses.find(item => item.id === attacks.find(attack => attack.id === report.revealed)!.vector)!.title.toLowerCase() })}</small>{!report.windfall && report.hypothesis && attacks.find(attack => attack.id === report.revealed)!.vector !== report.hypothesis && <small className="windfall-note">{t("captainReportDialog.yourReadingWas2", { title: hypotheses.find(item => item.id === report.hypothesis)!.title.toLowerCase() })}</small>}{report.windfall && report.hypothesisTarget && <small className="windfall-note">{t("captainReportDialog.thisIsStage2", { stage: attacks.find(attack => attack.id === report.revealed)!.stage + 1, stage2: attacks.find(attack => attack.id === report.hypothesisTarget)!.stage + 1 })}</small>}</div></div>}
              {/* A completed check that finds nothing rules out every technique its
                  source could have seen, whichever reading it was run under, and this
                  is where the player is looking when it lands. A failed roll settles
                  nothing, so it does not get this block — saying otherwise would
                  teach the wrong inference. */}
              {settled && standing && (
                <div className={`report-standing level-${standing.level}`}>
                  <span className="eyebrow">{t("captainReportDialog.whereTheReading")}</span>
                  <strong>{say(standing.label)}</strong>
                  <p>{say(standing.detail)}</p>
                </div>
              )}
              {/* Once a response is chosen, the report says what it did there and
                  then rather than leaving it all to the debrief. */}
              {!decision && game.decisions.filter(item => item.stage === report.revealed || item.stage === report.injectReveal).map(item => (
                <div key={item.stage} className="decision-recorded" role="status">
                  <span className="eyebrow">{t("captainReportDialog.responseRecorded")}</span>
                  <strong>{say(item.title)}</strong>
                  <p>{say(item.effect)}</p>
                  <EffectList items={[meterEffect(game, "impact", item.impactChange), meterEffect(game, "continuity", item.continuityChange), meterEffect(game, "sector", item.sectorChange), meterEffect(game, "objective", item.objectiveChange), report.number === game.turns.length && game.nextModifierSources.some(item => ("key" in item.source && item.source.key === "engine.source.decision") || !!legacyText(item.source)?.startsWith("Evidence decision")) && { kind: "roll", which: "next", amount: game.nextModifier, cap: null, carried: game.nextModifierSources.length > 1 }]} />
                  <p>{t("captainReportDialog.howWellIt")}</p>
                </div>
              ))}
              {report.adversaryEvent && <div className="adversary-event"><Siren size={20} /><div><span className="eyebrow">{t("captainReportDialog.situationEscalates")}</span><p>{say(report.adversaryEvent)}</p></div></div>}
              {/* With a decision waiting, the inject joins the result: beside four
                  options it pushed the last one under the fold and left this
                  column half empty. */}
              {decision && injectBox}
            </section>
            {(report.inject || decision) && <section className="report-briefing" aria-label={t("captainReportDialog.operationalUpdate")}>
              {!decision && injectBox}
              {decision && (
                <div className="evidence-decision">
                  <span className="eyebrow">{t("captainReportDialog.operationalDecisionRequired")}</span>
                  {/* The count says how many there are: the last of five sat below the fold
                      of a laptop screen with nothing saying it was there. */}
                  <h3>{t("captainReportDialog.chooseOneOf2", { attackTitle: decision.attack.title })}{["no", "one", "two", "three", "four", "five", "six"][decision.options.length] ?? decision.options.length}{t("captainReportDialog.commandResponses")}</h3>
                  {/* A newcomer meets five verbs described in costs they cannot yet
                      weigh. On a Training operation's first decision, one tap says
                      what each trades away, keyed to the icons on the options. */}
                  {game.difficulty === "training" && game.mode !== "expert" && game.decisions.length === 0 && (
                    <details className="decision-primer">
                      <summary>{t("captainReportDialog.howTheseResponses")}</summary>
                      {/* In the options' own words: "Watch" and "Act" here beside
                          buttons titled "Trace" and "Revoke" read as two lists. */}
                      <ul>
                        {/* Keyed to the options' letters, as the four readings are lettered. */}
                        {decision.options.map((option, index) => <li key={option.id}><b className="option-letter" aria-hidden="true">{"ABCDEFG"[index]}</b><span><b>{option.title}</b> {t(primerTrade[option.id])}</span></li>)}
                      </ul>
                      <p>{t("captainReportDialog.noSingleAnswer")}</p>
                    </details>
                  )}
                  {/* At every difficulty but Expert: the review grades every decision by this,
                      and an Operational playtest was graded on a rule it was never shown. */}
                  {game.mode !== "expert" && (
                    <p className="decision-pressure">{t("captainReportDialog.pressureNowBusiness2", { impact: game.impact, objectiveProgress: game.objectiveProgress, getAdversaryState: say(withForm(getAdversaryState(game), "lower")) })}{game.impact >= 55 ? t("captainReportDialog.highImpact", { impact: game.impact, act: optionTitle(decision.options, "act"), contain: optionTitle(decision.options, "contain") }) : game.adversaryTempo >= 2 ? t("captainReportDialog.highPace", { pace: say(withForm(getAdversaryState(game), "lower")), progress: game.objectiveProgress, act: optionTitle(decision.options, "act"), contain: optionTitle(decision.options, "contain") }) : t("captainReportDialog.lowPressure", { observe: optionTitle(decision.options, "observe"), attribute: optionTitle(decision.options, "attribute") })}</p>
                  )}
                  <div ref={optionList}>
                    {/* Lettered ruled entries on the report, like the readings: the
                        letter in the margin, what the response does, its three
                        signals one a line, and its exact effect. Tinted cards with an
                        icon each were cards inside the paper. */}
                    {decision.options.map((option, index) => (
                      <button key={option.id} onClick={() => decide(option.id)}>
                        <b className="option-letter" aria-hidden="true">{"ABCDEFG"[index]}</b>
                        <strong>{option.title}</strong>
                        <span>{option.description}<span className="option-signals"><span>{say(option.evidence)}</span><span>{say(option.risk)}</span><span>{say(option.service)}</span></span><EffectList className="decision-effect" items={previewDecision(game, option.id) ?? []} /></span>
                      </button>
                    ))}
                  </div>
                  <OptionsBelow key={decision.attack.id} list={optionList} />
                </div>
              )}
            </section>}
          </div>
          {awaitingDecision ? <p className="report-gate" role="status">{t("captainReportDialog.resolveTheOperational")}</p> : <button className="primary-button full" onClick={dismissReport}>{game.status === "response" ? t("captainReportDialog.enterResponsePhase") : ended ? t("captainReportDialog.openDebrief") : t("captainReportDialog.continueInvestigation")}</button>}
        </>}
      </DialogContent>
    </Dialog>
  );
}

// The exact effect of a response, read from the transition itself so the line
// and the outcome are one computation, as sector decisions, command events and
// map actions state theirs. Five options in words alone, then a number in the
// report, read to every playtest as a hidden cost.
function previewDecision(game: Game, choice: DecisionChoice) {
  try {
    const next = resolveDecision(game, choice);
    return [
      meterEffect(game, "impact", next.impact - game.impact),
      meterEffect(game, "continuity", next.continuity - game.continuity),
      meterEffect(game, "sector", next.sectorHealth - game.sectorHealth),
      meterEffect(game, "objective", next.objectiveProgress - game.objectiveProgress),
      rollEffect(game.nextModifier, decisionRollShift[choice]),
    ];
  } catch {
    return null;
  }
}

// What each response verb buys and what it costs, in one clause each.
const primerTrade: Record<DecisionChoice, MessageKey> = {
  observe: "captainReportDialog.buildsEvidenceThe",
  act: "captainReportDialog.cutsExposureNow",
  attribute: "captainReportDialog.learnsWhoIs",
  contain: "captainReportDialog.restrictsThePath",
  notify: "captainReportDialog.alignsLeadersAnd",
};

// Five responses do not fit beside the result on a laptop screen, and the
// report scrolls with nothing saying more are below. While the last one is out
// of view, a cue pinned to the foot of the report says so and brings it in.
function OptionsBelow({ list }: { list: RefObject<HTMLDivElement | null> }) {
  const { t } = useMessages();
  const [hidden, setHidden] = useState(0);
  useEffect(() => {
    const scroller = list.current?.closest<HTMLElement>("[role=dialog]");
    if (!scroller) return;
    // Counted against the report's own edge: an option scrolled away above is
    // not one waiting below.
    const count = () => {
      const edge = scroller.getBoundingClientRect().bottom;
      setHidden([...(list.current?.children ?? [])].filter(option => option.getBoundingClientRect().bottom > edge + 1).length);
    };
    // Once now, and again after the dialog's opening animation has settled.
    const frame = requestAnimationFrame(count);
    const settled = window.setTimeout(count, 320);
    scroller.addEventListener("scroll", count, { passive: true });
    window.addEventListener("resize", count);
    // Opening "How these responses differ" pushes the options down without a
    // scroll or a resize; the panel changing size is what says so.
    const panel = list.current?.parentElement;
    const resized = panel && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => count()) : null;
    if (panel) resized?.observe(panel);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
      scroller.removeEventListener("scroll", count);
      window.removeEventListener("resize", count);
      resized?.disconnect();
    };
  }, [list]);
  if (!hidden) return null;
  const reveal = () => {
    const last = list.current?.lastElementChild;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    last?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
  };
  return <button type="button" className="options-below" onClick={reveal}><span>{hidden === 1 ? t("captainReportDialog.oneMoreResponse") : t("captainReportDialog.moreResponsesBelow", { hidden })}</span></button>;
}
