import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { operationChallenge } from "@/lib/challenge";
import { StoryArt } from "./story-art";
import { TurnCalculation } from "./turn-calculation";
import { EvidenceAssessment } from "./evidence-assessment";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EffectList } from "@/components/game/effect-list";
import { FacilitatorSheet } from "@/components/game/facilitator-sheet";
import { OWN_SOURCE_BONUS, adversaryObjectives, attackMitre, countRevisions, mitreUrl, attacks, getAdversaryProfile, getBeginnerReview, getCounterfactuals, getHypothesisLedger, getLossReason, recommendNext, getOperationalLabel, getScoreRows, getRecoveryRemainder, resolveDecision, decisionChoices, gameModes, hypotheses, infrastructureTopologies, inSentence, procedureIntensities, procedureScopes, procedureById, responseOptionsFor, responseOptionScore, scenarios, sectorSystems, stages, meterEffect, type Game } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { campaignRoutes, routeForCampaign, routeReason } from "@/lib/phase9";
import { specialistArc, specialistReaction } from "@/lib/specialist-notes";
import { nextCase, unlockedCapabilities } from "@/lib/campaign";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { objectiveTheory } from "@/lib/phase9";
import { useMessages } from "@/hooks/use-messages";
import { debriefDialogMessages } from "@/lib/i18n/en/debrief-dialog";
import { register } from "@/lib/i18n";
import { sameMessage, withForm } from "@/lib/i18n/message";
import dynamic from "next/dynamic";
import { reviewChoices } from "@/lib/review-choices";

const CaptainDebrief = dynamic(() => import("./captain-debrief-player").then(module => module.CaptainDebrief, () => UnavailableVoice), { ssr: false });
const LearningReview = dynamic(() => import("./learning").then(module => module.LearningReview, () => () => null), { ssr: false });
function UnavailableVoice() {
  const { t } = useMessages("debriefDialog");
  return <p role="status">{t("voice.unavailable")}</p>;
}

register(debriefDialogMessages);

function DecisionComparison({ game, record }: { game: Game; record: Game["decisions"][number] }) {
  const { t, say } = useMessages("debriefDialog");
  const context = record.context;
  if (!context) return null;
  const snapshot: Game = { ...game, status: "playing", pendingDecision: record.stage, pendingCommand: null, pendingSetPiece: null,
    turns: game.turns.slice(0, context.turn), decisions: [], impact: context.impact, continuity: context.continuity,
    sectorHealth: context.sector, objectiveProgress: context.objective, adversaryTempo: context.tempo };
  const alternatives = decisionChoices.filter(choice => choice !== record.choice).map(choice => {
    const projected = resolveDecision(snapshot, choice);
    return { record: projected.decisions.at(-1)!, ends: projected.status === "lost" };
  });
  const safe = alternatives.filter(option => !option.ends);
  const { record: alternative, ends } = (safe.length ? safe : alternatives).reduce((best, next) => next.record.quality > best.record.quality || next.record.quality === best.record.quality && next.record.continuityChange > best.record.continuityChange ? next : best);
  return <details className="decision-primer decision-comparison-review">
    <summary>{t("compareAtMoment")}</summary>
    <p>{t("decisionMoment", context)}</p>
    <p>{t(!ends && alternative.quality > record.quality ? "strongerAlternative" : "alternativeAtMoment", { title: say(alternative.title), quality: alternative.quality })}</p>
    {ends && <p>{t("alternativeEnds")}</p>}
    <EffectList compare items={([ ["impact", alternative.impactChange], ["continuity", alternative.continuityChange], ["sector", alternative.sectorChange], ["objective", alternative.objectiveChange] ] as const).map(([meter, amount]) => meterEffect(snapshot, meter, amount))} />
  </details>;
}

