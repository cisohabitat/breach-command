// The after-action review: score, outcome, hypothesis ledger and counterfactuals.
import { attacks, difficulties, scenarios, stages, hypotheses, scenarioDynamics } from "../game.ts";
import { gameModes, sectorSystems } from "../command-systems.ts";
import { encodeChallenge } from "../phase8.ts";
import { lit, msg, ref, withForm, type Message } from "../i18n/message.ts";
import { type BeginnerReview, type Game, type HypothesisLedgerRow, type ScoreBreakdown } from "./types.ts";
import { clamp, hypothesisSources, procedureById, responseFit, responseOptionsFor } from "./rules.ts";
import { getHypothesisStanding, getLossReason, getReadingOdds, readyToCorrelate, sourceSeesReading } from "./reads.ts";

// The full review is written for someone who already knows the trade. A first
// operation needs four sentences before any of it: one thing that went well, one
// that did not, the idea behind it, and one concrete change to try.
// A revision is a change of reading between checks: two changes before the
// same check count once, because only the reading the check was made under is
// kept. The review and the device's own record both count this way; Settings
// once said five where the review said four.
export function countRevisions(game: Pick<Game, "hypothesisHistory">) {
  return game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0);
}

// One or two reasons, said together; nothing when there are none.
function both(parts: (Message | null)[]): Message {
  const given = parts.filter((part): part is Message => !!part);
  return given.length === 2 ? msg("engine.review.bothReasons", { first: given[0], second: given[1] }) : given[0] ?? lit("");
}

