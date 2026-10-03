// The after-action review: score, outcome, hypothesis ledger and counterfactuals.
import { attacks, difficulties, scenarios, stages, hypotheses, scenarioDynamics } from "../game.ts";
import { gameModes, sectorSystems } from "../command-systems.ts";
import { encodeChallenge } from "../phase8.ts";
import { inSentence } from "./content.ts";
import { type BeginnerReview, type Game, type HypothesisLedgerRow, type ScoreBreakdown } from "./types.ts";
import { clamp, hypothesisSources, procedureById, responseOptionsFor } from "./rules.ts";
import { getHypothesisStanding, getLossReason, getReadingOdds, readyToCorrelate } from "./reads.ts";

// The full review is written for someone who already knows the trade. A first
// operation needs four sentences before any of it: one thing that went well, one
// that did not, the idea behind it, and one concrete change to try.
export function getBeginnerReview(game: Game): BeginnerReview {
  const breakdown = getScoreBreakdown(game);
  const tested = game.turns.filter(turn => turn.hypothesis && turn.hypothesisTarget);
  const aligned = tested.filter(turn => turn.hypothesisMatched).length;
  const emptySuccesses = game.turns.filter(turn => turn.success && !turn.revealed).length;
  const revisions = game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0);

  const strength = game.revealed.length === 4
    ? `You confirmed the whole attack chain — all four stages — in ${game.turns.length} turns.`
    : game.impact <= 40
      ? `You kept business impact down to ${game.impact} while the picture was still forming, which buys the team room to work.`
      : game.revealed.length
        ? `You confirmed ${game.revealed.length} of 4 stages under real pressure, and the record you built is where the next shift starts.`
        // With nothing confirmed, praise for the stages found would be false.
        // What a player did earn is the checks that completed and ruled
        // something out, or, if none did, a record that says the dice were part of it.
        : emptySuccesses
          ? `No stage was confirmed, but ${emptySuccesses === 1 ? "your 1 completed check ruled out what its source" : `each of your ${emptySuccesses} completed checks ruled out what its source`} could see, which narrows the search for the next shift.`
          : `No check completed before the operation closed, so the record says more about the pressure and the dice than about your reasoning.`;

  // Reading the route is the skill the game is built on, so a reading that was
  // wrong more often than right is named before an untested correlation. In the
  // other order a player who held a dead route for a whole operation was told
  // only about the correlation.
  // A player who revised as the standing asked and still missed was told to
  // revise when the standing weakens — advice they had just followed. Name what
  // the record shows instead: a reading carried into a new stage, readings left
  // untested by their own sources, or the ordinary cost of open routes.
  if (tested.length && aligned * 2 < tested.length && revisions >= 2) {
    const stageOfAttack = (id: string) => attacks.find(item => item.id === id)!.stage;
    const misses = tested.filter(turn => !turn.hypothesisMatched);
    const carried = misses.filter(turn => {
      const stage = stageOfAttack(turn.hypothesisTarget!);
      const declared = game.hypothesisHistory.filter(entry => entry.turn <= turn.number).pop()?.turn ?? 1;
      const opened = game.turns.find(earlier => [earlier.revealed, earlier.injectReveal].some(id => !!id && stageOfAttack(id) === stage - 1));
      return stage > 0 && !!opened && declared <= opened.number;
    }).length;
    const untested = misses.filter(turn => !turn.success || !hypothesisSources(game, turn.hypothesis!).includes(turn.procedure)).length;
    const gap = `Your working hypothesis matched the route actually under test on ${aligned} of ${tested.length} turns, though you revised it ${revisions} times.`;
    if (carried * 2 >= misses.length) return {
      strength,
      gap: `${gap} On ${carried} of the misses you were still testing a reading chosen for an earlier stage.`,
      concept: "Each stage of an intrusion can travel a different route: a stolen account can open the way in and a compromised server can carry the data out. Confirming one stage answers that stage and opens the next question.",
      next: "Next operation, as soon as a stage is confirmed, compare the four readings again and choose the one that fits the next stage before you run another procedure.",
    };
    if (untested * 2 >= misses.length) return {
      strength,
      gap: `${gap} On ${untested} of the misses the check either failed or used a source the reading does not predict, so it could not rule the reading out.`,
      concept: "A wrong reading is only corrected by a completed check of one of its own sources. A failed roll or another reading's source leaves it exactly as open as before.",
      next: "Next operation, run a procedure marked “Own source” for the reading you hold, so that an empty result rules it out instead of leaving it standing.",
    };
    return {
      strength,
      gap: `${gap} You tested each reading with its own sources, which is the habit; with three or four routes open at most stages, some misses are the cost of finding out.`,
      concept: "A wrong reading tested properly is how the right one is found, and it still earns half its credit in the hypothesis score. What costs turns is testing a route the record has already ruled out.",
      next: game.mode === "expert"
        ? "Next operation, keep your own tally of the routes your completed checks have ruled out, and never declare one of them again."
        : "Next operation, when a reading weakens, compare all four before choosing the next, and pass over any the comparison marks as ruled out.",
    };
  }
  if (tested.length && aligned * 2 < tested.length) return {
    strength,
    gap: `Your working hypothesis matched the route actually under test on ${aligned} of ${tested.length} turns${revisions === 0 ? ", and you never revised it" : ""}.`,
    concept: "A hypothesis is a prediction you are trying to break, not a label to keep. When the evidence sources it predicts come back empty, that is the evidence telling you to change it.",
    // Expert withholds the standing, so the advice is the same habit without it.
    next: game.mode === "expert"
      ? "Next operation, keep your own tally of which of the reading's sources have come back empty from a completed check, and change the reading once they have, before you spend another turn."
      : "Next operation, watch the reading's standing on the hypothesis board. When it says weakening, change the reading before you spend another turn.",
  };
  // A loss to a meter, not the window, is the thing to look at: a playtest that
  // read the route well and lost to the sector margin was told about empty
  // checks. Its advice names the meter and what moves it.
  if (game.status === "lost" && getLossReason(game).cause !== "window") {
    const reason = getLossReason(game);
    return {
      strength,
      gap: `The operation was lost: ${reason.title.charAt(0).toLowerCase()}${reason.title.slice(1)}.`,
      concept: "Business impact, service integrity, adversary progress and the sector's own margin decide an operation as surely as the evidence does. A sound investigation still has to finish before one of them runs out.",
      next: reason.cause === "sector"
        ? `Next operation, watch the sector margin under the case title. ${sectorSystems[game.scenario].rule}`
        : "Next operation, watch the three readouts on the top row, and when one is near its limit, choose the decision or response option that relieves it before you run another procedure.",
    };
  }
  // Two confirmed stages on the turn the operation ended left no turn to compare
  // them in, and a playtest was told it "never tested" what it never could.
  if (readyToCorrelate(game) && readyToCorrelate(recordBefore(game, game.turns.length - 1))) return {
    strength,
    gap: `You confirmed ${game.evidence.filter(item => item.supports).length} stages but never tested how any two of them relate.`,
    concept: "Two things happening close together is not the same as one causing the other. Saying which it is — and being willing to be wrong — is the core of the work.",
    next: "Next operation, once two findings have confirmed stages, select them in the evidence workspace and decide whether one plausibly enabled the other before you run another procedure.",
  };
  // Empty checks of the reading's own sources are the reading being ruled out,
  // and telling that player to "prefer a source the reading predicts" told them
  // to do what they had done twelve times.
  const emptyOffReading = game.turns.filter(turn => turn.success && !turn.revealed && turn.hypothesis && !hypothesisSources(game, turn.hypothesis).includes(turn.procedure)).length;
  // A player who revised on those empty checks did what this would tell them.
  // "The turns are lost when the reading is kept after it" only fits a player
  // who kept a reading the board had already called weakening or unsupported.
  const keptAgainst = game.turns.filter((turn, index) => turn.hypothesis && ["weakening", "unsupported"].includes(getHypothesisStanding({ ...recordBefore(game, index), hypothesis: turn.hypothesis }).level)).length;
  if (emptySuccesses >= 3 && (emptyOffReading * 2 >= emptySuccesses || (revisions < 2 && keptAgainst > 0))) return emptyOffReading * 2 >= emptySuccesses ? {
    strength,
    gap: `${emptySuccesses} of your successful checks produced no new stage, and ${emptyOffReading} of them used a source your reading did not predict.`,
    concept: "A check that succeeds but finds nothing has still cost a turn. Choosing where to look matters more than how hard you look.",
    next: "Next operation, prefer a source your current reading actually predicts — the card says so before you commit — over whichever tool is available.",
  } : {
    strength,
    gap: `${emptySuccesses} of your successful checks produced no new stage, most of them from your reading's own sources.`,
    concept: "An empty check of the reading's own source is not wasted: it is the evidence that the reading is wrong. The turns are lost when the reading is kept after it.",
    next: game.mode === "expert"
      ? "Next operation, change the reading after its own sources have come back empty twice at the same stage, before you spend another turn."
      : "Next operation, when the reading's own sources come back empty, open the comparison of all four and move to one that is not marked as ruled out before you spend another turn.",
  };
  // Only a completed response has a cost to judge. A run that never reached it
  // would otherwise be told its response was too expensive.
  if (game.responseChoices.length === 3 && breakdown.response < 16) return {
    strength,
    // It told a player to "pick the cheapest" beside a decision record naming the
    // costlier option as the stronger one in every phase.
    gap: `The response scored ${breakdown.response} of 20: in at least one phase another option closed more of the confirmed risk.`,
    concept: "Containment, assurance and recovery each trade disruption against certainty. The option that closes the risk you confirmed scores highest, even when it costs more service, unless that cost would end the operation.",
    next: "Next operation, read each response option's confidence and residual risk before its cost; the decision record below names the stronger option in each phase.",
  };
  // Picking sources that find things and reading the route correctly are two
  // different skills, and a run can do the first well while getting the second
  // wrong. Telling such a player that nothing stands out tells them they were
  // right when the score already said they were not.
  if (tested.length && aligned < tested.length && breakdown.hypothesis < 8) return {
    strength,
    gap: `Your evidence selection worked, but the reading you were testing matched the route the stage actually used on only ${aligned} of ${tested.length} turns${turnCredits(game).filter(item => item.reason === "tested").length ? `, though ${turnCredits(game).filter(item => item.reason === "tested").length} of the others were wrong readings you tested properly` : ""}.`,
    concept: "Finding a stage and classifying it are separate skills. A source can turn one up while the route you named for it is wrong, which is why the score counts them apart.",
    next: `Next operation, when a stage is confirmed, ${game.difficulty === "training" ? "read what the team is seeing at the next one" : "read the current intelligence again"} and choose its reading afresh: routes change from stage to stage${revisions === 0 ? ", and you kept one reading for the whole of this operation" : ""}.`,
  };
  // The decisions are fifteen points of the score and a playtest was told
  // nothing stood out beside calls graded one and two out of five. The weakest
  // is named with the reason it was weak at the time.
  const weakest = [...game.decisions].sort((a, b) => a.quality - b.quality)[0];
  if (weakest && weakest.quality <= 2) return {
    strength,
    gap: `Your weakest call was “${weakest.title}” on ${attacks.find(item => item.id === weakest.stage)?.title.toLowerCase() ?? "a confirmed stage"}: ${weakest.rationale.charAt(0).toLowerCase()}${weakest.rationale.slice(1)}`,
    concept: "No response is right in every incident. What decides it is the pressure at that moment: how high business impact is, how fast the actor is moving, and how much margin the service and the sector have left.",
    next: "Next operation, before choosing a response, look at business impact and the actor's pace, which the Training decision states and the hypothesis board shows. Above about half, or once the actor is accelerating, act or contain; while both are low, watching or attributing is affordable.",
  };
  if (game.status === "lost") return {
    strength,
    gap: "The operation was lost: the investigation window closed before the chain was complete.",
    concept: "The window is where a misread stage runs out: each turn spent on a reading the record has already turned against is a turn the last stage does not get.",
    next: "Next operation, revise as soon as the reading weakens, and spend each turn on a source that can still settle the stage under test.",
  };
  return {
    strength,
    gap: "Nothing stands out as a misunderstanding in this operation.",
    concept: "The habit to keep is the one you just used: predict, test with a source that can settle it, then revise when it cannot.",
    next: "Next operation, try a harder difficulty or a sector you have not commanded, and see whether the same reasoning holds when the pressure is different.",
  };
}

