import { evidenceArtFor, StoryArt } from "./story-art";
import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import { Siren } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { attacks, availableIn, decisionRollShift, describePart, injectCard, hypotheses, getHypothesisStanding, getLossReason, procedureIntensities, procedureScopes, procedureById, proceduresFor, sourceSeesReading, getAdversaryState, resolveDecision, stages, type DecisionChoice, type Game, meterEffect, rollEffect } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { Glossed } from "@/components/game/glossed";
import { EffectList } from "@/components/game/effect-list";
import { useMessages, type Translate } from "@/hooks/use-messages";
import { captainReportDialogMessages } from "@/lib/i18n/en/captain-report-dialog";
import { register, type Locale, type MessageKey } from "@/lib/i18n";
import { legacyText, say as sayIn, withForm } from "@/lib/i18n/message";
import type { CaptainVoiceCue } from "@/lib/captain-voice";
import { CaptainVoice } from "./captain-voice-lazy";
import { EvidenceAssessment, SignalGuide } from "./evidence-assessment";

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
  const voiceCue: CaptainVoiceCue | { game: Game; turn: Game["turns"][number]; reaction: boolean } | null = report && game
    ? ended ? game.status as "won" | "lost" | "exercise" : { game, turn: report, reaction: session.voiceDecision.current > 0 && session.voiceDecision.current === game.decisions.length }
    : null;
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
  const testedStage = report?.hypothesisTarget ? attacks.find(attack => attack.id === report.hypothesisTarget)?.stage : undefined;
  const foundStages = [...new Set([report?.revealed, report?.injectReveal]
    .map(id => id ? attacks.find(attack => attack.id === id)?.stage : undefined)
    .filter((stage): stage is number => stage !== undefined))];
  const canReviewSources = !!game && !!report && !report.success && report.number === game.turns.length && game.status === "playing" && game.mode !== "expert" && !!game.hypothesis && !game.pendingDecision && !game.pendingCommand && !game.pendingSetPiece;
  const availableSources = game && canReviewSources ? proceduresFor(game).filter(procedure => availableIn(game, procedure.id) === 0 && sourceSeesReading(game, procedure.id) === true) : [];
  const injectBox = report?.inject && <div className="inject-box"><span className="eyebrow">{rich("captainReportDialog.injectSpanSpan", { reason: say(report.inject.reason) }, { span: chunk => <span className="separator">{chunk}</span> })}</span><h3>{injectCard(report.inject.id).title}</h3><p>{injectCard(report.inject.id).text}</p><strong>{report.inject.effectLabel ? say(report.inject.effectLabel) : injectCard(report.inject.id).effectLabel}</strong></div>;

  return (
    <Dialog open={!!report} onOpenChange={open => { if (!open) dismissReport(); }}>
      <DialogContent
        ref={content}
        fadeOnly
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
            {testedStage !== undefined && <div className="report-stage-fact"><dt>{t("captainReportDialog.stageTested")}</dt><dd>{t("captainReportDialog.stageNumber", { number: testedStage + 1, title: stages[testedStage].name })}</dd></div>}
            <div className="report-stage-fact"><dt>{t("captainReportDialog.stagesFound")}</dt><dd>{foundStages.length ? foundStages.map(stage => t("captainReportDialog.stageNumber", { number: stage + 1, title: stages[stage].name })).join("; ") : t("captainReportDialog.noStageFound")}</dd></div>
          </dl>}
        </DialogHeader>
        {report && game && <>
          {report.revealed && <ConfirmedFinding report={report} scenario={game.scenario} />}
          {!decision && <p className="report-next"><strong>{t("captainReportDialog.next")}</strong> {game.status === "response" ? t("captainReportDialog.nextResponse") : ended ? t("captainReportDialog.nextDebrief") : game.pendingCommand || game.pendingSetPiece ? t("captainReportDialog.nextCommand") : t("captainReportDialog.nextInvestigation")}</p>}
          {decision && <nav className="report-response-index" aria-label={t("captainReportDialog.findResponse")}>
            <p className="eyebrow">{t("captainReportDialog.readResponses", { count: decision.options.length })}</p>
            <ol>{decision.options.map((option, index) => <li key={option.id}><a href={`#report-response-${option.id}`} onClick={event => {
              event.preventDefault();
              const target = optionList.current?.querySelector<HTMLButtonElement>(`button[data-response="${option.id}"]`);
              target?.focus({ preventScroll: true });
              target?.scrollIntoView({ block: "nearest", behavior: "auto" });
            }}>{t("captainReportDialog.responseIndexEntry", { letter: "ABCDEFG"[index], title: option.title })}</a></li>)}</ol>
          </nav>}
          {!report.success && <p className="report-inconclusive" role="status">{t("captainReportDialog.failedSettlesNothing")}</p>}
          {canReviewSources && <section className="report-available-sources" aria-label={t("captainReportDialog.availableSources")}>
            <h3>{t("captainReportDialog.availableSources")}</h3>
            {availableSources.length ? <><p>{t("captainReportDialog.sourcesCanTest")}</p><ul>{availableSources.map(procedure => <li key={procedure.id}>{procedure.title}</li>)}</ul></> : <p>{t("captainReportDialog.sourcesUnavailable")}</p>}
          </section>}
          {/* The turn that ends an operation is still reported as a turn, so its
              headline can be good news on a lost operation. Say how it ended first. */}
          {ended && report.number === game.turns.length && game.status !== "won" && (
            <div className={`report-ending ending-${game.status}`} role="status">
              <span className="eyebrow">{game.status === "exercise" ? t("captainReportDialog.exerciseConcluded") : t("captainReportDialog.operationLost")}</span>
              <strong>{game.status === "exercise" ? t("captainReportDialog.theControllerStood") : `${say(getLossReason(game).title)}.`}</strong>
              {game.status === "lost" && <p>{say(getLossReason(game).detail)}</p>}
            </div>
          )}
              {/* Once a response is chosen, the report says what it did there and
                  then rather than leaving it all to the debrief. */}
              {!decision && game.decisions.filter(item => item.stage === report.revealed || item.stage === report.injectReveal).map(item => (
                <div key={item.stage} className="decision-recorded" role="status">
                  <span className="eyebrow">{t("captainReportDialog.responseRecorded")}</span>
                  <strong>{say(item.title)}</strong>
                  <p>{t("captainReportDialog.actualChanges", { changes: ([
                    [item.impactChange, "captainReportDialog.impactEased", "captainReportDialog.impactRose"],
                    [item.continuityChange, "captainReportDialog.serviceFell", "captainReportDialog.serviceImproved"],
                    [item.sectorChange, "captainReportDialog.marginFell", "captainReportDialog.marginImproved"],
                    [item.objectiveChange, "captainReportDialog.progressSlowed", "captainReportDialog.progressAdvanced"],
                  ] as const).filter(([change]) => change !== 0).map(([change, down, up]) => t(change < 0 ? down : up)).join("; ") || t("captainReportDialog.metersUnchanged") })}</p>
                  <EffectList items={[meterEffect(game, "impact", item.impactChange), meterEffect(game, "continuity", item.continuityChange), meterEffect(game, "sector", item.sectorChange), meterEffect(game, "objective", item.objectiveChange), report.number === game.turns.length && game.nextModifierSources.some(item => ("key" in item.source && item.source.key === "engine.source.decision") || !!legacyText(item.source)?.startsWith("Evidence decision")) && { kind: "roll", which: "next", amount: game.nextModifier, cap: null, carried: game.nextModifierSources.length > 1 }]} />
                  <details className="decision-primer"><summary>{t("captainReportDialog.whyThisResponse")}</summary><p>{say(item.effect)}</p><p>{t("captainReportDialog.howWellIt")}</p></details>
                </div>
              ))}
          <div className={`report-layout ${report.inject || decision ? "with-briefing" : "single"}`}>
            <section className="report-summary" aria-label={t("captainReportDialog.procedureResult")}>
              <p className="report-narrative"><Glossed text={say(report.narrative)} /></p>
              {!decision && report.success && game.evidence.filter(item => item.turn === report.number && !item.supports).map(item => <EvidenceAssessment key={item.id} game={game} item={item} compact />)}
              {!decision && report.success && !report.revealed && !report.injectReveal && game.difficulty === "training" && game.mode !== "expert" && game.evidence[0]?.turn === report.number && <SignalGuide />}
              {voiceCue && !session.botRun && <CaptainVoice cue={voiceCue} decisionPending={awaitingDecision} enabled={session.voiceEnabled && !session.settings && !session.rules && !session.debrief && !session.newConfirm} history={session.voiceHistory} />}
              <div className="turn-movement"><b>{t("captainReportDialog.thisTurn")}</b><EffectList items={[meterEffect(game, "impact", report.impactChange), meterEffect(game, "continuity", report.continuityChange), meterEffect(game, "sector", report.sectorChange), meterEffect(game, "objective", report.objectiveChange)]} /><p>{report.revealed
                ? t("captainReportDialog.findingTheStage")
                : report.success
                  ? t("captainReportDialog.theCheckCompleted")
                  : report.planningBonus > 0
                    ? t("captainReportDialog.theCheckFailed2", { change: `${report.objectiveChange >= 0 ? "+" : "−"}${Math.abs(report.objectiveChange)}` })
                    : t("captainReportDialog.theCheckFailed")}{injectImpact(report) ? t("captainReportDialog.theInjectBelow", { change: `${injectImpact(report) > 0 ? "+" : "−"}${Math.abs(injectImpact(report))}` }) : ""}{report.adversaryEvent ? t("captainReportDialog.theSituationAlso") : ""}</p></div>
              <details key={report.number} className="report-collection-details">
                <summary>{t("captainReportDialog.collectionDetails")}</summary>
              <div className={`result-roll ${report.success ? "success" : "failure"}`}>
                <span className="result-die">{report.raw}</span>
                <div><span>{t("captainReportDialog.rolledOnThe", { raw: report.raw })}{report.modifier >= 0 ? "+" : "−"} {t("captainReportDialog.modifier2", { modifier: Math.abs(report.modifier), rollParts: rollParts(t, report, locale) })}</span><strong>{report.total} <span>{t("captainReportDialog.needed2", { threshold: config.threshold })}{report.success ? t("captainReportDialog.aSuccess") : t("captainReportDialog.aFailure")}</span></strong></div>
              </div>
              {/* The plan and the turn's movement are told apart: a playtest read
                  "Focused: impact unchanged" in the sheet, then a rise here, as the
                  game going back on its word. The reason says what moved them. */}
              <p className="turn-plan">{t("captainReportDialog.planScopeAnalysis", { procedureScopesTitle: procedureScopes[report.plan.scope].title.toLowerCase(), procedureIntensitiesTitle: procedureIntensities[report.plan.intensity].title.toLowerCase() })}</p>
              </details>
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
                  {game.evidence.filter(item => item.supports === game.pendingDecision).map(item => <EvidenceAssessment key={item.id} game={game} item={item} compact />)}
                  {game.difficulty === "training" && game.mode !== "expert" && game.decisions.length === 0 && <SignalGuide />}
                  {/* The count says how many there are: the last of five sat below the fold
                      of a laptop screen with nothing saying it was there. */}
                  <h3>{t("captainReportDialog.chooseOneOf2", { attackTitle: decision.attack.title })}{["no", "one", "two", "three", "four", "five", "six"][decision.options.length] ?? decision.options.length}{t("captainReportDialog.commandResponses")}</h3>
                  {/* At every difficulty but Expert: the review grades every decision by this,
                      and an Operational playtest was graded on a rule it was never shown. */}
                  {game.mode !== "expert" && (
                    <p className="decision-pressure">{t("captainReportDialog.pressureNowBusiness2", { impact: game.impact, objectiveProgress: game.objectiveProgress, getAdversaryState: say(withForm(getAdversaryState(game), "lower")) })}{game.impact >= 55 ? t("captainReportDialog.highImpact", { impact: game.impact, act: optionTitle(decision.options, "act"), contain: optionTitle(decision.options, "contain") }) : game.adversaryTempo >= 2 ? t("captainReportDialog.highPace", { pace: say(withForm(getAdversaryState(game), "lower")), progress: game.objectiveProgress, act: optionTitle(decision.options, "act"), contain: optionTitle(decision.options, "contain") }) : t("captainReportDialog.lowPressure", { observe: optionTitle(decision.options, "observe"), attribute: optionTitle(decision.options, "attribute") })}</p>
                  )}
                  <div ref={optionList}>
                    {/* Lettered ruled entries on the report, like the readings: the
                        letter in the margin, the short tradeoff and exact effects.
                        Rationale is a sibling disclosure, never inside a button. */}
                    {decision.options.map((option, index) => (
                      <Fragment key={option.id}>
                      <button id={`report-response-${option.id}`} data-response={option.id} onClick={() => decide(option.id)}>
                        <b className="option-letter" aria-hidden="true">{"ABCDEFG"[index]}</b>
                        <strong>{option.title}</strong>
                        <span>{t(primerTrade[option.id])}<EffectList compare className="decision-effect" items={previewDecision(game, option.id) ?? []} /><small><b>{t("captainReportDialog.uncertainty")}</b> {say(option.risk)}</small></span>
                      </button>
                      <details className="choice-rationale decision-primer"><summary>{t("captainReportDialog.whyChoose", { title: option.title })}</summary><p>{option.description}</p><p className="option-signals"><span>{say(option.evidence)}</span><span>{say(option.service)}</span></p></details>
                      </Fragment>
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

// Lead with the finding already disclosed by this report, before the response
// index. Resolve public identifiers once; no unrevealed route selects art.
function ConfirmedFinding({ report, scenario }: { report: Game["turns"][number]; scenario: Game["scenario"] }) {
  const { t } = useMessages();
  const attack = attacks.find(item => item.id === report.revealed);
  if (!attack) return null;
  const route = hypotheses.find(item => item.id === attack.vector)!;
  const tested = attacks.find(item => item.id === report.hypothesisTarget);
  return <div className="discovery">
    <StoryArt kind="findings" name={evidenceArtFor(report.procedure, scenario)} />
    <div>
      <span>{stages[attack.stage].short}: {stages[attack.stage].name}</span>
      <h3>{attack.title}</h3>
      <small>{t("captainReportDialog.onTheRoute", { title: route.title.toLowerCase() })}</small>
      {!report.windfall && report.hypothesis && attack.vector !== report.hypothesis && <small className="windfall-note">{t("captainReportDialog.yourReadingWas2", { title: hypotheses.find(item => item.id === report.hypothesis)!.title.toLowerCase() })}</small>}
      {report.windfall && tested && <small className="windfall-note">{t("captainReportDialog.thisIsStage2", { stage: attack.stage + 1, stage2: tested.stage + 1 })}</small>}
    </div>
  </div>;
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
      setHidden([...(list.current?.querySelectorAll("button[data-response]") ?? [])].filter(option => option.getBoundingClientRect().bottom > edge + 1).length);
    };
    // Once now, and again after the dialog's opening animation has settled.
    const frame = requestAnimationFrame(count);
    const settled = window.setTimeout(count, 320);
    scroller.addEventListener("scroll", count, { passive: true });
    scroller.addEventListener("toggle", count, true);
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
      scroller.removeEventListener("toggle", count, true);
      window.removeEventListener("resize", count);
      resized?.disconnect();
    };
  }, [list]);
  if (!hidden) return null;
  const reveal = () => {
    const last = list.current?.querySelector<HTMLButtonElement>("button[data-response]:last-of-type");
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (last instanceof HTMLElement) last.focus({ preventScroll: true });
    last?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
  };
  return <button type="button" className="options-below" onClick={reveal}><span>{hidden === 1 ? t("captainReportDialog.oneMoreResponse") : t("captainReportDialog.moreResponsesBelow", { hidden })}</span></button>;
}