export function getBeginnerReview(game: Game): BeginnerReview {
  const breakdown = getScoreBreakdown(game);
  const tested = game.turns.filter(turn => turn.hypothesis && turn.hypothesisTarget);
  const aligned = tested.filter(turn => turn.hypothesisMatched).length;
  const emptySuccesses = game.turns.filter(turn => turn.success && !turn.revealed).length;
  const revisions = countRevisions(game);

  const strength = game.status === "exercise"
    ? msg("engine.review.youConfirmedOf", { revealed: game.revealed.length, turns: game.turns.length })
    : game.revealed.length === 4
    ? msg("engine.review.youConfirmedThe", { turns: game.turns.length })
    : game.impact <= 40
      ? msg("engine.review.youKeptBusiness", { impact: game.impact })
      : game.revealed.length
        ? msg("engine.review.youConfirmedOf2", { revealed: game.revealed.length })
        // With nothing confirmed, praise for the stages found would be false.
        // What a player did earn is the checks that completed and ruled
        // something out, or, if none did, a record that says the dice were part of it.
        : emptySuccesses
          ? emptySuccesses === 1 ? msg("engine.review.noStageOneCheck") : msg("engine.review.noStageChecks", { count: emptySuccesses })
          : msg("engine.review.noCheckCompleted");

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
    // Untested means the turn's own credit says so: a failed roll, or a source
    // that could not see the reading. A source marked able to test it counts as a test.
    const credits = turnCredits(game);
    const reasonOf = (turn: Game["turns"][number]) => credits[game.turns.indexOf(turn)]?.reason;
    const untested = misses.filter(turn => reasonOf(turn) === "failed" || reasonOf(turn) === "other-source").length;
    const blindMisses = misses.filter(turn => reasonOf(turn) === "other-source").length;
    // Misses that were own sources failing on the roll are the dice, not the
    // choice of source; telling that player to "run an Own source" told them
    // to do what they had done on every turn.
    const failedOwn = misses.filter(turn => !turn.success && hypothesisSources(game, turn.hypothesis!).includes(turn.procedure)).length;
    const gap = msg("engine.review.yourWorkingHypothesis", { aligned, tested: tested.length, revisions });
    if (carried * 2 >= misses.length) return {
      strength,
      gap: msg("engine.review.onOfThe", { gap, carried }),
      concept: msg("engine.review.eachStageOf"),
      next: msg("engine.review.nextOperationAs"),
    };
    if (untested * 2 >= misses.length && failedOwn === untested) return {
      strength,
      gap: msg("engine.review.onOfThe2", { gap, failedOwn }),
      concept: msg("engine.review.aFailedRoll"),
      next: msg("engine.review.nextOperationGive"),
    };
    if (untested * 2 >= misses.length) return {
      strength,
      gap: msg("engine.review.missesSettledNothing", { gap, untested, reasons: both([untested - blindMisses ? msg("engine.review.failedOnThe", { untested: untested - blindMisses }) : null, blindMisses ? msg("engine.review.usedASource", { blindMisses }) : null]) }),
      concept: msg("engine.review.aWrongReading"),
      next: game.mode === "expert"
        ? msg("engine.review.nextOperationBefore")
        : msg("engine.review.nextOperationRun"),
    };
    return {
      strength,
      gap: msg("engine.review.youTestedEach", { gap }),
      concept: msg("engine.review.aWrongReading2"),
      next: game.mode === "expert"
        ? msg("engine.review.nextOperationKeep")
        : msg("engine.review.nextOperationWhen"),
    };
  }
  if (tested.length && aligned * 2 < tested.length) return {
    strength,
    gap: msg(revisions === 0 ? "engine.review.matchedNeverRevised" : "engine.review.matched", { aligned, tested: tested.length }),
    concept: msg("engine.review.aHypothesisIs"),
    // Expert withholds the standing, so the advice is the same habit without it.
    next: game.mode === "expert"
      ? msg("engine.review.nextOperationKeep2")
      : msg("engine.review.nextOperationWatch"),
  };
  // A loss to a meter, not the window, is the thing to look at: a playtest that
  // read the route well and lost to the sector margin was told about empty
  // checks. Its advice names the meter and what moves it.
  if (game.status === "lost" && getLossReason(game).cause !== "window") {
    const reason = getLossReason(game);
    return {
      strength,
      gap: msg("engine.review.theOperationWas", { title: withForm(reason.title, "lowerFirst") }),
      concept: msg("engine.review.businessImpactService"),
      next: reason.cause === "sector"
        ? msg("engine.review.nextOperationWatch2", { rule: sectorSystems[game.scenario].rule })
        : msg("engine.review.nextOperationWatch3"),
    };
  }
  // Two confirmed stages on the turn the operation ended left no turn to compare
  // them in, and a playtest was told it "never tested" what it never could.
  if (readyToCorrelate(game) && readyToCorrelate(recordBefore(game, game.turns.length - 1))) return {
    strength,
    gap: msg("engine.review.youConfirmedStages", { evidence: game.evidence.filter(item => item.supports).length }),
    concept: msg("engine.review.twoThingsHappening"),
    next: msg("engine.review.nextOperationOnce"),
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
    gap: msg("engine.review.ofYourSuccessful", { emptySuccesses, emptyOffReading }),
    concept: msg("engine.review.aCheckThat"),
    next: msg("engine.review.nextOperationPrefer"),
  } : {
    strength,
    gap: msg("engine.review.ofYourSuccessful2", { emptySuccesses }),
    concept: msg("engine.review.anEmptyCheck"),
    next: game.mode === "expert"
      ? msg("engine.review.nextOperationChange")
      : msg("engine.review.nextOperationWhen2"),
  };
  // Only a completed response has a cost to judge. A run that never reached it
  // would otherwise be told its response was too expensive.
  if (game.responseChoices.length === 3 && breakdown.response < 16) return {
    strength,
    // It told a player to "pick the cheapest" beside a decision record naming the
    // costlier option as the stronger one in every phase.
    gap: msg("engine.review.theResponseScored", { response: breakdown.response }),
    concept: msg("engine.review.containmentAssuranceAnd"),
    next: msg("engine.review.nextOperationRead"),
  };
  // Picking sources that find things and reading the route correctly are two
  // different skills, and a run can do the first well while getting the second
  // wrong. Telling such a player that nothing stands out tells them they were
  // right when the score already said they were not.
  if (tested.length && aligned < tested.length && breakdown.hypothesis < 8) return {
    strength,
    gap: (() => {
      const wrong = turnCredits(game).filter(item => item.reason === "tested").length;
      return wrong === 0 ? msg("engine.review.selectionWorked", { aligned, tested: tested.length }) : wrong === 1 ? msg("engine.review.selectionWorkedOneWrong", { aligned, tested: tested.length }) : msg("engine.review.selectionWorkedWrong", { aligned, tested: tested.length, count: wrong });
    })(),
    concept: msg("engine.review.findingAStage"),
    next: msg(game.difficulty === "training" ? revisions === 0 ? "engine.review.afreshTeamKept" : "engine.review.afreshTeam" : revisions === 0 ? "engine.review.afreshKnownKept" : "engine.review.afreshKnown"),
  };
  // The decisions are fifteen points of the score and a playtest was told
  // nothing stood out beside calls graded one and two out of five. The weakest
  // is named with the reason it was weak at the time.
  const weakest = [...game.decisions].sort((a, b) => a.quality - b.quality)[0];
  if (weakest && weakest.quality <= 2) return {
    strength,
    gap: msg("engine.review.weakestCall", { title: weakest.title, stage: attacks.find(item => item.id === weakest.stage) ? lit(attacks.find(item => item.id === weakest.stage)!.title, "lower") : msg("engine.review.aConfirmedStage"), rationale: withForm(weakest.rationale, "lowerFirst") }),
    concept: msg("engine.review.noResponseIs"),
    next: msg("engine.review.nextOperationBefore2"),
  };
  if (game.status === "lost") return {
    strength,
    gap: msg("engine.review.theOperationWas2"),
    concept: msg("engine.review.theWindowIs"),
    next: msg("engine.review.nextOperationRevise"),
  };
  // A slow but sound operation was told nothing stood out beside an
  // investigation score of 13 of 25. The advice names what the turns went on:
  // telling a player whose every source could see the stage to "check the card
  // can see this stage" was advice their game did not support.
  const extraTurns = game.turns.length - freeTurns(game);
  if (extraTurns >= 2) {
    const failed = game.turns.filter(turn => !turn.success).length;
    const blind = turnCredits(game).filter(item => item.reason === "absent" || item.reason === "excluded").length;
    const empty = game.turns.filter(turn => turn.success && !turn.revealed && !turn.injectReveal).length;
    const counted = both([failed ? msg("engine.review.failedRolls", { count: failed }) : null, empty ? msg("engine.review.emptyChecks", { count: empty }) : null]);
    return {
      strength,
      gap: msg(failed || empty ? "engine.review.reasoningHeldSpent" : "engine.review.reasoningHeld", { turns: game.turns.length, free: freeTurns(game), difficulty: difficulties[game.difficulty].title, counted }),
      concept: msg("engine.review.emptyChecksAre"),
      next: blind
        ? game.mode === "expert"
          ? msg("engine.review.nextOperationKeep3")
          : msg("engine.review.nextOperationBefore3")
        : game.mode === "expert"
          ? msg("engine.review.nextOperationBefore4")
          : msg("engine.review.nextOperationBefore5"),
    };
  }
  return {
    strength,
    gap: msg("engine.review.nothingStandsOut"),
    concept: msg("engine.review.theHabitTo"),
    next: msg("engine.review.nextOperationTry"),
  };
}

