// The after-action review: score, outcome, hypothesis ledger and counterfactuals.
import { attacks, stages, hypotheses, scenarioDynamics } from "../game.ts";
import { type BeginnerReview, type Game, type HypothesisLedgerRow, type ScoreBreakdown } from "./types.ts";
import { clamp, hypothesisSources, procedureById, responseOptionsFor } from "./rules.ts";
import { getLossReason } from "./reads.ts";

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
      : `You confirmed ${game.revealed.length} of 4 stages under real pressure, and the record you built is where the next shift starts.`;

  if (!game.correlations.length && game.evidence.length >= 2) return {
    strength,
    gap: `You collected ${game.evidence.length} findings but never tested how any two of them relate.`,
    concept: "Two things happening close together is not the same as one causing the other. Saying which it is — and being willing to be wrong — is the core of the work.",
    next: "Next operation, once you hold two findings, select them in the evidence workspace and decide whether one plausibly enabled the other before you run another procedure.",
  };
  if (tested.length && aligned * 2 < tested.length) return {
    strength,
    gap: `Your working hypothesis matched the route actually under test on ${aligned} of ${tested.length} turns${revisions === 0 ? ", and you never revised it" : ""}.`,
    concept: "A hypothesis is a prediction you are trying to break, not a label to keep. When the evidence sources it predicts come back empty, that is the evidence telling you to change it.",
    next: "Next operation, watch the reading's standing on the hypothesis board. When it says weakening, change the reading before you spend another turn.",
  };
  if (emptySuccesses >= 3) return {
    strength,
    gap: `${emptySuccesses} of your successful checks produced no new stage.`,
    concept: "A check that succeeds but finds nothing has still cost a turn. Choosing where to look matters more than how hard you look.",
    next: "Next operation, prefer a source your current reading actually predicts — the card says so before you commit — over whichever tool is available.",
  };
  // Only a completed response has a cost to judge. A run that never reached it
  // would otherwise be told its response was too expensive.
  if (game.responseChoices.length === 3 && breakdown.response < 12) return {
    strength,
    gap: "The response cost more service than it needed to for the assurance it bought.",
    concept: "Containment, assurance and recovery each trade disruption against certainty. The most thorough option is not automatically the right one.",
    next: "Next operation, read what each response option leaves as residual risk, and pick the cheapest one that closes the risk you actually confirmed.",
  };
  // Picking sources that find things and reading the route correctly are two
  // different skills, and a run can do the first well while getting the second
  // wrong. Telling such a player that nothing stands out tells them they were
  // right when the score already said they were not.
  if (tested.length && aligned < tested.length) return {
    strength,
    gap: `Your evidence selection worked, but the reading you were testing matched the route the stage actually used on only ${aligned} of ${tested.length} turns.`,
    concept: "Finding a stage and classifying it are separate skills. A source can turn one up while the route you named for it is wrong, which is why the score counts them apart.",
    next: `Next operation, when a finding lands, check which route it belonged to before choosing the next procedure${revisions === 0 ? " — you kept one reading for the whole of this operation" : ""}.`,
  };
  if (game.status === "lost") {
    const reason = getLossReason(game);
    return {
      strength,
      gap: `The operation was lost: ${reason.title.charAt(0).toLowerCase()}${reason.title.slice(1)}.`,
      concept: "Business impact, service integrity and adversary progress decide an operation as surely as the evidence does. A sound investigation still has to finish before one of them runs out.",
      next: "Next operation, watch the three readouts on the top row, and when one is near its limit, choose the decision or response option that relieves it before you run another procedure.",
    };
  }
  return {
    strength,
    gap: "Nothing stands out as a misunderstanding in this operation.",
    concept: "The habit to keep is the one you just used: predict, test with a source that can settle it, then revise when it cannot.",
    next: "Next operation, try a harder difficulty or a sector you have not commanded, and see whether the same reasoning holds when the pressure is different.",
  };
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
  const aligned = tested.filter(turn => turn.hypothesisMatched).length;
  // A reading that was properly tested and came back empty is not a guess. The
  // player predicted, spent one of that reading's own sources and got a real
  // negative, which is the loop this game claims to teach — and scoring it zero
  // is why a careful player and a random one both landed on three out of ten.
  // It earns half credit once per reading, so revising is rewarded and repeating
  // the same empty reading is not. A failed roll settles nothing and earns none.
  // Ruling a reading out is worth credit once. Declaring it again after its own
  // sources came back empty is the opposite of the lesson, so those turns earn
  // nothing and still count in the denominator.
  const ruledOut = new Set<string>();
  let soundNegatives = 0;
  for (const turn of tested) {
    if (turn.revealed || turn.injectReveal) ruledOut.clear();
    if (turn.hypothesisMatched || !turn.success) continue;
    if (!hypothesisSources(game, turn.hypothesis!).includes(turn.procedure)) continue;
    if (ruledOut.has(turn.hypothesis!)) continue;
    ruledOut.add(turn.hypothesis!);
    soundNegatives++;
  }
  const credit = aligned + soundNegatives * 0.5;
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