// The visible record as it stood before a turn: the turns played, the stages
// confirmed by them and the decisions taken on those stages.
function recordBefore(game: Game, index: number): Game {
  const turns = game.turns.slice(0, index);
  const revealed = turns.flatMap(turn => [turn.revealed, turn.injectReveal]).filter((id): id is string => !!id);
  return { ...game, turns, revealed, decisions: game.decisions.filter(item => revealed.includes(item.stage)) };
}

export function getScoreBreakdown(game: Game): ScoreBreakdown {
  const investigation = clamp(25 - Math.max(0, game.turns.length - 4) * 3, 0, 25);
  const impact = Math.round((100 - game.impact) * 0.15);
  const continuity = Math.round(((game.continuity + game.sectorHealth) / 2) * 0.15);
  const decisionItems = [...game.decisions.map(item => item.quality), ...game.commandHistory.map(item => item.quality), ...game.setPieceHistory.map(item => item.quality)];
  const decisionQuality = decisionItems.length ? decisionItems.reduce((sum, quality) => sum + quality, 0) / (decisionItems.length * 5) : 0;
  const decisions = Math.round(decisionQuality * 15);
  const response = Math.round(clamp(game.responseScore, 0, 55) / 55 * 20);
  const tested = game.turns.filter(turn => turn.hypothesis && turn.hypothesisTarget);
  // A reading that was properly tested and came back empty is not a guess. The
  // player predicted, spent one of that reading's own sources and got a real
  // negative, which is the loop this game claims to teach — and scoring it zero
  // is why a careful player and a random one both landed on three out of ten.
  // It earns half credit once per reading, so revising is rewarded and repeating
  // the same empty reading is not. A failed roll settles nothing and earns none.
  // Ruling a reading out is worth credit once. Declaring it again after its own
  // sources came back empty is the opposite of the lesson, so those turns earn
  // nothing and still count in the denominator. Nor does testing a reading the
  // record had already excluded. Measured over 800 operations, that took a
  // player choosing readings at random from 4.8 to 3.3 and one who never revises
  // from 5.4 to 4.4, while sound play stayed at 7.5.
  const credit = turnCredits(game).reduce((sum, item) => sum + item.credit, 0);
  const hypothesis = tested.length ? Math.round(clamp(credit / tested.length, 0, 1) * 10) : 0;
  return { investigation, impact, continuity, decisions, response, hypothesis, total: investigation + impact + continuity + decisions + response + hypothesis };
}

