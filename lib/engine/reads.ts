// Everything shown to the player during an operation. Nothing here may read the hidden chain beyond what has been revealed, with the Training clue as the single stated exception.
import { attacks, scenarios, stages, hypotheses, scenarioDynamics, type HypothesisId } from "../game.ts";
import { adversaryObjectives, sectorSystems } from "../command-systems.ts";
import { decisionChoices, decisionLanguage, decisionText, decisionTitles, inSentence } from "./content.ts";
import { type DecisionChoice, type DecisionOption, type DiscriminatingRead, type Game, type GuidanceLevel, type HypothesisStanding, type KnownFacts, type LossCause, type ReadingOdds, type SectorRead, type TrainingPrompt } from "./types.ts";
import { availableIn, carryModifier, crisisRerouteTarget, getAdversaryProfile, getMapActionEffect, hypothesisSources, procedureById, proceduresFor, stageOf } from "./rules.ts";
import { infrastructureTopologies } from "../phase8.ts";
export function getAttributionRead(game: Game) {
  const profile = getAdversaryProfile(game);
  const evidence = game.revealed.length;
  if (evidence === 0) return { title: "Unknown operator", confidence: "LOW", detail: "No reliable attribution. Infer behaviour before assigning an identity." };
  if (evidence === 1) return { title: "Behavioural pattern emerging", confidence: "DEVELOPING", detail: `${profile.signature}. Treat this as a hypothesis, not attribution.` };
  if (evidence === 2) return { title: `Suspected: ${profile.title}`, confidence: "MODERATE", detail: profile.description };
  if (evidence === 3) return { title: `Probable: ${profile.title}`, confidence: "HIGH", detail: `${profile.description} One stage remains unresolved.` };
  return { title: profile.title, confidence: "ATTRIBUTED", detail: profile.description };
}

export function getObjectiveRead(game: Game) {
  if (game.revealed.length < 2) return { title: "Objective unconfirmed", detail: "Collect evidence across at least two stages to assess intent.", confidence: "LOW" };
  const objective = adversaryObjectives[game.objective];
  return { title: objective.title, detail: objective.tell, confidence: game.revealed.length >= 3 ? "HIGH" : "MODERATE" };
}

export function getLead(game: Game) {
  const scenario = scenarios[game.scenario];
  const index = Math.min(scenario.leads.length - 1, Math.floor(game.turns.length / 3));
  const reaction = game.adversaryEvent ? ` Latest development: ${game.adversaryEvent}` : "";
  const decoy = game.turns.length >= 2 ? ` Unverified signal: ${getAdversaryProfile(game).unverifiedSignal}` : "";
  return scenario.leads[index] + reaction + decoy;
}

// Operational and above withdraw the training aid, which left the opening with
// nothing on screen but a choice of four routes: the briefing's observations were
// a workspace away and a click deep. This restates what the player has already
// been told and already found — no hidden-chain state, so it can sit in front of
// them for the whole operation.
export function getKnownFacts(game: Game): KnownFacts {
  const scenario = scenarios[game.scenario];
  const index = Math.min(scenario.leads.length - 1, Math.floor(game.turns.length / 3));
  return {
    timeline: scenario.timeline,
    observations: scenario.leads.slice(0, index + 1),
    confirmed: game.revealed.map(id => attacks.find(attack => attack.id === id)!.title),
    // Named as unverified because it is: the same signal the captain offers, kept
    // apart from the observations so the distinction is the lesson, not a trap.
    unverified: game.turns.length >= 2 ? getAdversaryProfile(game).unverifiedSignal : null,
  };
}