export function getHypothesisLedger(game: Game): HypothesisLedgerRow[] {
  return game.turns.map(turn => {
    const target = turn.hypothesisTarget;
    const targetAttack = target ? attacks.find(item => item.id === target)! : null;
    const stage = targetAttack ? stages[targetAttack.stage].name : "Every stage was already confirmed";
    const actualRoute = targetAttack ? hypotheses.find(item => item.id === targetAttack.vector)!.title : null;
    const predicted = turn.hypothesis ? hypotheses.find(item => item.id === turn.hypothesis)!.title : null;
    const found = turn.revealed ? attacks.find(item => item.id === turn.revealed)!.title : null;
    const windfallNote = turn.windfall
      ? ` You did expose ${found}, further along the chain — that source is shared between routes, so it was a find rather than a correct prediction.`
      : "";
    const verdict = !target ? "No stage left to predict, so this turn could not score."
      : !turn.hypothesis ? "No working hypothesis was recorded, so this turn could not score."
      : turn.hypothesisMatched
        ? (turn.planningBonus > 0
          ? `Correct: ${stage.toLowerCase()} was on the ${actualRoute!.toLowerCase()} route, and the procedure was one of that reading's own sources. Full credit, and the own-source bonus on the roll.${windfallNote}`
          : `Correct about the route — ${stage.toLowerCase()} was on the ${actualRoute!.toLowerCase()} route — but the procedure was not one of that reading's sources, so it earned no own-source bonus.${windfallNote}`)
        : `${stage} was on the ${actualRoute!.toLowerCase()} route, not ${predicted!.toLowerCase()}, so the prediction scored nothing.${windfallNote}`;
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
  const actualChanges = game.hypothesisHistory.reduce((count, entry, index, history) => count + (index > 0 && history[index - 1].id !== entry.id ? 1 : 0), 0);
  if (actualChanges > 2) items.push("The working hypothesis changed several times across turns. Earlier disconfirming evidence could have reduced investigative delay.");
  else if (!game.hypothesisHistory.length) items.push("No working hypothesis was recorded, so the team could not compare its assumptions with the final chain.");
  const weakCorrelations = game.correlations.filter(record => !record.valid).length;
  if (weakCorrelations) items.push(`${weakCorrelations} tested evidence relationship${weakCorrelations === 1 ? " was" : "s were"} temporal rather than causal. A stronger system-to-identity link would have reduced analytical noise.`);
  if (!game.correlations.length && game.evidence.length >= 2) items.push("Multiple findings were preserved but never correlated. The team left potential causal relationships untested.");
  if (game.setPieceHistory.some(record => record.quality <= 2)) items.push("The sector crisis decision protected short-term convenience but increased strategic exposure.");
  return items;
}