export function getOutcome(game: Game) {
  const breakdown = getScoreBreakdown(game);
  if (breakdown.total >= 82) return { grade: "A", title: "Controlled recovery", detail: "You balanced evidence, disruption and service continuity with strong operational judgement.", breakdown };
  if (breakdown.total >= 68) return { grade: "B", title: "Stable, with residual risk", detail: "The incident is contained, but the review identifies avoidable exposure or disruption.", breakdown };
  if (breakdown.total >= 52) return { grade: "C", title: "Costly stabilisation", detail: "Services are recovering, but uncertainty and operational cost remain high.", breakdown };
  return { grade: "D", title: "Fragile recovery", detail: "The immediate crisis passed, but the response left significant residual risk.", breakdown };
}

// Each part of the score, with the rule that produced it in the player's own
// numbers. A bare "7/25" next to "Investigation" read as a verdict with no way
// to do better; the rule beside it says what would have moved it.
export function getScoreRows(game: Game) {
  const breakdown = getScoreBreakdown(game);
  const turns = game.turns.length;
  const decided = game.decisions.length + game.commandHistory.length + game.setPieceHistory.length;
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  return [
    { label: "Investigation", value: breakdown.investigation, maximum: 25, rule: `Full marks for four turns or fewer, then 3 fewer for each turn after the fourth. You took ${plural(turns, "turn")}.` },
    { label: "Impact control", value: breakdown.impact, maximum: 15, rule: `Rises as final business impact falls towards zero. It finished at ${game.impact}.` },
    { label: "Continuity", value: breakdown.continuity, maximum: 15, rule: `${scenarioDynamics[game.scenario].label} and the sector's margin at the end, averaged: ${game.continuity} and ${game.sectorHealth}.` },
    { label: "Operational decisions", value: breakdown.decisions, maximum: 15, rule: decided ? `The average quality of your ${plural(decided, "evidence, command and sector decision")}; the review's decision record grades each one.` : "No decisions were taken, so there was nothing to score." },
    { label: "Containment & recovery", value: breakdown.response, maximum: 20, rule: game.responseChoices.length === 3 ? "Choices that fit the sector's constraint and the adversary's objective score highest; the cheapest option is not always the right one." : "The response phase was not reached, so nothing was scored. It opens once all four stages are confirmed." },
    { label: "Hypothesis accuracy", value: breakdown.hypothesis, maximum: 10, rule: "Full credit for each turn whose reading named the route under test, half for a wrong reading tested properly once. The ledger below goes turn by turn." },
  ];
}