// The two meters measure different things and a player can watch one fall while
// the other holds without being told why. Treatment continuity is the service the
// organisation is delivering right now; the process safety margin is how much
// room is left before the sector's own limit. Reduced output with the margin
// intact is a normal operating picture, and so is the reverse. This reads only
// the two values and the sector's own labels.
export function getSectorRead(game: Game): SectorRead {
  const service = scenarioDynamics[game.scenario].label;
  const margin = sectorSystems[game.scenario].title;
  const gap = game.continuity - game.sectorHealth;
  // Within fifteen points the two read as one picture; at 69 against 46 a
  // playtest was told they were "holding at a similar level".
  if (Math.abs(gap) < 15) return {
    headline: `${service} and ${margin.toLowerCase()} are moving together`,
    diverged: false,
    detail: `${service} is what the organisation is delivering right now. ${margin} is how much room is left before the sector's own limit. They stand at ${game.continuity} and ${game.sectorHealth}, close enough that what the service shows is roughly what the sector has left.`,
  };
  return gap > 0 ? {
    headline: `${margin} has fallen further than ${service.toLowerCase()}`,
    diverged: true,
    // "Thin" at 84 read as alarm over a margin with plenty of room left.
    detail: game.sectorHealth <= 50
      ? `The organisation is still delivering, but the margin behind it is thin: ${margin.toLowerCase()} is at ${game.sectorHealth} against ${service.toLowerCase()} at ${game.continuity}. Service looks normal from outside and there is little room left for the next thing to go wrong.`
      : `The margin is falling faster than the service: ${margin.toLowerCase()} is at ${game.sectorHealth} against ${service.toLowerCase()} at ${game.continuity}. There is still room, but service looking normal from outside is not the whole picture.`,
  } : {
    headline: `${service} has fallen further than ${margin.toLowerCase()}`,
    diverged: true,
    detail: `Delivery is degraded but the sector's limit is not close: ${service.toLowerCase()} is at ${game.continuity} against ${margin.toLowerCase()} at ${game.sectorHealth}. Running reduced while the margin stays intact is a deliberate trade, and it is usually the safer one.`,
  };
}

// Guidance is deliberately scoped. Expert mode never receives it, guided
// reflection offers strategic prompts without the answer, and only the training
// path exposes the next evidence source. Normal play is unguided, so the engine
// no longer pre-solves the puzzle for the player.
export function guidanceLevel(game: Game, guided: boolean): GuidanceLevel {
  if (game.mode === "expert" || !guided) return "off";
  return game.difficulty === "training" ? "training" : "reflection";
}

// The sector's own margin ends an operation at zero as surely as the three
// readouts in the top row, and at Training it ended two in five of the Bot
// Commander's losses. It is shown on Command's sector board and nowhere a
// player looks every turn, so once it is low it is said where every workspace
// can see it, with the rule for what erodes and restores it.
export const SECTOR_ALERT_AT = 35;
export function getSectorAlert(game: Game) {
  if ((game.status !== "playing" && game.status !== "response") || game.sectorHealth > SECTOR_ALERT_AT) return null;
  const sector = sectorSystems[game.scenario];
  return { title: `${sector.title} is at ${game.sectorHealth}`, detail: "The operation ends if it reaches zero.", rule: sector.rule };
}

// Two confirmed stages make the objective assessable, and a case theory that
// fits it makes a correct comparison worth more. Like correlation, it lives in
// the evidence workspace below the map, where no playtest found it unprompted.
export function readyForTheory(game: Game) {
  return game.status === "playing" && !game.caseTheory && getObjectiveRead(game).confidence !== "LOW";
}

// The infrastructure actions take no turn, and neither playtest used one. They
// are offered once, early, while there is still an operation for them to help;
// a player who passes on them is not asked again.
export function getMapHint(game: Game) {
  if (game.status !== "playing" || game.mapHistory.length || game.mapActionsRemaining <= 0) return null;
  if (game.turns.length < 2 || game.turns.length > 4) return null;
  const topology = infrastructureTopologies[game.scenario];
  const monitor = getMapActionEffect(game, topology.nodes[0].id, "monitor");
  const count = game.mapActionsRemaining;
  // The bonus as the button will state it: with the cap already reached, "+2"
  // here sat above a Monitor button that read "next roll +0".
  const room = carryModifier(game.nextModifier, monitor.modifier) - game.nextModifier;
  return `You hold ${count} infrastructure action${count === 1 ? "" : "s"}, and using one takes no turn. ${room > 0 ? `Monitoring a system adds +${room} to your next procedure` : "Monitoring a system would add nothing to your next procedure, which already carries the most it can"}; isolating one slows the adversary at a cost to the service.`;
}