// The visible record as it stood before a turn: the turns played, the stages
// confirmed by them and the decisions taken on those stages.
function recordBefore(game: Game, index: number): Game {
  const turns = game.turns.slice(0, index);
  const revealed = turns.flatMap(turn => [turn.revealed, turn.injectReveal]).filter((id): id is string => !!id);
  return { ...game, turns, revealed, decisions: game.decisions.filter(item => revealed.includes(item.stage)) };
}

// Turns that cost nothing on the investigation score: four at a ten-turn window,
// one more for each turn the difficulty's window adds. Training's twelve turns
// promised room to learn and then took three points for every turn past the
// fourth. Read from the difficulty, not the operation's window, so campaign
// readiness does not move the score.
function freeTurns(game: Game) {
  return 4 + Math.max(0, difficulties[game.difficulty].maxTurns - 10);
}

export function getScoreBreakdown(game: Game): ScoreBreakdown {
  const investigation = clamp(25 - Math.max(0, game.turns.length - freeTurns(game)) * 3, 0, 25);
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
  // A drill stands down before the response phase, so containment and recovery
  // are not scored rather than scored zero: the other parts are scaled to 100.
  // The banner said "not scored" beside 0 of 20 inside the total.
  const rest = investigation + impact + continuity + decisions + hypothesis;
  const total = game.status === "exercise" ? Math.round(rest * 100 / 80) : rest + response;
  return { investigation, impact, continuity, decisions, response, hypothesis, total };
}

