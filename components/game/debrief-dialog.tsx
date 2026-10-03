import type { CSSProperties } from "react";
import { ArrowRight, Printer, Star, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OWN_SOURCE_BONUS, adversaryObjectives, attacks, getAdversaryProfile, getBeginnerReview, getCounterfactuals, getHypothesisLedger, getLossReason, getOperationalLabel, gameModes, hypotheses, procedureIntensities, procedureScopes, procedureById, scenarios, sectorSystems, stages } from "@/lib/advanced-game";
import { namedSpecialists } from "@/lib/phase8";
import { specialistReaction } from "@/lib/phase9";
import { unlockedCapabilities } from "@/lib/campaign";
import type { GameSession } from "@/hooks/use-game-session";
import { returnFocusToAwaiting } from "@/hooks/use-recover-focus";

export function DebriefDialog({ session }: { session: GameSession }) {
  const {
    debrief, setDebrief, game, outcome, activeScenario, campaign, finalEnding, responseProfile,
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
          <DialogTitle>{game?.status === "won" ? `${outcome?.grade} / ${outcome?.title}` : game?.status === "exercise" ? "Exercise concluded." : game ? `${getLossReason(game).title}.` : ""}</DialogTitle>
          <DialogDescription>{game?.status === "won" ? outcome?.detail : game ? `${game.status === "lost" ? `${getLossReason(game).detail} ` : ""}${game.status === "lost" && getLossReason(game).cause === "window" ? "" : `${game.revealed.length} of 4 stages found in ${game.turns.length} turn${game.turns.length === 1 ? "" : "s"}. `}This is a learning outcome, not a security assessment.` : ""}</DialogDescription>
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
              {[
                ["Investigation", outcome.breakdown.investigation, 25],
                ["Impact control", outcome.breakdown.impact, 15],
                ["Continuity", outcome.breakdown.continuity, 15],
                ["Operational decisions", outcome.breakdown.decisions, 15],
                ["Containment & recovery", outcome.breakdown.response, 20],
                ["Hypothesis accuracy", outcome.breakdown.hypothesis, 10],
              ].map(([label, value, maximum]) => <div key={String(label)}><span>{label}</span><strong>{value}/{maximum}</strong></div>)}
            </div>
          </section>
          <section className="hypothesis-ledger" id="debrief-hypothesis">
            <span className="eyebrow">HYPOTHESIS ACCURACY · {outcome.breakdown.hypothesis}/10</span>
            <details className="debrief-fold">
              <summary>How it is scored, turn by turn<span>{ledger.filter(row => row.matched).length} of {ledger.length} turns named the right route</span></summary>
            <p className="ledger-rule">A turn scores in full when the route you predicted is the route the next unconfirmed stage actually used. It scores half when the prediction was wrong but properly tested — you spent one of that reading&rsquo;s own evidence sources and the check completed, which rules the reading out. That credit is paid once per reading, and only while the record had not already ruled that reading out: declaring one again after its own sources came back empty earns nothing. A failed roll settles nothing either way. Only the hypothesis standing when you act is tested, so revising before you act costs nothing, and choosing one of that reading&rsquo;s own sources adds +{OWN_SOURCE_BONUS} to the roll whichever reading turns out to be right.</p>
            {ledger.map(row => (
              <div key={row.turn} className={row.matched ? "matched" : "missed"}>
                <span>{String(row.turn).padStart(2, "0")}</span>
                <p>
                  <strong>{row.predicted ? `Predicted: ${row.predicted}` : "No hypothesis recorded"}</strong>
                  <small>Tested against {row.testedAgainst.toLowerCase()} · {row.procedure} {row.discriminating ? "could have exposed it" : "could not have exposed it"}</small>
                  <em>{row.verdict}</em>
                </p>
                <b>{row.matched ? "CREDIT" : "NO CREDIT"}{row.bonus > 0 ? ` · +${row.bonus}` : ""}</b>
              </div>
            ))}
            </details>
          </section>
          <section className="advanced-review">
            <div><strong>{game.revealed.length}/4</strong><span>Attack stages confirmed</span></div>
            <div><strong>{game.evidence.filter(item => item.supports).length}</strong><span>Findings that confirmed a stage</span></div>
            <div><strong>{game.evidence.filter(item => !item.supports).length}</strong><span>Findings that settled nothing</span></div>
            <div><strong>{game.correlations.filter(item => item.correct).length}/{game.correlations.length}</strong><span>Correlation assessments supported</span></div>
            <div><strong>{game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0)}</strong><span>Hypothesis revisions</span></div>
            <div><strong>{game.turns.filter(turn => turn.planningBonus > 0).length}</strong><span>Evidence-aligned actions</span></div>
            <div><strong>{game.commandHistory.length}</strong><span>Command events resolved</span></div>
            <div><strong>{game.setPieceHistory.length}</strong><span>Sector decisions resolved</span></div>
          </section>
          <section className="mission-consequences">
            <div><span className="eyebrow">SECTOR OUTCOME</span><strong>{game.sectorHealth}/100 · {sectorSystems[game.scenario].title}</strong><p>{sectorSystems[game.scenario].rule}</p></div>
            <div><span className="eyebrow">ADVERSARY INTENT</span><strong>{adversaryObjectives[game.objective].title} · {game.objectiveProgress}/100</strong><p>{adversaryObjectives[game.objective].tell}</p>{game.revealed.includes(game.chain[3]) && <p className="intent-link"><strong>{attacks.find(attack => attack.id === game.chain[3])?.title}:</strong> {adversaryObjectives[game.objective].outbound}</p>}</div>
            <div><span className="eyebrow">COMMAND TEAM</span><strong>{namedSpecialists[game.specialist].name} · fatigue {game.specialistFatigue}/6</strong><p>{gameModes[game.mode].title} operation against {getAdversaryProfile(game).title}. Team fatigue and leadership confidence carry into the next campaign mission.</p></div>
          </section>
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
              {game.decisions.map((record, index) => <p key={`${record.stage}-${index}`}><strong>{attacks.find(attack => attack.id === record.stage)?.title}:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.rationale}</em><em>Impact {record.impactChange >= 0 ? "+" : ""}{record.impactChange} · {getOperationalLabel(game).toLowerCase()} {record.continuityChange >= 0 ? "+" : ""}{record.continuityChange} · Tempo {record.tempoChange >= 0 ? "+" : ""}{record.tempoChange} · Sector {record.sectorChange >= 0 ? "+" : ""}{record.sectorChange} · Objective {record.objectiveChange >= 0 ? "+" : ""}{record.objectiveChange}</em>{record.adaptedTo && <em>Actor adaptation: {record.adaptationReason ?? `the hidden route changed to ${attacks.find(attack => attack.id === record.adaptedTo)?.title}.`}</em>}</p>)}
              {game.commandHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>Command event:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.effect}</em></p>)}
              {game.setPieceHistory.map((record, index) => <p key={`${record.event}-${index}`}><strong>Sector decision:</strong> {record.title}<span>Quality {record.quality}/5</span><em>{record.effect}</em></p>)}
              {game.responseChoices.map(id => {
                const option = responseProfile ? [...responseProfile.containment, ...responseProfile.assurance, ...responseProfile.recovery].find(item => item.id === id) : undefined;
                return <p key={id}><strong>Response:</strong> {option?.title}<span>{option?.confidence} confidence · {option?.residual} residual risk</span></p>;
              })}
              {game.mapHistory.map((record, index) => <p key={`${record.node}-${index}`}><strong>Infrastructure:</strong> {record.action === "isolate" ? "Isolated" : "Monitored"} {record.node}<span>Map action</span><em>{record.effect}</em></p>)}
              </details>
            </div>
          )}
          <section className="counterfactuals"><span className="eyebrow">WHAT MIGHT HAVE CHANGED</span><details className="debrief-fold"><summary>Other calls you could have made<span>{getCounterfactuals(game).length} alternatives</span></summary>{getCounterfactuals(game).map((item, index) => <p key={index}>{item}</p>)}</details></section>
          <section className="evidence-review"><span className="eyebrow">EVIDENCE RECONSTRUCTION</span><details className="debrief-fold"><summary>Every finding<span>{game.evidence.length} finding{game.evidence.length === 1 ? "" : "s"} · {game.evidence.filter(item => item.supports).length} confirmed a stage</span></summary>{game.evidence.map(item => <div key={item.id}><strong>{item.id} · {item.title}</strong><span>{item.system} · {item.source} · {item.confidence}</span><p>{item.detail}</p></div>)}</details></section>
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
          <section className="capability-review" id="debrief-campaign"><span className="eyebrow">CAMPAIGN CAPABILITIES</span>{unlockedCapabilities(campaign.xp).map(item => <div key={item.title} className={item.unlocked ? "unlocked" : "locked"}><strong>{item.title}</strong><span>{item.unlocked ? item.detail : "Continue the campaign to unlock this milestone."}</span></div>)}</section>
          <section className="campaign-consequences"><div><span>Leadership trust</span><strong>{campaign.leadershipTrust}/100</strong></div><div><span>Readiness</span><strong>{campaign.readiness}/100</strong></div><div><span>Win streak</span><strong>{campaign.streak}</strong></div></section>
          <section className="specialist-reaction"><span className="eyebrow">TEAM AFTER-ACTION NOTE · COHESION {campaign.specialistBonds[game.specialist] ?? 35}/100</span><p>{specialistReaction(game.specialist, game.status === "won", outcome.breakdown.total, campaign.specialistBonds[game.specialist] ?? 35)}</p></section>
          <section className="mastery-panel"><div><span className="eyebrow">SCENARIO MASTERY</span><strong>{Array.from({ length: campaign.mastery[String(game.scenario)] ?? 0 }).map((_, index) => <Star key={index} size={18} fill="currentColor" />)}{!campaign.mastery[String(game.scenario)] && "Not yet earned"}</strong></div><p>One star for recovery, two for a score of 74+, and three for a score of 88+.</p></section>
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