// A result a player can paste anywhere. It carries counts, never the techniques,
// so it spoils nothing for someone about to play the same code.
export function getResultSummary(game: Game): string[] {
  const scenario = scenarios[game.scenario];
  const heading = `Breach Command · ${scenario.title} · ${difficulties[game.difficulty].title} · ${gameModes[game.mode].title}`;
  const record = `${game.revealed.length} of 4 stages confirmed in ${game.turns.length} turn${game.turns.length === 1 ? "" : "s"}`;
  const outcome = getOutcome(game);
  const result = game.status === "won"
    ? `Stood down: grade ${outcome.grade}, ${outcome.breakdown.total}/100`
    : game.status === "exercise"
      ? `Authorised exercise concluded, ${outcome.breakdown.total}/100`
      : `Operation lost: ${getLossReason(game).title.toLowerCase()}, ${outcome.breakdown.total}/100`;
  const code = game.seed === null ? null : encodeChallenge({ scenario: game.scenario, difficulty: game.difficulty, mode: game.mode, specialist: game.specialist, seed: game.seed });
  return [heading, `${result} · ${record}`, ...(code ? [`Play the same operation: ${code}`] : [])];
}

// What each turn earned toward hypothesis accuracy, and why. The score and the
// ledger both read this, so a row can never say "no credit" for a turn the
// score paid half for.
type TurnCredit = { credit: number; reason: "none" | "matched" | "tested" | "failed" | "other-source" | "repeated" | "excluded" | "absent" };
function turnCredits(game: Game): TurnCredit[] {
  const ruledOut = new Set<string>();
  return game.turns.map((turn, index): TurnCredit => {
    if (turn.revealed || turn.injectReveal) ruledOut.clear();
    if (!turn.hypothesis || !turn.hypothesisTarget) return { credit: 0, reason: "none" };
    if (turn.hypothesisMatched) return { credit: 1, reason: "matched" };
    if (!turn.success) return { credit: 0, reason: "failed" };
    if (!hypothesisSources(game, turn.hypothesis).includes(turn.procedure)) return { credit: 0, reason: "other-source" };
    if (ruledOut.has(turn.hypothesis)) return { credit: 0, reason: "repeated" };
    ruledOut.add(turn.hypothesis);
    const before = getReadingOdds(recordBefore(game, index)).candidates[turn.hypothesis];
    if (!before.total) return { credit: 0, reason: "absent" };
    if (!before.open) return { credit: 0, reason: "excluded" };
    return { credit: 0.5, reason: "tested" };
  });
}