// Two findings that each confirmed a stage, and no relationship tested yet.
// Comparing two checks that settled nothing teaches nothing about causation.
export function readyToCorrelate(game: Game) {
  return game.evidence.filter(item => item.supports).length >= 2 && !game.correlations.length;
}

export function getCoachPrompt(game: Game, guided = false) {
  if (guidanceLevel(game, guided) === "off") return "Compare evidence value, attacker opportunity and service consequence before deciding.";
  if (!game.hypothesis) return "Record a working hypothesis before acting. It can be changed when the evidence no longer fits.";
  if (game.pendingDecision) return "Compare evidence value, attacker opportunity and service consequence before intervening.";
  // Correlation lives in the reference column, below the map. Playtests never
  // found it without being told, at any difficulty, so the prompt says so once
  // there is something worth comparing.
  if (readyForTheory(game)) return "Two stages are confirmed, so the adversary's objective can now be assessed. Record a case theory: a comparison that fits it relieves more pressure than one that does not.";
  if (readyToCorrelate(game)) return "Two findings have confirmed stages. Before the next procedure, compare them: did one enable the other, or do they only overlap in time?";
  // The advice to revise follows the reading's standing. Keyed to any empty
  // check ever made, it told a player to revise for the rest of the operation,
  // including while the board said the reading was holding.
  const standing = getHypothesisStanding(game);
  // A route with no technique at this stage was told "the record no longer
  // favours" it before any check had run; nothing in the record had changed.
  if (standing.level === "unsupported" && !standing.sources) return "This reading cannot explain the stage under test: none of its techniques travels this route here. Choose a route that can before you run a procedure.";
  if (standing.level === "unsupported" || standing.level === "weakening") return "The record no longer favours this reading. Revise it, or choose a source that can tell the remaining routes apart.";
  // With every source the reading predicts cooling or blind to this stage, the
  // generic line left a player at a dead end.
  if (hypothesisSources(game, game.hypothesis!).every(id => availableIn(game, id) > 0 || sourceSeesReading(game, id) === false)) return "No source your reading predicts can test it this turn: they are cooling down or cannot see this stage. Compare all four readings to find one whose sources are ready, or collect where you can and test this one next turn.";
  // Pressure comes after the dead ends above: at 70 impact it told a player to
  // run a source their reading predicts while every such card read cooling or
  // blind, at the moment the advice mattered most.
  if (game.impact >= 70) return `Business impact is ${game.impact}, and the operation ends at 100. Spend this turn on a source your reading predicts that can see this stage, and when the next stage is confirmed, favour acting or containing over watching.`;
  return game.revealed.length ? "Use the stages you have confirmed to predict what the attacker needs next, not merely the next available tool." : game.difficulty === "training" ? "Read what the team is seeing, pick the route that best explains it, and test it with one of that reading's own sources." : "Read the latest observation, pick the route that best explains it, and test it with one of that reading's own sources.";
}

/**
 * The solver behind the balance simulations. It resolves the next hidden stage and
 * returns the evidence source that would expose it. It is not a player-facing
 * helper; call getSuggestion for anything that reaches the player.
 */
export function nextEvidenceSource(game: Game) {
  const hidden = game.chain.filter(id => !game.revealed.includes(id)).map(id => attacks.find(attack => attack.id === id)!);
  for (const attack of hidden) {
    const candidates = attack.detect.filter(id => !availableIn(game, id));
    candidates.sort((a, b) => Number(game.established.includes(b)) - Number(game.established.includes(a)));
    if (candidates.length) return procedureById(game, candidates[0]);
  }
  return proceduresFor(game).find(procedure => !availableIn(game, procedure.id));
}

