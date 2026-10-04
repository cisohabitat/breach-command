import type { CSSProperties } from "react";
import { ArrowRight, Printer, Star, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OWN_SOURCE_BONUS, adversaryObjectives, attacks, describeMeterChange, getAdversaryProfile, getBeginnerReview, getCounterfactuals, getHypothesisLedger, getLossReason, getOperationalLabel, getScoreRows, gameModes, hypotheses, infrastructureTopologies, inSentence, procedureIntensities, procedureScopes, procedureById, responseOptionsFor, scenarios, sectorSystems, stages } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { specialistReaction } from "@/lib/phase9";
import { unlockedCapabilities } from "@/lib/campaign";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";
import { objectiveTheory } from "@/lib/phase9";

export function DebriefDialog({ session }: { session: GameSession }) {
  const {
    debrief, setDebrief, game, outcome, activeScenario, campaign, finalEnding,
    resetToBriefing, setScenarioChoice,
  } = session;
  const ledger = game ? getHypothesisLedger(game) : [];
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
      <DialogContent className="game-dialog wide-dialog debrief-dialog" data-outcome={game?.status ?? "none"} onCloseAutoFocus={returnFocusToAwaiting}>
        <DialogHeader>
          <div className="eyebrow">AFTER-ACTION REVIEW</div>
          <DialogTitle>{game?.status === "won" ? outcome?.title : game?.status === "exercise" ? "Exercise concluded." : game ? `${getLossReason(game).title}.` : ""}</DialogTitle>
          <DialogDescription>{game?.status === "won" ? outcome?.detail : game ? `${game.status === "lost" ? `${getLossReason(game).detail} ` : ""}${game.status === "lost" && getLossReason(game).cause === "window" ? "" : `${game.revealed.length} of 4 stages found in ${game.turns.length} turn${game.turns.length === 1 ? "" : "s"}. `}This is a learning outcome, not a security assessment.` : ""}</DialogDescription>
          {/* The grade and the score are the review's headline. Below four other
              blocks, the score sat under the fold of a laptop screen. A grade is
              only given to a completed response. */}
          {game && outcome && (
            <p className="debrief-verdict">
              {game.status === "won" && <b><span className="sr-only">Grade </span>{outcome.grade}</b>}
              <span><strong>{outcome.breakdown.total}</strong>/100 final score</span>
              <span>{game.revealed.length} of 4 stages · {game.turns.length} turn{game.turns.length === 1 ? "" : "s"}</span>
            </p>
          )}
        </DialogHeader>
        {game && outcome && <>
          <section className="first-read" aria-label="Before the detail">
            <span className="eyebrow">BEFORE THE DETAIL</span>
            {(() => {
              const review = getBeginnerReview(game);
              return (
                <dl>
                  <div><dt>What went well</dt><dd>{review.strength}</dd></div>
                  <div><dt>What to look at</dt><dd>{review.gap}</dd></div>
                  <div><dt>The idea behind it</dt><dd>{review.concept}</dd></div>
                  <div><dt>One thing to try</dt><dd>{review.next}</dd></div>
                </dl>
              );
            })()}
          </section>
          <nav className="debrief-index" aria-label="Review sections">
            {[
              ["debrief-score", "Score"],
              ["debrief-hypothesis", "Hypothesis"],
              ["debrief-timeline", "Timeline"],
              ["debrief-decisions", "Decisions"],
              ["debrief-chain", "Attack chain"],
              ["debrief-campaign", "Campaign"],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => openSection(id)}>{label}</button>
            ))}
          </nav>
          <div className="debrief-stats">
            <div><strong>{game.turns.filter(turn => turn.success).length}/{game.turns.length}</strong><span>Rolls succeeded</span></div>
            <div><strong>{game.impact}</strong><span>Final impact</span></div>
            <div><strong>{game.continuity}</strong><span>{getOperationalLabel(game)}</span></div>
          </div>
          <section className="score-card" id="debrief-score">
            <div className="score-total"><span>FINAL SCORE</span><strong>{outcome.breakdown.total}<small>/100</small></strong></div>
            <div className="score-breakdown">
              {getScoreRows(game).map(row => <div key={row.label}><span>{row.label}</span><strong>{row.value}/{row.maximum}</strong><small>{row.rule}</small></div>)}
            </div>
          </section>
          <section className="hypothesis-ledger" id="debrief-hypothesis">
            <span className="eyebrow">HYPOTHESIS ACCURACY · {outcome.breakdown.hypothesis}/10</span>
            <details className="debrief-fold">
              <summary>How it is scored, turn by turn<span>{ledger.filter(row => row.matched).length} of {ledger.length} turns named the right route{ledger.some(row => !row.matched && row.credit > 0) ? `, ${ledger.filter(row => !row.matched && row.credit > 0).length} ruled a wrong one out` : ""}</span></summary>
            <p className="ledger-rule">A turn scores in full when the route you predicted is the route the next unconfirmed stage actually used. It scores half when the prediction was wrong but properly tested — you spent one of that reading&rsquo;s own evidence sources and the check completed. That half is paid once per reading at each stage, and only while the record had not already ruled that reading out: declaring one again after its own sources came back empty earns nothing. A right prediction scores whatever the roll; a failed roll cannot rule a wrong one out, so it earns nothing. Only the hypothesis standing when you act is tested, so revising before you act costs nothing, and choosing one of that reading&rsquo;s own sources adds +{OWN_SOURCE_BONUS} to the roll whichever reading turns out to be right.</p>
            {ledger.map(row => (
              <div key={row.turn} className={row.matched ? "matched" : row.credit > 0 ? "half" : "missed"}>
                <span>{String(row.turn).padStart(2, "0")}</span>
                <p>
                  <strong>{row.predicted ? `Predicted: ${row.predicted}` : "No hypothesis recorded"}</strong>
                  <small>Tested against {inSentence(row.testedAgainst)} · {row.procedure} {row.discriminating ? "could have exposed it" : "could not have exposed it"}{row.bonus > 0 ? ` · own source, +${row.bonus} to the roll` : ""}</small>
                  <em>{row.verdict}</em>
                </p>
                <b>{row.credit === 1 ? "FULL CREDIT" : row.credit > 0 ? "HALF CREDIT" : "NO CREDIT"}</b>
              </div>
            ))}
            </details>
          </section>
          {/* The counts and the three outcomes are detail for a player who wants it.
              Open, they were a thousand pixels between the score and the ledger. */}
          <details className="debrief-fold debrief-detail-fold">
            <summary>Operation detail<span>{game.revealed.length}/4 stages · {game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0)} revisions · sector {game.sectorHealth}/100</span></summary>
            <section className="advanced-review">
              <div><strong>{game.revealed.length}/4</strong><span>Attack stages confirmed</span></div>
              <div><strong>{game.evidence.filter(item => item.supports).length}</strong><span>Findings that confirmed a stage</span></div>
              <div><strong>{game.evidence.filter(item => !item.supports).length}</strong><span>Findings that found no stage</span></div>
              <div><strong>{game.correlations.filter(item => item.correct).length}/{game.correlations.length}</strong><span>Correlation assessments supported</span></div>
              <div><strong>{game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0)}</strong><span>Hypothesis revisions</span></div>
              <div><strong>{game.turns.filter(turn => turn.planningBonus > 0).length}</strong><span>Evidence-aligned actions</span></div>
              <div><strong>{game.commandHistory.length}</strong><span>Command events resolved</span></div>
              <div><strong>{game.setPieceHistory.length}</strong><span>Sector decisions resolved</span></div>
            </section>
            <section className="mission-consequences">
              <div><span className="eyebrow">SECTOR OUTCOME</span><strong>{game.sectorHealth}/100 · {sectorSystems[game.scenario].title}</strong><p>{sectorSystems[game.scenario].rule}</p></div>
              <div><span className="eyebrow">ADVERSARY INTENT</span><strong>{adversaryObjectives[game.objective].title} · {game.objectiveProgress}/100</strong><p>{adversaryObjectives[game.objective].tell}</p>
                {/* A recorded theory was never judged anywhere, so a player could not
                    learn whether the reading of intent had been right. */}
                <p className="theory-verdict">{!game.caseTheory ? "No case theory was recorded." : game.caseTheory === game.objective ? `Your case theory, ${objectiveTheory[game.caseTheory].title.toLowerCase()}, was right.` : `Your case theory was ${objectiveTheory[game.caseTheory].title.toLowerCase()}; the actor was after ${objectiveTheory[game.objective].title.toLowerCase()}.`}</p>{game.revealed.includes(game.chain[3]) && <p className="intent-link"><strong>{attacks.find(attack => attack.id === game.chain[3])?.title}:</strong> {adversaryObjectives[game.objective].outbound}</p>}</div>
              <div><span className="eyebrow">COMMAND TEAM</span><strong>{namedSpecialists[game.specialist].name} · fatigue {game.specialistFatigue}/6</strong><p>{gameModes[game.mode].title} operation against {getAdversaryProfile(game).title}. Team fatigue and leadership confidence carry into the next campaign mission.</p></div>
            </section>
          </details>
          <section className="timeline" id="debrief-timeline">
            <span className="eyebrow">EVIDENCE &amp; DECISION TIMELINE</span>
            <details className="debrief-fold">
              <summary>Turn by turn<span>{game.turns.length} turn{game.turns.length === 1 ? "" : "s"} · {game.turns.filter(turn => turn.revealed).length} found a stage</span></summary>
            {game.turns.map(turn => (
              <div key={turn.number}>
                <span>{String(turn.number).padStart(2, "0")}</span>
                <p><strong>{procedureById(game, turn.procedure)?.title}</strong>{turn.hypothesis ? ` · Hypothesis: ${hypotheses.find(item => item.id === turn.hypothesis)?.title}` : " · No hypothesis recorded"}<small>{procedureScopes[turn.plan.scope].title} scope · {procedureIntensities[turn.plan.intensity].title} analysis · {turn.revealed ? `Revealed ${attacks.find(attack => attack.id === turn.revealed)?.title}` : turn.narrative}</small></p>
              </div>
            ))}
            </details>
          </section>
          {(game.decisions.length > 0 || game.commandHistory.length > 0 || game.setPieceHistory.length > 0) && (
            <div className="decision-summary" id="debrief-decisions">
              <span className="eyebrow">YOUR DECISIONS</span>
              <details className="debrief-fold">
                <summary>Every decision<span>{game.decisions.length + game.commandHistory.length + game.setPieceHistory.length + game.responseChoices.length + game.mapHistory.length} recorded, with quality and reasoning</span></summary>
              {game.decisions.map((record, index) => <p key={`${record.stage}-${index}`}><strong>{attacks.find(attack => attack.id === record.stage)?.title}:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.rationale}</em><em>{[...([["impact", record.impactChange], ["continuity", record.continuityChange], ["sector", record.sectorChange], ["objective", record.objectiveChange]] as const).filter(([, change]) => change).map(([meter, change]) => describeMeterChange(game, meter, change)), record.tempoChange ? `adversary pace ${record.tempoChange > 0 ? "faster" : "slower"}` : ""].filter(Boolean).join(" · ") || "No meter moved"}</em>{record.adaptedTo && <em>Actor adaptation: {record.adaptationReason ?? `the hidden route changed to ${attacks.find(attack => attack.id === record.adaptedTo)?.title}.`}</em>}</p>)}
              {game.commandHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>Command event:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.effect}</em></p>)}
              {game.setPieceHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>Sector decision:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.effect}</em></p>)}
              {/* Each response phase graded against the best its sector offered, so
                  a containment-and-recovery score below full says which call cost it. */}
              {(["containment", "assurance", "recovery"] as const).map((phase, index) => {
                const options = responseOptionsFor(game)[phase];
                const chosen = options.find(option => option.id === game.responseChoices[index]);
                if (!chosen) return null;
                const best = Math.max(...options.map(option => option.score));
                return <p key={phase}><strong>{phase.charAt(0).toUpperCase() + phase.slice(1)}:</strong> {chosen.title}<span>{chosen.score} of a best {best} · {chosen.confidence.toLowerCase()} confidence · {chosen.residual.toLowerCase()} residual risk</span><em>{chosen.score === best ? "The strongest option this sector offered." : `${options.find(option => option.score === best)!.title} would have scored more here.`}</em></p>;
              })}
              {game.mapHistory.map((record, index) => <p key={`${record.node}-${index}`}><strong>Infrastructure:</strong> {record.action === "isolate" ? "Isolated" : "Monitored"} {infrastructureTopologies[game.scenario].nodes.find(node => node.id === record.node)?.label ?? record.node}<span>Map action</span><em>{record.effect}</em></p>)}
              </details>
            </div>
          )}
          <section className="counterfactuals"><span className="eyebrow">WHAT MIGHT HAVE CHANGED</span><details className="debrief-fold"><summary>Other calls you could have made<span>{getCounterfactuals(game).length} alternatives</span></summary>{getCounterfactuals(game).map((item, index) => <p key={index}>{item}</p>)}</details></section>
          <section className="evidence-review"><span className="eyebrow">EVIDENCE RECONSTRUCTION</span><details className="debrief-fold"><summary>Every finding<span>{game.evidence.length} finding{game.evidence.length === 1 ? "" : "s"} · {game.evidence.filter(item => item.supports).length} confirmed a stage</span></summary>{game.evidence.map(item => <div key={item.id}><strong>{`Turn ${item.turn}`} · {item.title}</strong><span>{item.system} · {item.source} · {item.confidence}</span><p>{item.detail}</p></div>)}</details></section>
          <details className="debrief-fold debrief-chain-fold" id="debrief-chain">
            <summary>The attack chain<span>{game.revealed.length} of 4 stages confirmed · see what each one was</span></summary>
          <div className="debrief-chain">
            {game.chain.map((id, index) => {
              const attack = attacks.find(item => item.id === id)!;
              const tactic = ["Initial Access", "Lateral Movement", "Persistence", "Command and Control / Exfiltration"][index];
              return <section key={id} style={{ "--stage-color": stages[index].color } as CSSProperties}><span className="eyebrow">0{index + 1} / {stages[index].name}<span className={game.revealed.includes(id) ? "found-label" : "missed-label"}>{game.revealed.includes(id) ? "FOUND" : "UNRESOLVED"}</span></span><h3>{attack.title}</h3><p>{attack.evidence}</p><small>MITRE ATT&amp;CK lens: {tactic}<br />Detectable with: {attack.detect.map(source => procedureById(game, source)?.title).join(" · ")}</small></section>;
            })}
          </div>
          </details>
          <section className="debrief-learning"><h3>Take this back to your team</h3><p>{game.turns.some(turn => turn.success && !turn.revealed) ? "Some actions passed without finding new evidence. Did each action separate plausible explanations, or simply use an available tool?" : "Which evidence sources or decision authorities would be weakest in a real response?"}</p><p>{activeScenario.lesson}</p></section>
          <details className="debrief-fold debrief-campaign-fold" id="debrief-campaign">
            <summary>Campaign and team<span>trust {campaign.leadershipTrust} · readiness {campaign.readiness} · {campaign.mastery[String(game.scenario)] ?? 0} mastery stars</span></summary>
            <section className="capability-review"><span className="eyebrow">CAMPAIGN CAPABILITIES</span>{unlockedCapabilities(campaign.xp).map(item => <div key={item.title} className={item.unlocked ? "unlocked" : "locked"}><strong>{item.title}</strong><span>{item.unlocked ? item.detail : "Continue the campaign to unlock this milestone."}</span></div>)}</section>
            <section className="campaign-consequences"><div><span>Leadership trust</span><strong>{campaign.leadershipTrust}/100</strong></div><div><span>Readiness</span><strong>{campaign.readiness}/100</strong></div><div><span>Win streak</span><strong>{campaign.streak}</strong></div></section>
            <section className="specialist-reaction"><span className="eyebrow">TEAM AFTER-ACTION NOTE · COHESION {campaign.specialistBonds[game.specialist] ?? 35}/100</span><p>{specialistReaction(game.specialist, game.status === "won", outcome.breakdown.total, campaign.specialistBonds[game.specialist] ?? 35)}</p></section>
            <section className="mastery-panel"><div><span className="eyebrow">SCENARIO MASTERY</span><strong>{Array.from({ length: campaign.mastery[String(game.scenario)] ?? 0 }).map((_, index) => <Star key={index} size={18} fill="currentColor" />)}{!campaign.mastery[String(game.scenario)] && "Not yet earned"}</strong></div><p>One star for recovery, two for a score of 74+, and three for a score of 88+.</p></section>
          </details>
          {finalEnding && <section className="campaign-finale"><Trophy size={23} /><div><span className="eyebrow">FINAL COMMAND BRIEFING</span><h3>{finalEnding.title}</h3><p>{finalEnding.detail}</p></div></section>}
          <div className="debrief-actions">
            <button className="secondary-button" onClick={() => window.print()}><Printer size={17} /> Print review</button>
            <button className="primary-button" onClick={() => { const nextScenario = (game.scenario + 1) % scenarios.length; resetToBriefing(); setScenarioChoice(nextScenario); }}>{finalEnding ? "Return to campaign command" : "Choose next incident"} <ArrowRight size={18} /></button>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}