export function getOutcome(game: Game) {
  const breakdown = getScoreBreakdown(game);
  if (breakdown.total >= 82) return { grade: "A", title: msg("engine.review.controlledRecovery"), detail: msg("engine.review.youBalancedEvidence"), breakdown };
  if (breakdown.total >= 68) return { grade: "B", title: msg("engine.review.stableWithResidual"), detail: msg("engine.review.theIncidentIs"), breakdown };
  if (breakdown.total >= 52) return { grade: "C", title: msg("engine.review.costlyStabilisation"), detail: msg("engine.review.servicesAreRecovering"), breakdown };
  return { grade: "D", title: msg("engine.review.fragileRecovery"), detail: msg("engine.review.theImmediateCrisis"), breakdown };
}

// Each part of the score, with the rule that produced it in the player's own
// numbers. A bare "7/25" next to "Investigation" read as a verdict with no way
// to do better; the rule beside it says what would have moved it.
// The response row in the player's own numbers: what the three options scored,
// and the four points each for the sector's preferred call and for fitting the
// adversary's objective. Three phases each read "the strongest option this
// sector offered" beside 17 of 20, and nothing said where the rest went.
function responseRule(game: Game): Message {
  const phases = ["containment", "assurance", "recovery"] as const;
  const options = responseOptionsFor(game);
  const own = game.responseChoices.reduce((sum, choice, index) => sum + (options[phases[index]].find(item => item.id === choice)?.score ?? 0), 0);
  const fits = game.responseChoices.map((choice, index) => responseFit(game, index, choice));
  const preferred = fits.filter(fit => fit.preferred).length;
  const aligned = fits.filter(fit => fit.objectiveAligned).length;
  const total = own + 4 * preferred + 4 * aligned;
  return msg(total > 55 ? "engine.review.responseRuleCapped" : "engine.review.responseRule", { own, preferred, aligned, total });
}

export function getScoreRows(game: Game) {
  const breakdown = getScoreBreakdown(game);
  const turns = game.turns.length;
  const decided = game.decisions.length + game.commandHistory.length + game.setPieceHistory.length;
  // Each row has an id, so a caller can tell them apart without its words.
  return [
    { id: "investigation", label: msg("engine.review.investigation"), value: breakdown.investigation, maximum: 25, rule: msg("engine.review.fullMarksFor", { freeTurns: freeTurns(game), difficultiesTitle: difficulties[game.difficulty].title, count: turns }) },
    { id: "impact", label: msg("engine.review.impactControl"), value: breakdown.impact, maximum: 15, rule: msg("engine.review.risesAsFinal", { impact: game.impact }) },
    { id: "continuity", label: msg("engine.review.continuity"), value: breakdown.continuity, maximum: 15, rule: msg("engine.review.andTheSector", { scenarioDynamicsLabel: scenarioDynamics[game.scenario].label, continuity: game.continuity, sectorHealth: game.sectorHealth }) },
    { id: "decisions", label: msg("engine.review.operationalDecisions"), value: breakdown.decisions, maximum: 15, rule: decided ? msg("engine.review.averageQuality", { count: decided }) : msg("engine.review.noDecisionsWere") },
    { id: "response", label: msg("engine.review.containmentRecovery"), value: breakdown.response, maximum: 20, rule: game.responseChoices.length === 3 ? responseRule(game) : game.status === "exercise" ? msg("engine.review.notScoredThe") : msg("engine.review.theResponsePhase") },
    { id: "hypothesis", label: msg("engine.review.hypothesisAccuracy"), value: breakdown.hypothesis, maximum: 10, rule: msg("engine.review.fullCreditFor") },
  ];
}