/**
 * The player-facing training aid. It used to hand back nextEvidenceSource — the
 * solver's answer — which walked the player to every stage while the rest of the
 * interface told them the same action tested nothing. Following it produced a
 * complete attack chain and a hypothesis score of three out of ten.
 *
 * It now prompts the next step in the reasoning instead: declare a reading, test
 * it with one of its own sources, revise it when the record rules its route out,
 * and correlate the findings once there are two to compare. Every branch reads
 * only what the player has declared or observed, so the aid can no longer
 * contradict the discriminating read, and no player-facing helper returns the
 * solver's answer at any difficulty.
 */
export function getTrainingPrompt(game: Game, guided = false): TrainingPrompt | null {
  if (guidanceLevel(game, guided) !== "training") return null;
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  // The one thing Training discloses that the player could not derive: the
  // observable pointing at the next unconfirmed stage. Every technique carries a
  // clue describing what was noticed, and without it the opening hypothesis is a
  // coin flip between four routes, which teaches nothing. It names what was seen,
  // never the technique behind it and never the source that would expose it.
  const hidden = game.chain.find(id => !game.revealed.includes(id));
  const clue = hidden ? attacks.find(item => item.id === hidden)!.clue : null;
  if (!hypothesis) return {
    step: "declare",
    title: "Start with an explanation",
    detail: "Record the intrusion route you think is in play. You can change it whenever the evidence stops fitting.",
    sources: [],
    clue,
  };
  if (game.pendingDecision) return {
    step: "decide",
    title: "Weigh the decision, not the tool",
    detail: "Compare what each response buys you against what it costs the service and the evidence. There is no option here that is right in every incident.",
    sources: [],
    clue: null,
  };
  // A source blind to every technique the reading could be using at this stage
  // is not suggested: the card says it cannot see the stage, and the aid must not
  // send the player there.
  const open = hypothesisSources(game, hypothesis.id).filter(id => !availableIn(game, id) && sourceSeesReading(game, id) !== false).map(id => ({ id, title: procedureById(game, id)!.title }));
  const standing = getHypothesisStanding(game);
  if (standing.level === "weakening" || standing.level === "unsupported") return {
    step: "revise",
    title: standing.level === "unsupported" && !standing.sources ? "This reading cannot explain this stage" : "Your reading is running out of support",
    detail: `${standing.detail} Read the current observation again and pick the explanation that accounts for it, then test that one.`,
    sources: [],
    clue,
  };
  if (readyForTheory(game)) return {
    step: "theory",
    title: "Name what the adversary is after",
    detail: "Two confirmed stages are enough to assess the objective. Record a case theory in the evidence workspace. It changes nothing on its own, but a comparison that fits it relieves more pressure than one that does not.",
    sources: [],
    clue,
  };
  if (readyToCorrelate(game)) return {
    step: "correlate",
    title: "Two findings can be compared",
    detail: "Select two findings in the evidence workspace and decide whether one plausibly enabled the other, or whether they only overlap in time. Testing that judgement is part of the work.",
    sources: [],
    clue,
  };
  // A reading declared for an earlier stage reads, under "Test …", like the
  // aid's own recommendation for the new one. Once a stage has been confirmed
  // since the reading was chosen, the prompt asks whether it still fits.
  const lastConfirmation = game.turns.reduce((last, turn) => turn.revealed || turn.injectReveal ? turn.number : last, 0);
  const declaredAt = game.hypothesisHistory[game.hypothesisHistory.length - 1]?.turn ?? 0;
  if (lastConfirmation && declaredAt <= lastConfirmation && standing.level === "untested") return {
    step: "test",
    title: `New stage: does ${hypothesis.title.toLowerCase()} still fit?`,
    detail: "A stage was just confirmed, and the next one can travel a different route. Read what the team is seeing now and keep this reading only if it fits; otherwise choose the one that does before you run a procedure.",
    sources: open,
    clue,
  };
  return {
    step: "test",
    // With every own source cooling or blind to the stage, "Test …" asked for
    // something no card on screen could do.
    title: open.length ? `Test ${hypothesis.title.toLowerCase()}` : "No own source can test this reading this turn",
    detail: open.length
      ? "These are the sources this reading predicts. A completed check that finds nothing rules out every technique its source could have seen, so these are the ones most likely to settle the reading either way — and they earn the own-source bonus. A source the reading does not predict can still expose a stage or rule something out; it just answers your question less directly."
      : "Every source this reading predicts that can see this stage is cooling down. Another source can still expose a stage or rule something out, so collect where you can this turn, or record a different reading and test that.",
    sources: open,
    // The observation stays on screen for the whole stage: a playtest lost it on
    // the turn a reading first held, and on the turn the map or a comparison was
    // offered, which were the turns it most needed it.
    clue,
  };
}