export function getHypothesisLedger(game: Game): HypothesisLedgerRow[] {
  const credits = turnCredits(game);
  return game.turns.map((turn, index) => {
    const target = turn.hypothesisTarget;
    const targetAttack = target ? attacks.find(item => item.id === target)! : null;
    const stage = targetAttack ? stages[targetAttack.stage].name : "Every stage was already confirmed";
    const actualRoute = targetAttack ? hypotheses.find(item => item.id === targetAttack.vector)!.title : null;
    const predicted = turn.hypothesis ? hypotheses.find(item => item.id === turn.hypothesis)!.title : null;
    const found = turn.revealed ? attacks.find(item => item.id === turn.revealed)!.title : null;
    const windfallNote = turn.windfall
      ? ` You did expose ${found}, further along the chain — that source is shared between routes, so it was a find rather than a correct prediction.`
      : "";
    const missNote: Record<TurnCredit["reason"], string> = {
      none: "",
      matched: "",
      tested: "You tested it with one of its own sources and the check completed, which is testing it properly: half credit.",
      failed: "The roll failed, so the check settled nothing and the wrong prediction scored nothing.",
      "other-source": "The procedure was not one of that reading's own sources, so it could not rule the reading out, and the prediction scored nothing.",
      repeated: "The half credit for testing a wrong reading properly is paid once at each stage, and this reading had already earned it here; the check still narrowed the search.",
      excluded: "Your earlier checks had already ruled that route out at this stage, so testing it scored nothing.",
      absent: "None of the techniques this incident could use at this stage travels that route, which the board showed as \"cannot explain this stage\", so testing it scored nothing.",
    };
    const verdict = !target ? "No stage left to predict, so this turn could not score."
      : !turn.hypothesis ? "No working hypothesis was recorded, so this turn could not score."
      : turn.hypothesisMatched
        ? (turn.planningBonus > 0
          ? `Correct: ${inSentence(stage)} was on the ${actualRoute!.toLowerCase()} route, and the procedure was one of that reading's own sources. Full credit, and the own-source bonus on the roll.${windfallNote}`
          : `Correct about the route — ${inSentence(stage)} was on the ${actualRoute!.toLowerCase()} route — but the procedure was not one of that reading's sources, so it earned no own-source bonus.${windfallNote}`)
        : `${stage} was on the ${actualRoute!.toLowerCase()} route, not ${predicted!.toLowerCase()}. ${missNote[credits[index].reason]}${windfallNote}`;
    return {
      turn: turn.number,
      procedure: procedureById(game, turn.procedure)!.title,
      predicted,
      testedAgainst: stage,
      actualRoute,
      found,
      windfall: turn.windfall,
      discriminating: turn.discriminating,
      matched: turn.hypothesisMatched,
      bonus: turn.planningBonus,
      credit: credits[index].credit,
      verdict,
    };
  });
}

