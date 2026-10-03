import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowDown, ArrowRight, BrainCircuit, CheckCheck, CircleSlash, Eye, MessagesSquare, Shield, ShieldCheck, Siren } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { attacks, describeMeterChange, hypotheses, getHypothesisStanding, getLossReason, procedureIntensities, procedureScopes, procedureById, getAdversaryState, resolveDecision, stages, type DecisionChoice, type Game } from "@/lib/advanced-game";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { Glossed } from "@/components/game/glossed";

export function CaptainReportDialog({ session }: { session: GameSession }) {
  const { report, game, ended, config, dismissReport, decide } = session;
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
  const injectBox = report?.inject && <div className="inject-box"><span className="eyebrow">INJECT <span className="separator">/</span> {report.inject.reason}</span><h3>{report.inject.title}</h3><p>{report.inject.text}</p><strong>{report.inject.effectLabel}</strong></div>;

  return (
    <Dialog open={!!report} onOpenChange={open => { if (!open) dismissReport(); }}>
      <DialogContent
        ref={content}
        className="game-dialog report-dialog"
        showCloseButton={!awaitingDecision}
        onEscapeKeyDown={event => { if (awaitingDecision) event.preventDefault(); }}
        // With a decision pending there is no close button, so the first tabbable
        // control is a decision option. Focus the report itself so Space or Enter,
        // pressed to read, cannot commit a command choice.
        onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus(); }}
        onCloseAutoFocus={returnFocusToAwaiting}
      >
        <DialogHeader>
          <div className="eyebrow">CAPTAIN’S REPORT <span className="separator">/</span> TURN {report?.number}</div>
          <DialogTitle>{report?.revealed ? (report.windfall ? "A later stage was found." : "Evidence confirmed.") : report?.injectReveal ? "A partner disclosed a stage." : report?.success ? "No new attack identified." : "The action was unsuccessful."}</DialogTitle>
          <DialogDescription>{report && game && procedureById(game, report.procedure)?.title}</DialogDescription>
        </DialogHeader>
        {report && game && <>
          {/* The turn that ends an operation is still reported as a turn, so its
              headline can be good news on a lost operation. Say how it ended first. */}
          {ended && report.number === game.turns.length && game.status !== "won" && (
            <div className={`report-ending ending-${game.status}`} role="status">
              <span className="eyebrow">{game.status === "exercise" ? "EXERCISE CONCLUDED" : "OPERATION LOST"}</span>
              <strong>{game.status === "exercise" ? "The controller stood the operation down as an authorised exercise." : `${getLossReason(game).title}.`}</strong>
              {game.status === "lost" && <p>{getLossReason(game).detail}</p>}
            </div>
          )}
          <div className={`report-layout ${report.inject || decision ? "with-briefing" : "single"}`}>
            <section className="report-summary" aria-label="Procedure result">
              <div className={`result-roll ${report.success ? "success" : "failure"}`}>
                <span className="result-die">{report.raw}</span>
                <div><span>Rolled {report.raw} on the d20 {report.modifier >= 0 ? "+" : "−"} {Math.abs(report.modifier)} modifier{report.planningBonus > 0 || report.specialistBonus > 0 ? ` (${[report.planningBonus > 0 ? `own source +${report.planningBonus}` : "", report.specialistBonus > 0 ? `specialist +${report.specialistBonus}` : "", report.modifier - report.planningBonus - report.specialistBonus ? `other parts ${report.modifier - report.planningBonus - report.specialistBonus > 0 ? "+" : "−"}${Math.abs(report.modifier - report.planningBonus - report.specialistBonus)}` : ""].filter(Boolean).join(", ")})` : ""}</span><strong>{report.total} <span>/ {config.threshold} needed · {report.success ? "Success" : "Failure"}</span></strong></div>
                {report.success ? <CheckCheck size={23} aria-hidden="true" /> : <CircleSlash size={23} aria-hidden="true" />}
              </div>
              {/* The plan and the turn's movement are told apart: a playtest read
                  "Focused: impact unchanged" in the sheet, then a rise here, as the
                  game going back on its word. The reason says what moved them. */}
              <div className="turn-effects"><span>{procedureScopes[report.plan.scope].title} scope</span><span>{procedureIntensities[report.plan.intensity].title} analysis</span></div>
              <p className="turn-movement"><b>This turn:</b> {describeMeterChange(game, "impact", report.impactChange)} · {describeMeterChange(game, "continuity", report.continuityChange)} · {describeMeterChange(game, "sector", report.sectorChange)} · {describeMeterChange(game, "objective", report.objectiveChange)}. <span>{report.revealed
                ? "Finding the stage slowed the adversary's gain, though the turn still gave it time."
                : report.success
                  ? "The check completed and found no stage, which rules out what this source could see at this stage; the adversary used the time."
                  : report.planningBonus > 0
                    ? "The check failed, so it settled nothing. Because it was one of your reading's own sources, it carried no extra penalty, but a turn that finds nothing still lets adversary progress rise by its usual amount, raises business impact more than a success and wears the sector margin."
                    : "The check failed, so it settled nothing and gave the adversary the most time."}{report.adversaryEvent ? " The situation also escalated, below, which adds business impact and costs service." : ""}</span></p>
              <p className="report-narrative"><Glossed text={report.narrative} /></p>
              {report.revealed && <div className="discovery"><ShieldCheck size={22} /><div><span>{stages[attacks.find(attack => attack.id === report.revealed)!.stage].short} · {stages[attacks.find(attack => attack.id === report.revealed)!.stage].name}</span><strong>{attacks.find(attack => attack.id === report.revealed)?.title}</strong><small>On the {hypotheses.find(item => item.id === attacks.find(attack => attack.id === report.revealed)!.vector)!.title.toLowerCase()} route</small>{!report.windfall && report.hypothesis && attacks.find(attack => attack.id === report.revealed)!.vector !== report.hypothesis && <small className="windfall-note">Your reading was {hypotheses.find(item => item.id === report.hypothesis)!.title.toLowerCase()}, so the stage was found but the route was not predicted.</small>}{report.windfall && report.hypothesisTarget && <small className="windfall-note">This is stage {attacks.find(attack => attack.id === report.revealed)!.stage + 1}, further along the chain. The stage you were testing, stage {attacks.find(attack => attack.id === report.hypothesisTarget)!.stage + 1}, is still open, and a find here says nothing about the route it used.</small>}</div></div>}
              {/* A completed check that finds nothing rules out every technique its
                  source could have seen, whichever reading it was run under, and this
                  is where the player is looking when it lands. A failed roll settles
                  nothing, so it does not get this block — saying otherwise would
                  teach the wrong inference. */}
              {settled && standing && (
                <div className={`report-standing level-${standing.level}`}>
                  <span className="eyebrow">WHERE THE READING STANDS NOW</span>
                  <strong>{standing.label}</strong>
                  <p>{standing.detail}</p>
                </div>
              )}
              {/* Once a response is chosen, the report says what it did there and
                  then rather than leaving it all to the debrief. */}
              {!decision && game.decisions.filter(item => item.stage === report.revealed || item.stage === report.injectReveal).map(item => (
                <div key={item.stage} className="decision-recorded" role="status">
                  <span className="eyebrow">RESPONSE RECORDED</span>
                  <strong>{item.title}</strong>
                  <p>{item.effect} {describeMeterChange(game, "impact", item.impactChange)} · {describeMeterChange(game, "continuity", item.continuityChange)} · {describeMeterChange(game, "sector", item.sectorChange)} · {describeMeterChange(game, "objective", item.objectiveChange)}. How well it fitted the moment is judged in the review.</p>
                </div>
              ))}
              {report.adversaryEvent && <div className="adversary-event"><Siren size={20} /><div><span className="eyebrow">SITUATION ESCALATES</span><p>{report.adversaryEvent}</p></div></div>}
              {/* With a decision waiting, the inject joins the result: beside four
                  options it pushed the last one under the fold and left this
                  column half empty. */}
              {decision && injectBox}
            </section>
            {(report.inject || decision) && <section className="report-briefing" aria-label="Operational update">
              {!decision && injectBox}
              {decision && (
                <div className="evidence-decision">
                  <span className="eyebrow">OPERATIONAL DECISION REQUIRED</span>
                  {/* The count says how many there are: the last of five sat below the fold
                      of a laptop screen with nothing saying it was there. */}
                  <h3>{decision.attack.title}: choose one of {["no", "one", "two", "three", "four", "five", "six"][decision.options.length] ?? decision.options.length} command responses.</h3>
                  {/* A newcomer meets five verbs described in costs they cannot yet
                      weigh. On a Training operation's first decision, one tap says
                      what each trades away, keyed to the icons on the options. */}
                  {game.difficulty === "training" && game.mode !== "expert" && game.decisions.length === 0 && (
                    <details className="decision-primer">
                      <summary>How these responses differ</summary>
                      {/* In the options' own words: "Watch" and "Act" here beside
                          buttons titled "Trace" and "Revoke" read as two lists. */}
                      <ul>
                        {decision.options.map(option => {
                          const Icon = option.id === "observe" ? Eye : option.id === "act" ? Siren : option.id === "attribute" ? BrainCircuit : option.id === "contain" ? Shield : MessagesSquare;
                          return <li key={option.id}><Icon size={15} aria-hidden="true" /><span><b>{option.title}</b> {primerTrade[option.id]}</span></li>;
                        })}
                      </ul>
                      <p>No single answer is right. The review judges each against the pressure at the time: with business impact at 55 or more, or the actor&apos;s pace at Accelerating or Pressing hard, acting or containing fits; below that, watching or attributing is affordable.</p>
                    </details>
                  )}
                  {/* At every difficulty but Expert: the review grades every decision by this,
                      and an Operational playtest was graded on a rule it was never shown. */}
                  {game.mode !== "expert" && (
                    <p className="decision-pressure">Pressure now: business impact {game.impact}, actor pace {getAdversaryState(game).toLowerCase()} (how fast its progress grows each turn, not how far it has got). {game.impact >= 55 || game.adversaryTempo >= 2 ? "That is high: acting or containing fits best." : "That is low: watching or attributing is affordable."}</p>
                  )}
                  <div ref={optionList}>
                    {decision.options.map(option => (
                      <button key={option.id} onClick={() => decide(option.id)}>
                        {option.id === "observe" ? <Eye size={20} /> : option.id === "act" ? <Siren size={20} /> : option.id === "attribute" ? <BrainCircuit size={20} /> : option.id === "contain" ? <Shield size={20} /> : <MessagesSquare size={20} />}
                        <strong>{option.title}</strong>
                        <span>{option.description}<br /><b>{option.evidence}</b> · {option.risk} · {option.service}{previewDecision(game, option.id) && <small className="decision-effect">{previewDecision(game, option.id)}</small>}</span>
                      </button>
                    ))}
                  </div>
                  <OptionsBelow key={decision.attack.id} list={optionList} />
                </div>
              )}
            </section>}
          </div>
          {awaitingDecision ? <p className="report-gate" role="status">Resolve the operational decision above to continue. This report stays open until the choice is recorded.</p> : <button className="primary-button full" onClick={dismissReport}>{game.status === "response" ? "Enter response phase" : ended ? "Open debrief" : "Continue investigation"}<ArrowRight size={17} /></button>}
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
      describeMeterChange(game, "impact", next.impact - game.impact),
      describeMeterChange(game, "continuity", next.continuity - game.continuity),
      describeMeterChange(game, "sector", next.sectorHealth - game.sectorHealth),
      describeMeterChange(game, "objective", next.objectiveProgress - game.objectiveProgress),
      next.nextModifier !== game.nextModifier ? `next roll ${next.nextModifier > game.nextModifier ? "+" : "−"}${Math.abs(next.nextModifier - game.nextModifier)}` : "",
    ].filter(Boolean).join(" · ");
  } catch {
    return null;
  }
}

// What each response verb buys and what it costs, in one clause each.
const primerTrade: Record<DecisionChoice, string> = {
  observe: "builds evidence; the intruder keeps its opportunity.",
  act: "cuts exposure now; it costs some evidence and service, and the intruder adapts.",
  attribute: "learns who is behind it before touching anything; the intruder keeps moving.",
  contain: "restricts the path while protecting the sector's margin.",
  notify: "aligns leaders and protects service; the intruder gains time.",
};

// Five responses do not fit beside the result on a laptop screen, and the
// report scrolls with nothing saying more are below. While the last one is out
// of view, a cue pinned to the foot of the report says so and brings it in.
function OptionsBelow({ list }: { list: RefObject<HTMLDivElement | null> }) {
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
  return <button type="button" className="options-below" onClick={reveal}><span>{hidden === 1 ? "One more response below" : `${hidden} more responses below`} <ArrowDown size={15} /></span></button>;
}