export function getDecisionOptions(game: Game) {
  if (!game.pendingDecision) return null;
  const attack = attacks.find(item => item.id === game.pendingDecision)!;
  const language = decisionLanguage[attack.stage];
  const service: Record<DecisionChoice, string> = {
    observe: "No immediate disruption",
    act: language.continuityCost <= -7 ? "Significant service risk" : "Limited service risk",
    attribute: "Analyst time only",
    contain: "Bounded service impact",
    notify: "Service owners prepared",
  };
  const evidence: Record<DecisionChoice, string> = {
    observe: "Evidence confidence improves",
    act: "Some telemetry will be lost",
    attribute: "Attribution depth improves",
    contain: "Local telemetry preserved",
    notify: "No new evidence",
  };
  const risk: Record<DecisionChoice, string> = {
    observe: "Attacker opportunity increases",
    act: "Immediate exposure falls",
    attribute: "Business impact still rises",
    contain: "Parallel access paths remain",
    notify: "Your read is disclosed",
  };
  const options: DecisionOption[] = decisionChoices.map(id => ({
    id,
    title: language[decisionTitles[id]] as string,
    description: language[decisionText[id]] as string,
    service: service[id],
    evidence: evidence[id],
    risk: risk[id],
  }));
  const find = (id: DecisionChoice) => options.find(option => option.id === id)!;
  return { attack, options, observe: find("observe"), act: find("act") };
}

// What the record says about the stage under test. A completed check that found
// nothing rules out every technique that source would have exposed, so among the
// techniques this scenario can use at that stage — its published pool, not the
// chain — the ones still open decide how well each route explains the record.
// A check that exposed a later stage rules out the stage under test as well,
// because the earliest open stage a source can see is the one it reveals.
//
// The window runs from the last visible change to that stage: a Crisis re-route
// that targeted it, or an adaptation after the evidence decision on the stage
// before it. A confirmation alone does not reset it; what a source could not see
// then, it still cannot.
//
// Counting empty checks against a route's whole source list read a correct
// reading as weakening nearly as often as a wrong one — holding readings were
// right 29% of the time and weakening ones 22% — because any one technique is
// visible to only about three sources. This is the same evidence, weighed.
// The routes the record has already excluded at the stage under test — every
// technique they could be using there ruled out by a completed check, or none
// that travels by them at all. Declaring one is the only other way to learn it,
// and a Crisis playtest declared all four in turn before finding one still open.
// It names only routes that are out; it never names the one that is right.
// "unused" is a route none of the incident's techniques at this stage travels
// by, known before any check; "excluded" is one completed checks have closed.
export function getRuledOutRoutes(game: Game): { stage: string | null; routes: HypothesisId[]; reason: Partial<Record<HypothesisId, "unused" | "excluded">> } {
  const odds = getReadingOdds(game);
  if (odds.stage === null) return { stage: null, routes: [], reason: {} };
  const routes = hypotheses.map(item => item.id).filter(id => odds.candidates[id].open === 0);
  return { stage: inSentence(stages[odds.stage].name), routes, reason: Object.fromEntries(routes.map(id => [id, odds.candidates[id].total ? "excluded" : "unused"])) };
}