export function getCounterfactuals(game: Game) {
  const items = game.decisions.slice(-3).map(decision => `${decision.title}: ${decision.counterfactual} ${decision.rationale}`);
  const dynamics = scenarioDynamics[game.scenario];
  const responseProfile = responseOptionsFor(game);
  if (game.responseChoices.length) {
    const containment = responseProfile.containment.find(option => option.id === game.responseChoices[0]);
    items.push(`Containment: ${containment?.title} prioritised ${containment?.disruption.toLowerCase()} disruption and left ${containment?.residual.toLowerCase()} residual risk. ${dynamics.countermeasure}`);
  }
  if (game.responseChoices.length > 1) {
    const assurance = responseProfile.assurance.find(option => option.id === game.responseChoices[1]);
    items.push(`Assurance: ${assurance?.title} established ${assurance?.confidence.toLowerCase()} confidence before restoration.`);
  }
  if (game.mapHistory.some(record => record.action === "isolate")) items.push("Infrastructure isolation reduced actor opportunity, but every isolated dependency had to be justified and restored deliberately.");
  // Revising when a completed check has turned against the reading is the
  // habit the review teaches; only a change with no completed result since the
  // last one is worth a counterfactual. Counting every change told a player who
  // revised on the standing that revising was the mistake.
  const unprompted = game.hypothesisHistory.filter((entry, index, history) => {
    if (index === 0 || history[index - 1].id === entry.id) return false;
    return !game.turns.some(turn => turn.number >= history[index - 1].turn && turn.number < entry.turn && turn.success);
  }).length;
  if (unprompted >= 2) items.push(`The working hypothesis changed ${unprompted} times with no completed check in between. A reading is worth changing once a result has turned against it, not before.`);
  else if (!game.hypothesisHistory.length) items.push("No working hypothesis was recorded, so the team could not compare its assumptions with the final chain.");
  // A pair correctly called coincidental was a right call, not a missed link.
  const weakCorrelations = game.correlations.filter(record => !record.valid && !record.correct).length;
  if (weakCorrelations) items.push(`${weakCorrelations} tested evidence relationship${weakCorrelations === 1 ? " was" : "s were"} temporal rather than causal. A stronger system-to-identity link would have reduced analytical noise.`);
  if (readyToCorrelate(game)) items.push("Multiple findings were preserved but never correlated. The team left potential causal relationships untested.");
  if (game.setPieceHistory.some(record => record.quality <= 2)) items.push("The sector crisis decision protected short-term convenience but increased strategic exposure.");
  return items;
}