// Associate decisions with their finding; only new evidence decisions have
// recorded context. Never invent a turn for other kinds of history.
function ReviewTimeline({ game }: { game: Game }) {
  const { t, say } = useMessages("debriefDialog");
  const milestones = game.turns.filter(turn => turn.revealed || turn.injectReveal);
  return <section className="timeline" id="debrief-timeline">
    <details className="debrief-fold">
      <summary>{t("evidenceAndDecision")}<span>{t("milestones", { count: milestones.length })}</span></summary>
      {!milestones.length && <p>{t("noMilestones")}</p>}
      {milestones.map(turn => <div key={turn.number}>
        <span>{turn.number}</span>
        <p><strong>{procedureById(game, turn.procedure)?.title}</strong>
          {[turn.revealed, turn.injectReveal].filter((id, index, ids) => id && ids.indexOf(id) === index).map(id => {
            const finding = attacks.find(item => item.id === id);
            const decision = game.decisions.find(item => item.stage === id);
            return <small key={id}>
              {t("revealed", { title: finding?.title ?? "" })}
              {decision && <><br /><strong>{t("findingResponse")}</strong> {say(decision.title)}</>}
            </small>;
          })}
        </p>
        {game.decisions.some(item => item.stage === turn.revealed || item.stage === turn.injectReveal) && <details className="decision-primer milestone-effects">
          <summary>{t("recordedEffects")}</summary>
          {game.decisions.filter(item => item.stage === turn.revealed || item.stage === turn.injectReveal).map((decision, index) => <span key={index}>
            <strong>{say(decision.title)}</strong>
            <EffectList items={[...([["impact", decision.impactChange], ["continuity", decision.continuityChange], ["sector", decision.sectorChange], ["objective", decision.objectiveChange]] as const).map(([meter, change]) => meterEffect(game, meter, change)), !!decision.tempoChange && { kind: "pace", faster: decision.tempoChange > 0 }]} />
          </span>)}
        </details>}
      </div>)}
      <details className="decision-primer complete-check-log">
        <summary>{t("allChecks", { count: game.turns.length })}</summary>
        {game.turns.map(turn => <div key={turn.number}>
          <span>{turn.number}</span>
          <p><strong>{procedureById(game, turn.procedure)?.title}</strong>{turn.hypothesis ? t("turnHypothesis", { title: hypotheses.find(item => item.id === turn.hypothesis)?.title ?? "" }) : t("noHypothesisRecorded2")}
            <small>{procedureScopes[turn.plan.scope].title}{t("scopeAnalysis", { procedureIntensitiesTitle: procedureIntensities[turn.plan.intensity].title.toLowerCase() })}{say(turn.narrative)}</small>
            <EffectList items={([["impact", turn.impactChange], ["continuity", turn.continuityChange], ["sector", turn.sectorChange], ["objective", turn.objectiveChange]] as const).map(([meter, change]) => meterEffect(game, meter, change))} />
          </p>
          <TurnCalculation game={game} turn={turn} />
        </div>)}
      </details>
    </details>
  </section>;
}