// A result a player can paste anywhere. It carries counts, never the techniques,
// so it spoils nothing for someone about to play the same code.
export function getResultSummary(game: Game): Message[] {
  const scenario = scenarios[game.scenario];
  const heading = msg("engine.review.breachCommand", { scenarioTitle: scenario.title, difficultiesTitle: difficulties[game.difficulty].title, gameModesTitle: gameModes[game.mode].title });
  const record = msg("engine.review.of4Stages", { revealed: game.revealed.length, count: game.turns.length });
  const outcome = getOutcome(game);
  const result = game.status === "won"
    ? msg("engine.review.stoodDownGrade", { grade: outcome.grade, total: outcome.breakdown.total })
    : game.status === "exercise"
      ? msg("engine.review.authorisedExerciseConcluded", { total: outcome.breakdown.total })
      : msg("engine.review.operationLost100", { getLossReasonTitle: withForm(getLossReason(game).title, "lower"), total: outcome.breakdown.total });
  const code = game.seed === null ? null : encodeChallenge({ scenario: game.scenario, difficulty: game.difficulty, mode: game.mode, specialist: game.specialist, seed: game.seed });
  return [heading, msg("engine.review.resultAndRecord", { result, record }), ...(code ? [msg("engine.review.playTheSame", { code })] : [])];
}

// The share image's text, under the same rule as the copied result: the case,
// the outcome, counts and the code, never a technique. The image is drawn from
// this and nothing else, so the rule is tested here.
export type ShareCard = { form: Message; title: string; meta: Message; result: Message; score: Message; stages: Message; code: string | null; expert: boolean };
export function getShareCard(game: Game): ShareCard {
  const scenario = scenarios[game.scenario];
  const outcome = getOutcome(game);
  const code = game.seed === null ? null : encodeChallenge({ scenario: game.scenario, difficulty: game.difficulty, mode: game.mode, specialist: game.specialist, seed: game.seed });
  return {
    form: msg("engine.review.formBc310"),
    title: scenario.title,
    meta: msg("engine.review.case", { scenario: game.scenario + 1, sector: scenario.sector, difficultiesTitle: difficulties[game.difficulty].title, gameModesTitle: gameModes[game.mode].title }),
    result: game.status === "won" ? msg("engine.review.stoodDownGrade2", { grade: outcome.grade }) : game.status === "exercise" ? msg("engine.review.authorisedExerciseConcluded2") : msg("engine.review.lost", { getLossReasonTitle: getLossReason(game).title }),
    score: msg("engine.review.scoreOf100", { total: outcome.breakdown.total }),
    stages: msg("engine.review.of4Stages", { revealed: game.revealed.length, count: game.turns.length }),
    code,
    expert: game.mode === "expert" && game.status === "won",
  };
}