export function getReadingOdds(game: Game): ReadingOdds {
  const revealedStages = new Set(game.revealed.map(stageOf));
  const stage = [0, 1, 2, 3].find(index => !revealedStages.has(index)) ?? null;
  const reaction = scenarioDynamics[game.scenario].reaction;
  // Adaptation after a decision changes the stage after the decided one.
  const adaptedNext = new Set(game.decisions.filter(item => item.adaptedFrom).map(item => item.stage).filter(id => stageOf(id) + 1 === stage));
  let changedAt = 0;
  const confirmedSoFar = new Set<number>();
  for (const turn of game.turns) {
    // A turn's own finds land before its escalation beat, so they count first.
    for (const id of [turn.revealed, turn.injectReveal]) if (id) confirmedSoFar.add(stageOf(id));
    const rerouted = !!turn.adversaryEvent?.includes(reaction) && crisisRerouteTarget(confirmedSoFar) === stage;
    const adaptedHere = [turn.revealed, turn.injectReveal].some(id => !!id && adaptedNext.has(id));
    if (rerouted || adaptedHere) changedAt = turn.number;
  }
  const ruledOutBy = stage === null ? [] : [...new Set(game.turns
    .filter(turn => turn.number > changedAt && turn.success && (!turn.revealed || stageOf(turn.revealed) > stage))
    .map(turn => turn.procedure))];
  const ids = hypotheses.map(item => item.id);
  const candidates = Object.fromEntries(ids.map(id => [id, { total: 0, open: 0 }])) as ReadingOdds["candidates"];
  for (const id of stage === null ? [] : scenarios[game.scenario].choices[stage]) {
    const attack = attacks.find(item => item.id === id);
    if (!attack) continue;
    candidates[attack.vector].total += 1;
    if (!ruledOutBy.some(source => attack.detect.includes(source))) candidates[attack.vector].open += 1;
  }
  const totalAll = ids.reduce((sum, id) => sum + candidates[id].total, 0) || 1;
  const openAll = ids.reduce((sum, id) => sum + candidates[id].open, 0);
  const prior = Object.fromEntries(ids.map(id => [id, candidates[id].total / totalAll])) as Record<HypothesisId, number>;
  const share = openAll
    ? Object.fromEntries(ids.map(id => [id, candidates[id].open / openAll])) as Record<HypothesisId, number>
    : prior;
  return { stage, ruledOutBy, candidates, share, prior };
}

// How the declared reading is holding up, from the player's own record weighed
// against what the route could be using at this stage. It names the reading
// that is weakening; it never names the one that is right.
export function getHypothesisStanding(game: Game): HypothesisStanding {
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  if (!hypothesis) return { level: "none", label: "No working hypothesis", detail: "Record the explanation you are testing. Until you do, a procedure collects but settles nothing.", spent: 0, sources: 0, inconclusive: 0, turnsSinceConfirmation: 0 };
  const lastConfirmation = game.turns.reduce((last, turn) => turn.revealed || turn.injectReveal ? turn.number : last, 0);
  const since = game.turns.filter(turn => turn.number > lastConfirmation);
  const inconclusive = new Set(since.filter(turn => !turn.success).map(turn => turn.procedure)).size;
  const odds = getReadingOdds(game);
  const own = odds.candidates[hypothesis.id];
  const spent = own.total - own.open;
  const common = { spent, sources: own.total, inconclusive, turnsSinceConfirmation: since.length };
  const unresolved = inconclusive ? ` ${inconclusive} attempt${inconclusive === 1 ? "" : "s"} since ${lastConfirmation ? "the last confirmation" : "the operation began"} failed outright, which settles nothing either way.` : "";
  const stageName = odds.stage === null ? "next" : inSentence(stages[odds.stage].name);
  const tally = `${spent} of the ${own.total} technique${own.total === 1 ? "" : "s"} this route could be using at the ${stageName} stage ${spent === 1 || own.total === 1 ? "has" : "have"} been ruled out by completed checks that found nothing at this stage`;
  if (odds.stage === null) return { level: "untested", label: "Untested", detail: `Every stage is confirmed, so there is nothing left for ${hypothesis.title.toLowerCase()} to explain.${unresolved}`, ...common };
  // A route this incident's published techniques do not use at the stage under
  // test cannot be the explanation for it. It read as "untested" here, and a
  // player kept it for a whole Crisis operation waiting for a test that could
  // never come.
  if (!own.total) return { level: "unsupported", label: "Cannot explain this stage", detail: `None of the techniques this incident can use at the ${stageName} stage travels by this route, so ${hypothesis.title.toLowerCase()} cannot explain it. Choose a route that can.${unresolved}`, ...common };
  if (!odds.ruledOutBy.length) return { level: "untested", label: "Untested", detail: `No completed check has ruled anything out at the ${stageName} stage yet, so ${hypothesis.title.toLowerCase()} is neither supported nor weakened.${unresolved}`, ...common };
  if (!own.open) return { level: "unsupported", label: "Poorly supported", detail: `Every technique this route could be using at the ${stageName} stage has been ruled out by a completed check that found nothing at this stage. On the evidence you hold, it is not this route.${unresolved}`, ...common };
  if (odds.share[hypothesis.id] < odds.prior[hypothesis.id] * STANDING_WEAKENS_BELOW) return { level: "weakening", label: "Weakening", detail: `${tally}. The empty results fit other routes better than this one; absence on sources that would have seen it is evidence, not bad luck.${unresolved}`, ...common };
  return { level: "holding", label: "Holding", detail: `${tally}. The record still fits this reading at least as well as the others.${unresolved}`, ...common };
}

