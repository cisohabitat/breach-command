import type { CSSProperties } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EffectList } from "@/components/game/effect-list";
import { FacilitatorSheet } from "@/components/game/facilitator-sheet";
import { OWN_SOURCE_BONUS, adversaryObjectives, attackMitre, countRevisions, mitreUrl, attacks, getAdversaryProfile, getBeginnerReview, getCounterfactuals, getHypothesisLedger, getLossReason, recommendNext, getOperationalLabel, getScoreRows, gameModes, hypotheses, infrastructureTopologies, inSentence, procedureIntensities, procedureScopes, procedureById, responseOptionsFor, scenarios, sectorSystems, stages, meterEffect } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { campaignRoutes, routeForCampaign, routeReason, specialistArc, specialistReaction } from "@/lib/phase9";
import { nextCase, unlockedCapabilities } from "@/lib/campaign";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { objectiveTheory } from "@/lib/phase9";
import { useMessages } from "@/hooks/use-messages";
import { debriefDialogMessages } from "@/lib/i18n/en/debrief-dialog";
import { register } from "@/lib/i18n";
import { sameMessage, withForm } from "@/lib/i18n/message";

register(debriefDialogMessages);

export function DebriefDialog({ session }: { session: GameSession }) {
  const { t, rich, say } = useMessages();
  const {
    debrief, setDebrief, game, outcome, activeScenario, campaign, finalEnding,
    resetToBriefing, setScenarioChoice, campaignChange, playRecommended, replayWithBot,
  } = session;
  const ledger = game ? getHypothesisLedger(game) : [];
  // The same suggestion the landing page will show a returning player.
  const recommendation = game ? recommendNext(game, nextCase(campaign, scenarios.length)) : null;
  const revisions = game ? countRevisions(game) : 0;
  // The detail lists fold behind summaries that state what they hold: open, the
  // review was thirteen thousand pixels on a phone, and the four plain sentences
  // and the score are what most players need. The index opens a section before
  // jumping to it.
  const openSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.querySelectorAll("details").forEach(fold => { fold.open = true; });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Dialog open={debrief} onOpenChange={setDebrief}>
      <DialogContent className="game-dialog paper-dialog wide-dialog debrief-dialog" data-outcome={game?.status ?? "none"} onCloseAutoFocus={returnFocusToAwaiting}>
        {game && <FacilitatorSheet game={game} />}
        <DialogHeader>
          <div className="eyebrow">{rich("debriefDialog.formBc3002", {  }, { span: chunk => <span className="separator">{chunk}</span>, span2: chunk => <span>{chunk}</span> })}</div>
          <DialogTitle>{game?.status === "won" ? outcome && say(outcome.title) : game?.status === "exercise" ? t("debriefDialog.exerciseConcluded") : game ? `${say(getLossReason(game).title)}.` : ""}</DialogTitle>
          <DialogDescription>{game?.status === "won" ? outcome && say(outcome.detail) : game ? <>{game.status === "lost" ? `${say(getLossReason(game).detail)} ` : ""}{game.status === "lost" && getLossReason(game).cause === "window" ? "" : t("debriefDialog.stagesFoundIn", { found: game.revealed.length, count: game.turns.length })}{t("debriefDialog.thisIsA")}</> : ""}</DialogDescription>
          {/* The grade and the score are the review's headline. Below four other
              blocks, the score sat under the fold of a laptop screen. A grade is
              only given to a completed response. */}
          {game && outcome && (
            <dl className="form-row debrief-verdict">
              {game.status === "won" && <div><dt>{t("debriefDialog.grade")}</dt><dd className="grade">{outcome.grade}</dd></div>}
              <div><dt>{t("debriefDialog.finalScore")}</dt><dd>{t("debriefDialog.of1002", { total: outcome.breakdown.total })}</dd></div>
              <div><dt>{t("debriefDialog.stages")}</dt><dd>{t("debriefDialog.of42", { revealed: game.revealed.length })}</dd></div>
              <div><dt>{t("debriefDialog.turns")}</dt><dd>{game.turns.length}</dd></div>
            </dl>
          )}
        </DialogHeader>
        {game && outcome && <>
          <section className="first-read" aria-label={t("debriefDialog.beforeTheDetail")}>
            {(() => {
              const review = getBeginnerReview(game);
              return (
                <dl>
                  <div><dt>{t("debriefDialog.whatWentWell")}</dt><dd>{say(review.strength)}</dd></div>
                  <div><dt>{t("debriefDialog.whatToLook")}</dt><dd>{say(review.gap)}</dd></div>
                  <div><dt>{t("debriefDialog.theIdeaBehind")}</dt><dd>{say(review.concept)}</dd></div>
                  <div><dt>{t("debriefDialog.oneThingTo")}</dt><dd>{say(review.next)}</dd></div>
                </dl>
              );
            })()}
          </section>
          <nav className="debrief-index" aria-label={t("debriefDialog.reviewSections")}>
            {[
              ["debrief-score", t("debriefDialog.score")],
              ["debrief-hypothesis", t("debriefDialog.hypothesis")],
              ["debrief-timeline", t("debriefDialog.timeline")],
              ["debrief-decisions", t("debriefDialog.decisions")],
              ["debrief-chain", t("debriefDialog.attackChain")],
              ["debrief-campaign", t("debriefDialog.campaign")],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => openSection(id)}>{label}</button>
            ))}
          </nav>
          <div className="debrief-stats">
            <div><strong>{game.turns.filter(turn => turn.success).length}/{game.turns.length}</strong><span>{t("debriefDialog.rollsSucceeded")}</span></div>
            <div><strong>{game.impact}</strong><span>{t("debriefDialog.finalImpact")}</span></div>
            <div><strong>{game.continuity}</strong><span>{getOperationalLabel(game)}</span></div>
          </div>
          <section className="score-card" id="debrief-score">
            <div className="score-breakdown">
              {getScoreRows(game).map(row => <div key={row.id}><span>{say(row.label)}</span><strong>{game.status === "exercise" && row.id === "response" ? t("debriefDialog.notScored") : `${row.value}/${row.maximum}`}</strong><small>{say(row.rule)}</small></div>)}
            </div>
          </section>
          <section className="hypothesis-ledger" id="debrief-hypothesis">
            <details className="debrief-fold">
              <summary>{t("debriefDialog.hypothesisAccuracyOf", { hypothesis: outcome.breakdown.hypothesis })}<span>{t("debriefDialog.ofTurnsNamed", { count: ledger.filter(row => row.matched).length, ledger: ledger.length })}{ledger.some(row => !row.matched && row.credit > 0) ? t("debriefDialog.ruledAWrong", { count: ledger.filter(row => !row.matched && row.credit > 0).length }) : ""}</span></summary>
            <p className="ledger-rule">{t("debriefDialog.aTurnScores2", { ownSourceBonus: OWN_SOURCE_BONUS })}</p>
            {ledger.map(row => (
              <div key={row.turn} className={row.matched ? "matched" : row.credit > 0 ? "half" : "missed"}>
                <span>{String(row.turn)}</span>
                <p>
                  <strong>{row.predicted ? t("debriefDialog.predicted", { predicted: row.predicted }) : t("debriefDialog.noHypothesisRecorded")}</strong>
                  <small>{t("debriefDialog.testedAgainst2", { testedAgainst: say(withForm(row.testedAgainst, "inSentence")), procedure: row.procedure })}{row.discriminating ? t("debriefDialog.couldHaveExposed") : t("debriefDialog.couldNotHave")}{row.bonus > 0 ? t("debriefDialog.ownSourceTo", { bonus: row.bonus }) : ""}</small>
                  <em>{say(row.verdict)}</em>
                </p>
                <b>{row.credit === 1 ? t("debriefDialog.fullCredit") : row.credit > 0 ? t("debriefDialog.halfCredit") : t("debriefDialog.noCredit")}</b>
              </div>
            ))}
            </details>
          </section>
          {/* The counts and the three outcomes are detail for a player who wants it.
              Open, they were a thousand pixels between the score and the ledger. */}
          <details className="debrief-fold debrief-detail-fold">
            <summary>{t("debriefDialog.operationDetail")}<span>{t("debriefDialog.of4Stages2Plural", { revealed: game.revealed.length, count: revisions })}{t("debriefDialog.sectorMargin2", { sectorHealth: game.sectorHealth })}</span></summary>
            <section className="advanced-review">
              <div><strong>{game.revealed.length}/4</strong><span>{t("debriefDialog.attackStagesConfirmed")}</span></div>
              <div><strong>{game.evidence.filter(item => item.supports).length}</strong><span>{t("debriefDialog.findingsThatConfirmed")}</span></div>
              <div><strong>{game.evidence.filter(item => !item.supports).length}</strong><span>{t("debriefDialog.findingsThatFound")}</span></div>
              <div><strong>{t("debriefDialog.of", { count: game.correlations.filter(item => item.correct).length, correlations: game.correlations.length })}</strong><span>{t("debriefDialog.correlationAssessmentsSupported")}</span></div>
              <div><strong>{revisions}</strong><span>{t("debriefDialog.hypothesisRevisions")}</span></div>
              <div><strong>{game.turns.filter(turn => turn.planningBonus > 0).length}</strong><span>{t("debriefDialog.evidenceAlignedActions")}</span></div>
              <div><strong>{game.commandHistory.length}</strong><span>{t("debriefDialog.commandEventsResolved")}</span></div>
              <div><strong>{game.setPieceHistory.length}</strong><span>{t("debriefDialog.sectorDecisionsResolved")}</span></div>
            </section>
            <section className="mission-consequences">
              <div><span className="eyebrow">{t("debriefDialog.sectorOutcome")}</span><strong>{t("debriefDialog.of1003", { sectorSystemsTitle: sectorSystems[game.scenario].title, sectorHealth: game.sectorHealth })}</strong><p>{sectorSystems[game.scenario].rule}</p></div>
              <div><span className="eyebrow">{t("debriefDialog.adversaryIntent")}</span><strong>{adversaryObjectives[game.objective].title}{t("debriefDialog.adversaryProgressOf", { objectiveProgress: game.objectiveProgress })}</strong><p>{adversaryObjectives[game.objective].tell}</p>
                {/* A recorded theory was never judged anywhere, so a player could not
                    learn whether the reading of intent had been right. */}
                <p className="theory-verdict">{!game.caseTheory ? t("debriefDialog.noCaseTheory") : game.caseTheory === game.objective ? t("debriefDialog.yourCaseTheory", { objectiveTheoryTitle: objectiveTheory[game.caseTheory].title.toLowerCase() }) : t("debriefDialog.yourCaseTheory2", { objectiveTheoryTitle: objectiveTheory[game.caseTheory].title.toLowerCase(), objectiveTheoryTitle2: objectiveTheory[game.objective].title.toLowerCase() })}</p>{game.revealed.includes(game.chain[3]) && <p className="intent-link"><strong>{attacks.find(attack => attack.id === game.chain[3])?.title}:</strong> {adversaryObjectives[game.objective].outbound}</p>}</div>
              <div><span className="eyebrow">{t("debriefDialog.commandTeam")}</span><strong>{t("debriefDialog.fatigueOf6", { namedSpecialistsName: namedSpecialists[game.specialist].name, specialistFatigue: game.specialistFatigue })}</strong><p>{t("debriefDialog.operationAgainst2", { gameModesTitle: gameModes[game.mode].title })}{getAdversaryProfile(game).title}{t("debriefDialog.itsHabitWas2", { signature: getAdversaryProfile(game).signature.toLowerCase(), counterplay: inSentence(getAdversaryProfile(game).counterplay) })}</p></div>
            </section>
          </details>
          <section className="timeline" id="debrief-timeline">
            <details className="debrief-fold">
              <summary>{t("debriefDialog.evidenceAndDecision")}<span>{t("debriefDialog.turn3Plural", { count: game.turns.length })}{t("debriefDialog.foundAStage", { count: game.turns.filter(turn => turn.revealed).length })}</span></summary>
            {game.turns.map(turn => (
              <div key={turn.number}>
                <span>{String(turn.number)}</span>
                <p><strong>{procedureById(game, turn.procedure)?.title}</strong>{turn.hypothesis ? `, hypothesis: ${hypotheses.find(item => item.id === turn.hypothesis)?.title}` : t("debriefDialog.noHypothesisRecorded2")}<small>{procedureScopes[turn.plan.scope].title}{t("debriefDialog.scopeAnalysis", { procedureIntensitiesTitle: procedureIntensities[turn.plan.intensity].title.toLowerCase() })}{turn.revealed ? t("debriefDialog.revealed", { title: String(attacks.find(attack => attack.id === turn.revealed)?.title) }) : say(turn.narrative)}</small></p>
              </div>
            ))}
            </details>
          </section>
          {(game.decisions.length > 0 || game.commandHistory.length > 0 || game.setPieceHistory.length > 0) && (
            <div className="decision-summary" id="debrief-decisions">
              <details className="debrief-fold">
                <summary>{rich("debriefDialog.yourDecisionsSpan", { decisions: game.decisions.length + game.commandHistory.length + game.setPieceHistory.length + game.responseChoices.length + game.mapHistory.length }, { span: chunk => <span>{chunk}</span> })}</summary>
              {/* A reason already given for the decision above is not repeated word for word. */}
              {game.decisions.map((record, index) => <p key={`${record.stage}-${index}`}><strong>{attacks.find(attack => attack.id === record.stage)?.title}:</strong> {say(record.title)}<span>{t("debriefDialog.qualityOf5", { quality: record.quality })}</span>{(index === 0 || !sameMessage(game.decisions[index - 1].rationale, record.rationale)) && <em>{say(record.rationale)}</em>}<EffectList className="decision-effects" items={[...([["impact", record.impactChange], ["continuity", record.continuityChange], ["sector", record.sectorChange], ["objective", record.objectiveChange]] as const).filter(([, change]) => change).map(([meter, change]) => meterEffect(game, meter, change)), !!record.tempoChange && { kind: "pace", faster: record.tempoChange > 0 }, record.impactChange || record.continuityChange || record.sectorChange || record.objectiveChange || record.tempoChange ? "" : t("debriefDialog.noMeterMoved")]} />{record.adaptedTo && <em>{t("debriefDialog.actorAdaptation")}{record.adaptationReason ? say(record.adaptationReason) : t("debriefDialog.theHiddenRoute", { title: String(attacks.find(attack => attack.id === record.adaptedTo)?.title) })}</em>}</p>)}
              {game.commandHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>{t("commandEvent.commandEvent")}</strong> {say(record.title)}<span>{t("debriefDialog.qualityOf5", { quality: record.quality })}</span><em>{say(record.effect)}</em></p>)}
              {game.setPieceHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>{t("debriefDialog.sectorDecision")}</strong> {say(record.title)}<span>{t("debriefDialog.qualityOf5", { quality: record.quality })}</span><em>{say(record.effect)}</em></p>)}
              {/* Each response phase graded against the best its sector offered, so
                  a containment-and-recovery score below full says which call cost it. */}
              {(["containment", "assurance", "recovery"] as const).map((phase, index) => {
                const options = responseOptionsFor(game)[phase];
                const chosen = options.find(option => option.id === game.responseChoices[index]);
                if (!chosen) return null;
                const best = Math.max(...options.map(option => option.score));
                return <p key={phase}><strong>{phase.charAt(0).toUpperCase() + phase.slice(1)}:</strong> {chosen.title}<span>{t("debriefDialog.ofABest", { score: chosen.score, best, confidence: chosen.confidence.toLowerCase(), residual: chosen.residual.toLowerCase() })}</span><em>{chosen.score === best ? t("debriefDialog.theStrongestOption") : t("debriefDialog.wouldHaveScored", { title: options.find(option => option.score === best)!.title })}</em></p>;
              })}
              {game.mapHistory.map((record, index) => <p key={`${record.node}-${index}`}><strong>{t("debriefDialog.infrastructure")}</strong> {record.action === "isolate" ? t("debriefDialog.isolated") : t("debriefDialog.monitored")} {infrastructureTopologies[game.scenario].nodes.find(node => node.id === record.node)?.label ?? record.node}<span>{t("debriefDialog.mapAction")}</span><em>{say(record.effect)}</em></p>)}
              </details>
            </div>
          )}
          <section className="counterfactuals"><details className="debrief-fold"><summary>{rich("debriefDialog.whatMightHave2", { getCounterfactuals: getCounterfactuals(game).length }, { span: chunk => <span>{chunk}</span> })}</summary>{getCounterfactuals(game).map((item, index) => <p key={index}>{say(item)}</p>)}</details></section>
          <section className="evidence-review"><details className="debrief-fold"><summary>{t("debriefDialog.evidenceReconstruction")}<span>{t("debriefDialog.finding2Plural", { count: game.evidence.length })}{t("debriefDialog.confirmedAStage", { count: game.evidence.filter(item => item.supports).length })}</span></summary>{game.evidence.map(item => <div key={item.id}><strong>{t("debriefDialog.turn2", { turn: item.turn, itemTitle: say(item.title) })}</strong><span>{t("debriefDialog.atConfidence", { source: say(item.source), system: say(item.system), confidence: item.confidence.toLowerCase() })}</span><p>{say(item.detail)}</p></div>)}</details></section>
          <details className="debrief-fold debrief-chain-fold" id="debrief-chain">
            <summary>{rich("debriefDialog.theAttackChain2", { revealed: game.revealed.length }, { span: chunk => <span>{chunk}</span> })}</summary>
          <div className="debrief-chain">
            {game.chain.map((id, index) => {
              const attack = attacks.find(item => item.id === id)!;
              const tactic = [t("debriefDialog.initialAccess"), t("debriefDialog.lateralMovement"), t("debriefDialog.persistence"), t("debriefDialog.commandAndControl")][index];
              return <section key={id} style={{ "--stage-color": stages[index].color } as CSSProperties}><span className="eyebrow">{t("debriefDialog.stage2", { index: index + 1, stagesName: stages[index].name })}<span className={game.revealed.includes(id) ? "found-label" : "missed-label"}>{game.revealed.includes(id) ? t("debriefDialog.found") : t("debriefDialog.unresolved")}</span></span><h3>{attack.title}</h3><p>{attack.evidence}</p><small>{t("debriefDialog.mitreAttCk2", { tactic })}{attackMitre[attack.id].map((technique, position) => <span key={technique}>{position ? ", " : ""}<a href={mitreUrl(technique)} target="_blank" rel="noreferrer">{technique}</a></span>)}<br />{t("debriefDialog.detectableWith2", { list: attack.detect.map(source => procedureById(game, source)?.title).join(", ") })}</small></section>;
            })}
          </div>
          </details>
          <section className="debrief-learning"><h3>{t("debriefDialog.takeThisBack")}</h3><p>{game.turns.some(turn => turn.success && !turn.revealed) ? t("debriefDialog.someActionsPassed") : t("debriefDialog.whichEvidenceSources")}</p><p>{activeScenario.lesson}</p></section>
          <details className="debrief-fold debrief-campaign-fold" id="debrief-campaign">
            <summary>{rich("debriefDialog.campaignAndTeam2", { leadershipTrust: campaign.leadershipTrust, readiness: campaign.readiness, mastery: campaign.mastery[String(game.scenario)] ?? 0 }, { span: chunk => <span>{chunk}</span> })}</summary>
            {/* What this operation did to the campaign, and why. Trust and readiness
                were totals with no change and no reason beside them. */}
            {!!campaignChange.length && <section className="campaign-change"><span className="eyebrow">{t("debriefDialog.whatThisOperation")}</span><ul>{campaignChange.map((line, index) => <li key={index}>{say(line)}</li>)}</ul>{game.mode === "campaign" && <p>{t("debriefDialog.route2", { campaignRoutesTitle: campaignRoutes[routeForCampaign(campaign)].title, routeReason: say(routeReason(campaign)) })}</p>}</section>}
            <section className="capability-review"><span className="eyebrow">{t("debriefDialog.campaignCapabilities")}</span>{unlockedCapabilities(campaign.xp).map(item => <div key={item.title} className={item.unlocked ? "unlocked" : "locked"}><strong>{item.title}</strong><span>{item.unlocked ? item.detail : t("debriefDialog.unlocksAtCampaign", { at: item.at, xp: campaign.xp, itemDetail: item.detail })}</span></div>)}</section>
            <section className="campaign-consequences"><div><span>{t("debriefDialog.leadershipTrust")}</span><strong>{t("debriefDialog.of1004", { leadershipTrust: campaign.leadershipTrust })}</strong></div><div><span>{t("debriefDialog.readiness")}</span><strong>{t("debriefDialog.of1005", { readiness: campaign.readiness })}</strong></div><div><span>{t("debriefDialog.winStreak")}</span><strong>{campaign.streak}</strong></div></section>
            <section className="specialist-reaction"><span className="eyebrow">{t("debriefDialog.teamAfterAction2", { namedSpecialistsName: namedSpecialists[game.specialist].name, specialistBonds: campaign.specialistBonds[game.specialist] ?? 35 })}</span><p>{say(specialistReaction(game.specialist, game.status !== "lost", outcome.breakdown.total, campaign.specialistBonds[game.specialist] ?? 35))}</p>{specialistArc(game.specialist, campaign.specialistBonds[game.specialist] ?? 35) && <p className="specialist-arc">{specialistArc(game.specialist, campaign.specialistBonds[game.specialist] ?? 35)}</p>}</section>
            <section className="mastery-panel"><div><span className="eyebrow">{t("debriefDialog.scenarioMastery")}</span><strong>{campaign.mastery[String(game.scenario)] ? `${campaign.mastery[String(game.scenario)]} of 3` : t("debriefDialog.notYetEarned")}</strong></div><p>{t("debriefDialog.masteryIs1For")}</p></section>
          </details>
          {finalEnding && <section className="campaign-finale"><div><span className="eyebrow">{t("debriefDialog.finalCommandBriefing")}</span><h3>{finalEnding.title}</h3><p>{say(finalEnding.detail)}</p></div></section>}
          {/* What to play next, chosen from this record: the reason quotes it, so
              the advice can be checked against what happened. */}
          {!finalEnding && <section className="next-recommendation" aria-labelledby="next-recommendation-title">
            <span className="eyebrow" id="next-recommendation-title">{t("debriefDialog.suggestedNext")}</span>
            <h3>{say(recommendation!.title)}</h3>
            <p>{say(recommendation!.reason)}</p>
            {/* The same operation played by the Bot Commander from what it can see,
                to show where a reading tested soundly would have gone. */}
            {game.seed !== null
              ? <><p>{t("debriefDialog.orWatchThe")}</p><button className="text-action" onClick={() => replayWithBot(game)}>{t("debriefDialog.replayWithThe")}</button></>
              : <p>{t("debriefDialog.thisCampaignOperation")}</p>}
          </section>}
          {/* A trainer's print: the whole chain and the questions for the room.
              It gives the answer away, which this says before the button does. */}
          <section className="next-recommendation facilitator-offer" aria-labelledby="facilitator-title">
            <span className="eyebrow" id="facilitator-title">{t("debriefDialog.forTrainer")}</span>
            <p>{t("debriefDialog.theFacilitatorSheet")}</p>
            <button className="text-action" onClick={printFacilitatorSheet}>{t("debriefDialog.printFacilitatorSheet")}</button>
          </section>
          <div className="debrief-actions">
            <button className="text-action" onClick={() => window.print()}>{t("debriefDialog.printReview")}</button>
            {!finalEnding && <button className="text-action" onClick={() => { const nextScenario = nextCase(campaign, scenarios.length); resetToBriefing(); setScenarioChoice(nextScenario); }}>{t("debriefDialog.chooseAnotherIncident")}</button>}
            <button className="primary-button" onClick={() => finalEnding ? (() => { const nextScenario = nextCase(campaign, scenarios.length); resetToBriefing(); setScenarioChoice(nextScenario); })() : playRecommended(recommendation!)}>{finalEnding ? t("debriefDialog.returnToCampaign") : t("debriefDialog.setUpThe")}</button>
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