// What each turn earned toward hypothesis accuracy, and why. The score and the
// ledger both read this, so a row can never say "no credit" for a turn the
// score paid half for.
type TurnCredit = { credit: number; reason: "none" | "matched" | "tested" | "failed" | "other-source" | "repeated" | "excluded" | "absent" };
function turnCredits(game: Game): TurnCredit[] {
  // Half credit is paid once per reading for each technique under test. It was
  // reset whenever a turn revealed anything, before that turn was graded, so a
  // partner disclosure or a later-stage find paid a reading twice at a stage
  // that was still open, against the ledger's own rule.
  const paid = new Set<string>();
  return game.turns.map((turn, index): TurnCredit => {
    if (!turn.hypothesis || !turn.hypothesisTarget) return { credit: 0, reason: "none" };
    if (turn.hypothesisMatched) return { credit: 1, reason: "matched" };
    if (!turn.success) return { credit: 0, reason: "failed" };
    // A source outside the reading's list that could still see one of its open
    // techniques tests it as surely as its own: the card said "Can also test this
    // reading", the board ruled the route out on the empty result, and the ledger
    // once paid nothing for it.
    if (!hypothesisSources(game, turn.hypothesis).includes(turn.procedure) && !sourceSeesReading({ ...recordBefore(game, index), hypothesis: turn.hypothesis }, turn.procedure)) return { credit: 0, reason: "other-source" };
    const key = `${turn.hypothesisTarget}:${turn.hypothesis}`;
    if (paid.has(key)) return { credit: 0, reason: "repeated" };
    paid.add(key);
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
    const stage: Message = targetAttack ? lit(stages[targetAttack.stage].name) : msg("engine.review.everyStageWas");
    const actualRoute = targetAttack ? hypotheses.find(item => item.id === targetAttack.vector)!.title : null;
    const predicted = turn.hypothesis ? hypotheses.find(item => item.id === turn.hypothesis)!.title : null;
    const found = turn.revealed ? attacks.find(item => item.id === turn.revealed)!.title : null;
    const windfallNote = turn.windfall ? msg("engine.review.youDidExpose", { found: found ?? "" }) : lit("");
    const missNote: Record<TurnCredit["reason"], Message> = {
      none: lit(""),
      matched: lit(""),
      tested: msg("engine.review.youTestedIt"),
      failed: msg("engine.review.theRollFailed"),
      "other-source": msg("engine.review.theProcedureWas"),
      repeated: msg("engine.review.theHalfCredit"),
      excluded: msg("engine.review.yourEarlierChecks"),
      absent: msg("engine.review.noneOfThe"),
    };
    const verdict = !target ? msg("engine.review.noStageLeft")
      : !turn.hypothesis ? msg("engine.review.noWorkingHypothesis")
      : turn.hypothesisMatched
        ? (turn.planningBonus > 0
          ? msg("engine.review.correctWasOn", { stage: withForm(stage, "inSentence"), actualRoute: lit(actualRoute!, "lower"), windfallNote })
          : msg("engine.review.correctAboutThe", { stage: withForm(stage, "inSentence"), actualRoute: lit(actualRoute!, "lower"), windfallNote }))
        : msg("engine.review.wrongRoute", { stage, actualRoute: lit(actualRoute!, "lower"), predicted: lit(predicted!, "lower"), note: credits[index].reason === "tested" && !hypothesisSources(game, turn.hypothesis!).includes(turn.procedure) ? msg("engine.review.youTestedIt2") : missNote[credits[index].reason], windfallNote });
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

export function getCounterfactuals(game: Game): Message[] {
  const items = game.decisions.slice(-3).map(decision => msg("engine.review.decisionCounterfactual", { title: decision.title, counterfactual: decision.counterfactual, rationale: decision.rationale }));
  const dynamics = scenarioDynamics[game.scenario];
  const responseProfile = responseOptionsFor(game);
  if (game.responseChoices.length) {
    const containment = responseProfile.containment.find(option => option.id === game.responseChoices[0]);
    items.push(msg("engine.review.containmentChoice", { title: lit(containment!.title), disruption: lit(containment!.disruption, "lower"), residual: lit(containment!.residual, "lower"), countermeasure: lit(dynamics.countermeasure) }));
  }
  if (game.responseChoices.length > 1) {
    const assurance = responseProfile.assurance.find(option => option.id === game.responseChoices[1]);
    items.push(msg("engine.review.assuranceChoice", { title: lit(assurance!.title), confidence: lit(assurance!.confidence, "lower") }));
  }
  if (game.mapHistory.some(record => record.action === "isolate")) items.push(msg("engine.review.isolationReduced"));
  // Revising when a completed check has turned against the reading is the
  // habit the review teaches; only a change with no completed result since the
  // last one is worth a counterfactual. Counting every change told a player who
  // revised on the standing that revising was the mistake.
  const unprompted = game.hypothesisHistory.filter((entry, index, history) => {
    if (index === 0 || history[index - 1].id === entry.id) return false;
    return !game.turns.some(turn => turn.number >= history[index - 1].turn && turn.number < entry.turn && turn.success);
  }).length;
  if (unprompted >= 2) items.push(msg("engine.review.unpromptedChanges", { count: unprompted }));
  else if (!game.hypothesisHistory.length) items.push(msg("engine.review.noHypothesisRecorded"));
  // A pair correctly called coincidental was a right call, not a missed link.
  const weakCorrelations = game.correlations.filter(record => !record.valid && !record.correct).length;
  if (weakCorrelations) items.push(msg("engine.review.weakCorrelations", { count: weakCorrelations }));
  if (readyToCorrelate(game)) items.push(msg("engine.review.neverCorrelated"));
  if (game.setPieceHistory.some(record => record.quality <= 2)) items.push(msg("engine.review.crisisConvenience"));
  return items;
}

export type Recommendation = { scenario: number; difficulty: Game["difficulty"]; title: Message; reason: Message };

// What to play next, from the record of the operation just finished. A loss to
// the window is the reading running out at the last open stage, so the same
// case comes back a rung easier, where Training's clue says what was observed;
// a loss to a meter is a different lesson, kept at the same rung; a strong
// clear moves up a rung on the next open case; anything else carries on at the
// same rung. The reason quotes the record, so the advice can be checked.
export function recommendNext(game: Game, nextOpen: number): Recommendation {
  const rungs: Game["difficulty"][] = ["training", "operational", "crisis"];
  const rung = rungs.indexOf(game.difficulty);
  const title = (scenario: number, difficulty: Game["difficulty"]) => msg("record.nextTitle", { number: scenario + 1, title: ref(`scenarios.${scenarios[scenario].id}.title`), difficulty: ref(`difficulties.${difficulty}.title`) });
  if (game.status === "lost") {
    const loss = getLossReason(game);
    if (loss.cause === "window") {
      const easier = rungs[Math.max(0, rung - 1)];
      const revealed = game.revealed.length;
      const reason = easier === game.difficulty
        ? msg("record.windowSameRung", { revealed })
        : msg(easier === "training" ? "record.windowTraining" : "record.windowEasier", { revealed, difficulty: ref(`difficulties.${easier}.title`) });
      return { scenario: game.scenario, difficulty: easier, title: title(game.scenario, easier), reason };
    }
    return { scenario: game.scenario, difficulty: game.difficulty, title: title(game.scenario, game.difficulty), reason: msg("record.lossSameRung", { loss: loss.title }) };
  }
  const score = getOutcome(game).breakdown.total;
  if (score >= 74 && rung < rungs.length - 1 && (rung === 0 || score >= 88)) {
    const harder = rungs[rung + 1];
    return { scenario: nextOpen, difficulty: harder, title: title(nextOpen, harder), reason: msg(harder === "operational" ? "record.clearedOperational" : "record.clearedCrisis", { score }) };
  }
  return { scenario: nextOpen, difficulty: game.difficulty, title: title(nextOpen, game.difficulty), reason: msg(score >= 74 ? "record.clearedSameRung" : score < 60 ? "record.clearedCleaner" : "record.clearedOneMore", { score }) };
}