// A reading weakens once the share of the open techniques it holds falls below
// this fraction of the share it started with. Measured over 1,500 operations, a
// reading between half and four-fifths of its starting share was still right
// about half the time, so calling that "weakening" would mislead. A route with
// nothing left open was right in none of 1,772 cases, which is what "poorly
// supported" says.
export const STANDING_WEAKENS_BELOW = 0.5;

// A read built only from what the player can already see: their own declared
// hypothesis, that hypothesis's own evidence sources, and how often they have
// already spent this source without it producing a stage. It never consults the
// hidden chain, so it narrows the search without answering it.
// Whether a source can see any technique the declared reading could be using at
// the stage under test, from the scenario's published pool — the same pool the
// standing reads, never the hidden chain. A playtest spent two of a reading's own
// sources at a stage neither could see, was told the reading was "holding", and
// learned why only in the review. Null when there is no reading or no stage, or
// when the reading has no technique at this stage (the standing says so).
export function sourceSeesReading(game: Game, procedure: string): boolean | null {
  if (!game.hypothesis) return null;
  const stage = getReadingOdds(game).stage;
  if (stage === null) return null;
  const candidates = scenarios[game.scenario].choices[stage]
    .map(id => attacks.find(item => item.id === id))
    .filter(attack => attack?.vector === game.hypothesis);
  // A reading with no technique at this stage cannot be tested by any source.
  if (!candidates.length) return false;
  // Only techniques the record still leaves open: once the player's checks have
  // ruled a route out here, its sources have nothing left to test.
  const ruledOutBy = getReadingOdds(game).ruledOutBy;
  const open = candidates.filter(attack => !ruledOutBy.some(source => attack!.detect.includes(source)));
  return open.some(attack => attack!.detect.includes(procedure));
}