export function DebriefDialog({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages("debriefDialog");
  const content = useRef<HTMLDivElement>(null);
  const {
    debrief, setDebrief, game, outcome, activeScenario, campaign, finalEnding,
    resetToBriefing, setScenarioChoice, campaignChange, playRecommended, replayWithBot,
  } = session;
  const ledger = game ? getHypothesisLedger(game) : [];
  // The same suggestion the landing page will show a returning player.
  const recommendation = game ? recommendNext(game, nextCase(campaign, scenarios.length), session.ledger.length === 1 && !session.botRun) : null;
  const revisions = game ? countRevisions(game) : 0;
  const choices = game ? reviewChoices(game) : [];
  // The detail lists fold behind summaries that state what they hold: open, the
  // review was thirteen thousand pixels on a phone; a lesson, key calls and
  // the score now lead. The index opens a section before
  // jumping to it.
  const openSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    const fold = target.querySelector<HTMLDetailsElement>(":scope > details");
    if (fold) fold.open = true;
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };

  // A printed review is read away from the screen, where a fold cannot be
  // opened: every fold prints open, and the ones the player had closed close
  // again afterwards.
  useEffect(() => {
    if (!debrief) return;
    let opened: HTMLDetailsElement[] = [];
    const openFolds = () => {
      opened = [...document.querySelectorAll<HTMLDetailsElement>(".debrief-dialog details:not([open])")];
      opened.forEach(fold => { fold.open = true; });
    };
    const closeFolds = () => {
      opened.forEach(fold => { fold.open = false; });
      opened = [];
    };
    window.addEventListener("beforeprint", openFolds);
    window.addEventListener("afterprint", closeFolds);
    return () => {
      window.removeEventListener("beforeprint", openFolds);
      window.removeEventListener("afterprint", closeFolds);
    };
  }, [debrief]);

  return (
    <Dialog open={debrief} onOpenChange={setDebrief}>
      <DialogContent ref={content} className="game-dialog paper-dialog wide-dialog debrief-dialog" data-outcome={game?.status ?? "none"} onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus(); }} onCloseAutoFocus={returnFocusToAwaiting}>
        {game && <FacilitatorSheet game={game} />}
        <DialogHeader>
          <div className="eyebrow">{rich("formBc3002", {  }, { span: chunk => <span className="separator">{chunk}</span>, span2: chunk => <span>{chunk}</span> })}</div>
          <DialogTitle>{game?.status === "won" ? outcome && say(outcome.title) : game?.status === "exercise" ? t("exerciseConcluded") : game ? `${say(getLossReason(game).title)}.` : ""}</DialogTitle>
          <DialogDescription>{game?.status === "won" ? outcome && say(outcome.detail) : game ? <>{game.status === "lost" ? `${say(getLossReason(game).detail)} ` : ""}{game.status === "lost" && getLossReason(game).cause === "window" ? "" : t("stagesFoundIn", { found: game.revealed.length, count: game.turns.length })}{t("thisIsA")}</> : ""}</DialogDescription>
          {game && getRecoveryRemainder(game) && <p className="recovery-remainder">{say(getRecoveryRemainder(game)!)}</p>}
          {/* The grade and the score are the review's headline. Below four other
              blocks, the score sat under the fold of a laptop screen. A grade is
              only given to a completed response. */}
          {game && outcome && (
            <dl className="form-row debrief-verdict">
              {game.status === "won" && <div><dt>{t("grade")}</dt><dd className="grade">{outcome.grade}</dd></div>}
              <div><dt>{t("finalScore")}</dt><dd>{t("of1002", { total: outcome.breakdown.total })}</dd></div>
              <div><dt>{t("stages")}</dt><dd>{t("of42", { revealed: game.revealed.length })}</dd></div>
              <div><dt>{t("turns")}</dt><dd>{game.turns.length}</dd></div>
            </dl>
          )}
        </DialogHeader>
        {game && outcome && <>
          {debrief && session.voiceEnabled && !session.botRun && !session.settings && !session.rules && !session.newConfirm && <CaptainDebrief game={game} grade={outcome.grade} recoveryRisk={responseOptionsFor(game).recovery.find(option => option.id === game.responseChoices[2])?.residual} history={session.voiceHistory} />}
          <section className="first-read" aria-label={t("beforeTheDetail")}>
            {(() => {
              const review = getBeginnerReview(game);
              return (
                <>
                <dl><div><dt>{t("oneThingTo")}</dt><dd>{say(review.next)}</dd></div></dl>
                <details className="debrief-fold"><summary>{t("whyLesson")}</summary><dl>
                  <div><dt>{t("whatWentWell")}</dt><dd>{say(review.strength)}</dd></div>
                  <div><dt>{t("whatToLook")}</dt><dd>{say(review.gap)}</dd></div>
                  <div><dt>{t("theIdeaBehind")}</dt><dd>{say(review.concept)}</dd></div>
                </dl></details>
                </>
              );
            })()}
          </section>
          {debrief && !session.botRun && <LearningReview game={game} operation={session.learningId} next={getBeginnerReview(game).next} />}
          <section className="first-read review-choices" aria-label={t("keyChoices")}>
            <h3>{t("keyChoices")}</h3>
            <p>{t(choices.length ? "choiceOrder" : "noChoices")}</p>
            <dl>{choices.map(choice => <div key={choice.id}><dt>{say(choice.title)}</dt><dd>{say(choice.effect)}{choice.reason && <details className="decision-primer"><summary>{t("whyThisCall")}</summary><p>{say(choice.reason)}</p></details>}</dd></div>)}</dl>
          </section>
          <nav className="debrief-index" aria-label={t("reviewSections")}>
            {[
              ["debrief-score", t("score")],
              ["debrief-hypothesis", t("hypothesis")],
              ["debrief-timeline", t("timeline")],
              ["debrief-decisions", t("decisions")],
              ["debrief-chain", t("attackChain")],
              ["debrief-campaign", t("campaign")],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => openSection(id)}>{label}</button>
            ))}
          </nav>
          <ReviewTimeline game={game} />
          <div className="debrief-stats">
            <div><strong>{game.turns.filter(turn => turn.success).length}/{game.turns.length}</strong><span>{t("rollsSucceeded")}</span></div>
            <div><strong>{game.impact}</strong><span>{t("finalImpact")}</span></div>
            <div><strong>{game.continuity}</strong><span>{getOperationalLabel(game)}</span></div>
          </div>
          <section className="score-card" id="debrief-score">
            <div className="score-breakdown">
              {getScoreRows(game).map(row => <div key={row.id}><span>{say(row.label)}</span><strong>{game.status === "exercise" && row.id === "response" ? t("notScored") : `${row.value}/${row.maximum}`}</strong><small>{say(row.rule)}</small></div>)}
            </div>
          </section>
          <section className="hypothesis-ledger" id="debrief-hypothesis">
            <details className="debrief-fold">
              <summary>{t(game.scoringVersion === 2 ? "hypothesisTestingOf" : "hypothesisAccuracyOf", { hypothesis: outcome.breakdown.hypothesis })}<span>{t("ofTurnsNamed", { count: ledger.filter(row => row.matched).length, ledger: ledger.length })}{ledger.some(row => !row.matched && row.credit > 0) ? t("ruledAWrong", { count: ledger.filter(row => !row.matched && row.credit > 0).length }) : ""}</span></summary>
            <p className="ledger-rule">{game.scoringVersion === 2 ? say(getScoreRows(game).find(row => row.id === "hypothesis")!.rule) : t("aTurnScores2", { ownSourceBonus: OWN_SOURCE_BONUS })}</p>
            {ledger.map(row => (
              <div key={row.turn} className={row.matched && row.credit === 1 ? "matched" : row.credit > 0 ? "half" : "missed"}>
                <span>{String(row.turn)}</span>
                <p>
                  <strong>{row.predicted ? t("predicted", { predicted: row.predicted }) : t("noHypothesisRecorded")}</strong>
                  <small>{t("testedAgainst2", { testedAgainst: say(withForm(row.testedAgainst, "inSentence")), procedure: row.procedure })}{row.discriminating ? t("couldHaveExposed") : t("couldNotHave")}{row.bonus > 0 ? t("ownSourceTo", { bonus: row.bonus }) : ""}</small>
                  <em>{say(row.verdict)}</em>
                </p>
                <b>{row.credit === 1 ? t("fullCredit") : row.credit === 0.25 ? t("predictionCredit") : row.credit > 0 ? t("halfCredit") : t("noCredit")}</b>
              </div>
            ))}
            </details>
          </section>
          {/* The counts and the three outcomes are detail for a player who wants it.
              Open, they were a thousand pixels between the score and the ledger. */}
          <details className="debrief-fold debrief-detail-fold">
            <summary>{t("operationDetail")}<span>{t("of4Stages2Plural", { revealed: game.revealed.length, count: revisions })}{t("sectorMargin2", { sectorHealth: game.sectorHealth })}</span></summary>
            <section className="advanced-review">
              <div><strong>{game.revealed.length}/4</strong><span>{t("attackStagesConfirmed")}</span></div>
              <div><strong>{game.evidence.filter(item => item.supports).length}</strong><span>{t("findingsThatConfirmed")}</span></div>
              <div><strong>{game.evidence.filter(item => !item.supports).length}</strong><span>{t("findingsThatFound")}</span></div>
              <div><strong>{t("of", { count: game.correlations.filter(item => item.correct).length, correlations: game.correlations.length })}</strong><span>{t("correlationAssessmentsSupported")}</span></div>
              <div><strong>{revisions}</strong><span>{t("hypothesisRevisions")}</span></div>
              <div><strong>{game.turns.filter(turn => turn.planningBonus > 0).length}</strong><span>{t("evidenceAlignedActions")}</span></div>
              <div><strong>{game.commandHistory.length}</strong><span>{t("commandEventsResolved")}</span></div>
              <div><strong>{game.setPieceHistory.length}</strong><span>{t("sectorDecisionsResolved")}</span></div>
            </section>
            <section className="mission-consequences">
              <div><span className="eyebrow">{t("sectorOutcome")}</span><strong>{t("of1003", { sectorSystemsTitle: sectorSystems[game.scenario].title, sectorHealth: game.sectorHealth })}</strong><p>{sectorSystems[game.scenario].rule}</p></div>
              <div><span className="eyebrow">{t("adversaryIntent")}</span><strong>{adversaryObjectives[game.objective].title}{t("adversaryProgressOf", { objectiveProgress: game.objectiveProgress })}</strong><p>{adversaryObjectives[game.objective].tell}</p><div className="adversary-profile"><StoryArt kind="adversaries" name={game.adversaryProfile} /><p>{t("operationAgainst2", { gameModesTitle: gameModes[game.mode].title })}{getAdversaryProfile(game).title}{t("itsHabitWas2", { signature: getAdversaryProfile(game).signature.toLowerCase(), counterplay: inSentence(getAdversaryProfile(game).counterplay) })}</p></div>
                {/* A recorded theory was never judged anywhere, so a player could not
                    learn whether the reading of intent had been right. */}
                <p className="theory-verdict">{!game.caseTheory ? t("noCaseTheory") : game.caseTheory === game.objective ? t("yourCaseTheory", { objectiveTheoryTitle: objectiveTheory[game.caseTheory].title.toLowerCase() }) : t("yourCaseTheory2", { objectiveTheoryTitle: objectiveTheory[game.caseTheory].title.toLowerCase(), objectiveTheoryTitle2: objectiveTheory[game.objective].title.toLowerCase() })}</p>{game.revealed.includes(game.chain[3]) && <p className="intent-link"><strong>{attacks.find(attack => attack.id === game.chain[3])?.title}:</strong> {adversaryObjectives[game.objective].outbound}</p>}</div>
              <div><span className="eyebrow">{t("commandTeam")}</span><strong>{t("fatigueOf6", { namedSpecialistsName: namedSpecialists[game.specialist].name, specialistFatigue: game.specialistFatigue })}</strong></div>
            </section>
          </details>
          {(game.decisions.length > 0 || game.commandHistory.length > 0 || game.setPieceHistory.length > 0) && (
            <div className="decision-summary" id="debrief-decisions">
              <details className="debrief-fold">
                <summary>{rich("yourDecisionsSpan", { decisions: game.decisions.length + game.commandHistory.length + game.setPieceHistory.length + game.responseChoices.length + game.mapHistory.length }, { span: chunk => <span>{chunk}</span> })}</summary>
              {/* A reason already given for the decision above is not repeated word for word. */}
              {game.decisions.map((record, index) => <Fragment key={`${record.stage}-${index}`}><p><strong>{attacks.find(attack => attack.id === record.stage)?.title}:</strong> {say(record.title)}<span>{t("qualityOf5", { quality: record.quality })}</span>{(index === 0 || !sameMessage(game.decisions[index - 1].rationale, record.rationale)) && <em>{say(record.rationale)}</em>}<EffectList className="decision-effects" items={[...([["impact", record.impactChange], ["continuity", record.continuityChange], ["sector", record.sectorChange], ["objective", record.objectiveChange]] as const).filter(([, change]) => change).map(([meter, change]) => meterEffect(game, meter, change)), !!record.tempoChange && { kind: "pace", faster: record.tempoChange > 0 }, record.impactChange || record.continuityChange || record.sectorChange || record.objectiveChange || record.tempoChange ? "" : t("noMeterMoved")]} />{record.adaptedTo && <em>{t("actorAdaptation")}{record.adaptationReason ? say(record.adaptationReason) : t("theHiddenRoute", { title: String(attacks.find(attack => attack.id === record.adaptedTo)?.title) })}</em>}</p><DecisionComparison game={game} record={record} /></Fragment>)}
              {game.commandHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>{t("commandEvent.commandEvent")}</strong> {say(record.title)}<span>{t("qualityOf5", { quality: record.quality })}</span><em>{say(record.effect)}</em></p>)}
              {game.setPieceHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>{t("sectorDecision")}</strong> {say(record.title)}<span>{t("qualityOf5", { quality: record.quality })}</span><em>{say(record.effect)}</em></p>)}
              {/* Each response phase graded against the best its sector offered, so
                  a containment-and-recovery score below full says which call cost it. */}
              {(["containment", "assurance", "recovery"] as const).map((phase, index) => {
                const options = responseOptionsFor(game)[phase];
                const chosen = options.find(option => option.id === game.responseChoices[index]);
                if (!chosen) return null;
                const scored = options.map(option => ({ option, score: responseOptionScore(game, index, option) }));
                const best = scored.reduce((a, b) => a.score >= b.score ? a : b);
                const chosenScore = responseOptionScore(game, index, chosen);
                return <p key={phase}><strong>{t(phase === "containment" ? "phaseContainment" : phase === "assurance" ? "phaseAssurance" : "phaseRecovery")}:</strong> {chosen.title}<span>{t("ofABest", { score: chosenScore, best: best.score, confidence: chosen.confidence.toLowerCase(), residual: chosen.residual.toLowerCase() })}</span><em>{chosenScore === best.score ? t("theStrongestOption") : t("wouldHaveScored", { title: best.option.title })}</em></p>;
              })}
              {game.mapHistory.map((record, index) => <p key={`${record.node}-${index}`}><strong>{t("infrastructure")}</strong> {record.action === "isolate" ? t("isolated") : t("monitored")} {infrastructureTopologies[game.scenario].nodes.find(node => node.id === record.node)?.label ?? record.node}<span>{t("mapAction")}</span><em>{say(record.effect)}</em></p>)}
              </details>
            </div>
          )}
          <section className="counterfactuals"><details className="debrief-fold"><summary>{rich("whatMightHave2", { getCounterfactuals: getCounterfactuals(game).length }, { span: chunk => <span>{chunk}</span> })}</summary>{getCounterfactuals(game).map((item, index) => <p key={index}>{say(item)}</p>)}</details></section>
          <section className="evidence-review"><details className="debrief-fold"><summary>{t("evidenceReconstruction")}<span>{t("finding2Plural", { count: game.evidence.length })}{t("confirmedAStage", { count: game.evidence.filter(item => item.supports).length })}</span></summary>{game.evidence.map(item => <div key={item.id}><strong>{t("turn2", { turn: item.turn, itemTitle: say(item.title) })}</strong><span>{t("atSource", { source: say(item.source), system: say(item.system) })}</span><EvidenceAssessment game={game} item={item} /><p>{say(item.detail)}</p></div>)}</details></section>
          <details className="debrief-fold debrief-chain-fold" id="debrief-chain">
            <summary>{rich("theAttackChain2", { revealed: game.revealed.length }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="debrief-chain">
            {game.chain.map((id, index) => {
              const attack = attacks.find(item => item.id === id)!;
              const tactic = [t("initialAccess"), t("lateralMovement"), t("persistence"), t("commandAndControl")][index];
              return <section key={id} style={{ "--stage-color": stages[index].color } as CSSProperties}><span className="eyebrow">{t("stage2", { index: index + 1, stagesName: stages[index].name })}<span className={game.revealed.includes(id) ? "found-label" : "missed-label"}>{game.revealed.includes(id) ? t("found") : t("unresolved")}</span></span><h3>{attack.title}</h3><p>{attack.evidence}</p><small>{t("mitreAttCk2", { tactic })}{attackMitre[attack.id].map((technique, position) => <span key={technique}>{position ? ", " : ""}<a href={mitreUrl(technique)} target="_blank" rel="noreferrer">{technique}</a></span>)}<br />{t("detectableWith2", { list: attack.detect.map(source => procedureById(game, source)?.title).join(", ") })}</small></section>;
            })}
          </div>
          </details>
          <section className="debrief-learning"><h3>{t("takeThisBack")}</h3><p>{game.turns.some(turn => turn.success && !turn.revealed) ? t("someActionsPassed") : t("whichEvidenceSources")}</p><p>{activeScenario.lesson}</p></section>
          <details className="debrief-fold debrief-campaign-fold" id="debrief-campaign">
            <summary>{rich("campaignAndTeam2", { leadershipTrust: campaign.leadershipTrust, readiness: campaign.readiness, mastery: campaign.mastery[String(game.scenario)] ?? 0 }, { span: chunk => <span>{chunk}</span> })}</summary>
            {/* What this operation did to the campaign, and why. Trust and readiness
                were totals with no change and no reason beside them. */}
            {!!campaignChange.length && <section className="campaign-change"><span className="eyebrow">{t("whatThisOperation")}</span><ul>{campaignChange.map((line, index) => <li key={index}>{say(line)}</li>)}</ul>{game.mode === "campaign" && <p>{t("route2", { campaignRoutesTitle: campaignRoutes[routeForCampaign(campaign)].title, routeReason: say(routeReason(campaign)) })}</p>}</section>}
            <section className="capability-review"><span className="eyebrow">{t("campaignCapabilities")}</span>{unlockedCapabilities(campaign.xp).map(item => <div key={item.title} className={item.unlocked ? "unlocked" : "locked"}><strong>{item.title}</strong><span>{item.unlocked ? item.detail : t("unlocksAtCampaign", { at: item.at, xp: campaign.xp, itemDetail: item.detail })}</span></div>)}</section>
            <section className="campaign-consequences"><div><span>{t("leadershipTrust")}</span><strong>{t("of1004", { leadershipTrust: campaign.leadershipTrust })}</strong></div><div><span>{t("readiness")}</span><strong>{t("of1005", { readiness: campaign.readiness })}</strong></div><div><span>{t("winStreak")}</span><strong>{campaign.streak}</strong></div></section>
            <section className="specialist-reaction"><span className="eyebrow">{t("teamAfterAction2", { namedSpecialistsName: namedSpecialists[game.specialist].name, specialistBonds: campaign.specialistBonds[game.specialist] ?? 35 })}</span><p>{say(specialistReaction(game.specialist, game.status !== "lost", outcome.breakdown.total, campaign.specialistBonds[game.specialist] ?? 35))}</p>{specialistArc(game.specialist, campaign.specialistBonds[game.specialist] ?? 35) && <p className="specialist-arc">{specialistArc(game.specialist, campaign.specialistBonds[game.specialist] ?? 35)}</p>}</section>
            <section className="mastery-panel"><div><span className="eyebrow">{t("scenarioMastery")}</span><strong>{campaign.mastery[String(game.scenario)] ? t("masteryOf3", { mastery: campaign.mastery[String(game.scenario)] }) : t("notYetEarned")}</strong></div><p>{t("masteryIs1For")}</p></section>
          </details>
          {finalEnding && <section className="campaign-finale"><div><span className="eyebrow">{t("finalCommandBriefing")}</span><h3>{finalEnding.title}</h3><p>{say(finalEnding.detail)}</p></div></section>}
          {/* What to play next, chosen from this record: the reason quotes it, so
              the advice can be checked against what happened. */}
          {!finalEnding && <section className="next-recommendation" aria-labelledby="next-recommendation-title">
            <span className="eyebrow" id="next-recommendation-title">{t("suggestedNext")}</span>
            <h3>{say(recommendation!.title)}</h3>
            <p>{say(recommendation!.reason)}</p>
            {/* The same operation played by the Bot Commander from what it can see,
                to show where a reading tested soundly would have gone. */}
            {operationChallenge(game)
              ? <><p>{t("orWatchThe")}</p><button className="text-action" onClick={() => replayWithBot(game)}>{t("replayWithThe")}</button></>
              : <p>{t(game.seed !== null ? "earlierChallengeOperation" : "thisCampaignOperation")}</p>}
          </section>}
          {/* A trainer's print: the whole chain and the questions for the room.
              It gives the answer away, which this says before the button does. */}
          <section className="next-recommendation facilitator-offer" aria-labelledby="facilitator-title">
            <span className="eyebrow" id="facilitator-title">{t("forTrainer")}</span>
            <p>{t("theFacilitatorSheet")}</p>
            <button className="text-action" onClick={printFacilitatorSheet}>{t("printFacilitatorSheet")}</button>
          </section>
          <div className="debrief-actions">
            <button className="text-action" onClick={() => window.print()}>{t("printReview")}</button>
            {!finalEnding && <button className="text-action" onClick={() => { const nextScenario = nextCase(campaign, scenarios.length); resetToBriefing(); setScenarioChoice(nextScenario); }}>{t("chooseAnotherIncident")}</button>}
            <button className="primary-button" onClick={() => finalEnding ? (() => { const nextScenario = nextCase(campaign, scenarios.length); resetToBriefing(); setScenarioChoice(nextScenario); })() : playRecommended(recommendation!)}>{finalEnding ? t("returnToCampaign") : t("setUpThe")}</button>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}

// The facilitator sheet prints alone: the root carries a class the print rules
// read, for as long as the print dialog is open.
function printFacilitatorSheet() {
  const root = document.documentElement;
  const done = () => {
    root.classList.remove("print-facilitator");
    window.removeEventListener("afterprint", done);
  };
  root.classList.add("print-facilitator");
  window.addEventListener("afterprint", done);
  window.print();
}