export function getDiscriminatingRead(game: Game, procedure: string): DiscriminatingRead {
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  // A completed check that found nothing is a result. A failed roll is not: it
  // tells the player nothing about the source, and must not read as though it did.
  // Scoped to the stage under test: "checked 1× · no stage found" carried from
  // stage 2 to stage 4 steered a playtest away from the source that held it.
  const lastConfirmation = game.turns.reduce((last, turn) => turn.revealed || turn.injectReveal ? turn.number : last, 0);
  const attempts = game.turns.filter(turn => turn.procedure === procedure && turn.number > lastConfirmation);
  const spent = attempts.filter(turn => turn.success && !turn.revealed).length;
  const inconclusive = attempts.filter(turn => !turn.success).length;
  const spentNote = [
    spent ? ` Checked ${spent} time${spent === 1 ? "" : "s"} here with no stage found.` : "",
    inconclusive ? ` ${inconclusive} earlier attempt${inconclusive === 1 ? "" : "s"} failed before producing a result, which settles nothing.` : "",
  ].join("");
  if (!hypothesis) return { level: "broad", label: "Broad collection", detail: `No working hypothesis is recorded, so this action collects without testing an explanation.${spentNote}`, spent, inconclusive };
  if (hypothesisSources(game, hypothesis.id).includes(procedure) && sourceSeesReading(game, procedure) === false) return { level: "moderate", label: "Own source, but blind to this stage", detail: `${hypothesis.title} predicts this source, so it still earns the own-source bonus, but none of the techniques this reading could be using at the stage under test is visible to it. A check here cannot settle the reading at this stage; another of its own sources can.${spentNote}`, spent, inconclusive };
  if (hypothesisSources(game, hypothesis.id).includes(procedure)) return { level: "high", label: "One of this reading's own sources", detail: `${hypothesis.title} predicts this source. A completed check that finds nothing rules out every technique it could have seen, on this route and any other, and the reading's standing shows what is left. A discovery may still sit on another route — the sources overlap.${spentNote}`, spent, inconclusive };
  // A source outside the reading's list can still see one of its techniques at
  // this stage; "will not settle the current question" was said of a source that
  // then revealed the stage, on the declared route.
  if (sourceSeesReading(game, procedure)) return { level: "moderate", label: "Not an own source, but it can see this reading here", detail: `${hypothesis.title} does not list this source, so it earns no own-source bonus, but it can see at least one technique this reading could be using at the stage under test.${spentNote}`, spent, inconclusive };
  return { level: "moderate", label: "Collects, does not test", detail: `${hypothesis.title} does not predict evidence in this source. It may still find something, but it will not settle the current question.${spentNote}`, spent, inconclusive };
}

// `cause` lets a caller tell the endings apart without comparing titles; the
// window ending's detail already counts the stages, so callers add that count
// only for the other four.
export function getLossReason(game: Game): { cause: LossCause; title: string; detail: string } {
  if (game.objectiveProgress >= 100) return { cause: "objective", title: "The adversary completed its objective", detail: `Adversary progress toward ${adversaryObjectives[game.objective].title.toLowerCase()} reached 100 before the response closed the route.` };
  if (game.impact >= 100) return { cause: "impact", title: "Business impact reached its limit", detail: "Exposure grew faster than the investigation could reduce it." };
  if (game.continuity <= 0) return { cause: "continuity", title: "The essential service stopped", detail: `${scenarioDynamics[game.scenario].label} fell to zero and the operation was taken out of the response team's hands.` };
  if (game.sectorHealth <= 0) return { cause: "sector", title: `${sectorSystems[game.scenario].title} reached zero`, detail: "The sector's own margin ran out while the attack chain was still open." };
  return { cause: "window", title: "The investigation window closed", detail: `${game.revealed.length} of 4 stages were confirmed in ${game.turns.length} turn${game.turns.length === 1 ? "" : "s"}.` };
}

export function getAdversaryRead(game: Game) {
  const memory = game.adversaryMemory;
  const favourite = Object.entries(memory.procedureCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const source = favourite ? procedureById(game, favourite)?.title : null;
  const posture = memory.actChoices > memory.observeChoices ? "expects rapid intervention" : memory.observeChoices > memory.actChoices ? "expects evidence preservation" : "is still learning your command posture";
  const hypothesis = memory.hypothesisChanges >= 3 ? "The actor has seen your investigative theory change several times." : memory.hypothesisChanges ? "The actor has observed changes in your investigative theory." : "Your investigative theory remains difficult to infer.";
  const campaignRead = game.campaignDoctrine === "balanced" ? "No dominant campaign doctrine is yet visible." : `Across operations, the group expects a predominantly ${game.campaignDoctrine === "act" ? "intervention-led" : "observation-led"} response.`;
  const attribution = getAttributionRead(game);
  return `${attribution.title} ${posture}${source ? ` and has seen repeated use of ${source}.` : "."} ${hypothesis} ${campaignRead}`;
}
