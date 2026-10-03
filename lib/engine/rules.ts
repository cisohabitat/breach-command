// Rules shared by the reads and the transitions: availability, the roll modifier, map costs, the loss check and settle.
import { attacks, procedures, sectorProcedures, hypotheses, scenarioDynamics, randomInt, type HypothesisId } from "../game.ts";
import { procedureIntensities, procedureScopes, sectorSystems, specialists, type ProcedurePlan } from "../command-systems.ts";
import { infrastructureTopologies } from "../phase8.ts";
import { adversaryProfiles, meterDirection, responseProfiles } from "./content.ts";
import { type Game, type GameStatus, type MapAction, type ModifierPart, type ResponseProfile } from "./types.ts";

// The fatigue at which a specialist's bonus stops applying. The roll, its
// preview and the deployment screen all read it here.
export const SPECIALIST_EXHAUSTED_AT = 5;

export function responseOptionsFor(game: Game): ResponseProfile {
  return responseProfiles[game.scenario] ?? responseProfiles[0];
}

export function shuffle<T>(array: T[], random = (max: number) => randomInt(max)) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// The actor's pace, not its progress: "Executing objective" beside an
// adversary progress of 19 read as a contradiction.
export const state = (tempo: number) => tempo <= 0 ? "Covert" : tempo === 1 ? "Maneuvering" : tempo === 2 ? "Accelerating" : "Pressing hard";

export function getAdversaryState(game: Game) {
  return state(game.adversaryTempo);
}

export function getAdversaryProfile(game: Game) {
  return adversaryProfiles[game.adversaryProfile];
}

export function getOperationalLabel(game: Game) {
  return scenarioDynamics[game.scenario].label;
}

// A change in the words the readouts above it use. "Continuity −3" and "Sector
// confidence +5" under readouts called "Terminal service flow" and "Terminal
// operating window" left a playtest unable to say which bar would move.
export function describeMeterChange(game: Game, meter: keyof typeof meterDirection, value: number) {
  const labels: Partial<Record<keyof typeof meterDirection, string>> = {
    impact: "Business impact",
    continuity: getOperationalLabel(game),
    sector: sectorSystems[game.scenario].title,
    objective: "Adversary progress",
  };
  return describeChange(meter, value, labels[meter]);
}

export function getTurnLimit(game: Game) {
  return game.turnLimit;
}

// Everything a map action will do, stated before it is chosen. The resolution
// applies exactly this, so the cost on the button and the cost paid are one
// computation — including the sector margin, which can end an operation.
export function getMapActionEffect(game: Game, nodeId: string, action: MapAction) {
  const critical = nodeId === infrastructureTopologies[game.scenario].critical;
  const sector = sectorSystems[game.scenario];
  return {
    modifier: action === "monitor" ? 2 : 0,
    impact: action === "monitor" ? -2 : critical ? -8 : -5,
    continuity: action === "monitor" ? 0 : critical ? -10 : -5,
    sector: action === "monitor" ? sector.monitoringRecovery : -(critical ? 7 : 3) - sector.containmentCost,
    objective: action === "monitor" ? -4 : critical ? -12 : -8,
  };
}

// How many turns pass before a used procedure comes back. The count the player
// sees on a cooling card is one less than this, because the turn they spent is
// part of the window — say it in turns skipped wherever it is written down.
export function cooldownWindow(game: Game) {
  return game.difficulty === "training" ? 3 : 4;
}

// The eleven shared procedures plus this sector's own one. Everything that lists,
// looks up or validates a procedure goes through these, so the sector action is a
// procedure in every sense rather than a special case bolted to the grid.
export function proceduresFor(game: Game) {
  return [...procedures, sectorProcedures[game.scenario]];
}

export function procedureById(game: Game, id: string) {
  return proceduresFor(game).find(item => item.id === id);
}

// A reading's own evidence sources. The sector procedure joins the list when it
// tests the same route, which is how it earns the planning bonus instead of
// sitting outside the reasoning the rest of the interface asks for.
export function hypothesisSources(game: Game, id: HypothesisId) {
  const hypothesis = hypotheses.find(item => item.id === id);
  if (!hypothesis) return [];
  const sector = sectorProcedures[game.scenario];
  return sector.vector === id ? [...hypothesis.procedures, sector.id] : hypothesis.procedures;
}

export function availableIn(game: Game, id: string) {
  if (game.lastUsed[id] === undefined) return 0;
  return Math.max(0, game.lastUsed[id] + cooldownWindow(game) - (game.turns.length + 1));
}

export function describeChange(meter: keyof typeof meterDirection | string, value: number, label?: string) {
  const known = meterDirection[meter];
  // A scenario names its own continuity meter ("Business service integrity"), and
  // the change reads in that name rather than "<name>: Continuity".
  const direction = known && label ? { ...known, label } : known;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const amount = `${sign}${Math.abs(value)}`;
  if (!direction) return `${meter} ${amount}`;
  if (value === 0) return `${direction.label} unchanged`;
  const good = value > 0 ? direction.risesIsGood : !direction.risesIsGood;
  return `${direction.label} ${amount} ${good ? "better" : "worse"}`;
}

// Every part of the roll, before committing. Nothing here depends on the hidden
// chain, and playTurn resolves with exactly this total.
// The planning bonus rewards testing the reading the player has declared, with
// one of its own sources. It used to apply only when that reading matched the
// hidden route, which kept it out of the preview — and the report's total, less
// the preview's, still gave the answer away. Keyed to what the player declared,
// it is shown before the roll like any other part, and correctness is rewarded
// where it belongs: the right source on the right route reveals the stage, and
// hypothesis accuracy is scored after the operation.
export const OWN_SOURCE_BONUS = 1;

export function ownSourceBonus(game: Game, procedure: string) {
  return game.hypothesis && hypothesisSources(game, game.hypothesis).includes(procedure) ? OWN_SOURCE_BONUS : 0;
}

export function getModifierBreakdown(game: Game, procedure: string, plan: ProcedurePlan = { scope: "focused", intensity: "balanced" }) {
  const specialist = specialists[game.specialist];
  const focusNode = infrastructureTopologies[game.scenario].nodes.find(node => node.id === game.focusedNode);
  // A run of failed rolls is variance, not a misreading, and an operation decided
  // by it teaches nothing. The bonus is read from the player's own turn record, is
  // shown in the preview like any other part, and clears the moment one lands.
  let consecutiveFailures = 0;
  for (let index = game.turns.length - 1; index >= 0 && !game.turns[index].success; index--) consecutiveFailures++;
  const parts: ModifierPart[] = [
    { label: "Established", value: game.established.includes(procedure) ? 2 : 0, detail: "This evidence source is already established for the team." },
    { label: "Own source", value: ownSourceBonus(game, procedure), detail: "One of the declared reading's own evidence sources. Testing the explanation you have committed to earns this; it says nothing about whether the explanation is right." },
    { label: game.nextModifierSource ?? "Since your last roll", value: game.nextModifier, detail: "Set up by something since your last roll: monitoring a node on the map, an evidence decision, a command event, a correct comparison of two findings, or an inject. It applies to this roll only." },
    { label: "After two failed rolls", value: consecutiveFailures >= 2 ? 2 : 0, detail: `The last ${consecutiveFailures} procedures failed their roll. A run of failures adds +2 until one succeeds.` },
    specialist.procedures.includes(procedure as never) && game.specialistFatigue >= SPECIALIST_EXHAUSTED_AT
      ? { label: "Specialist", value: 0, suppressed: true, detail: `${specialist.title} works this source, but at fatigue ${game.specialistFatigue} of 6 the bonus no longer applies. Rest comes from finishing the operation.` }
      : { label: "Specialist", value: specialist.procedures.includes(procedure as never) ? 1 : 0, detail: `${specialist.title} works this source directly and is not fatigued.` },
    { label: "Map focus", value: focusNode?.procedures.includes(procedure) ? 1 : 0, detail: `The system selected on the infrastructure map is one this source examines${focusNode ? `: ${focusNode.label}.` : "."}` },
    { label: procedureScopes[plan.scope].title, value: procedureScopes[plan.scope].modifier, detail: procedureScopes[plan.scope].description },
    { label: procedureIntensities[plan.intensity].title, value: procedureIntensities[plan.intensity].modifier, detail: procedureIntensities[plan.intensity].description },
    { label: "Expert mode", value: game.mode === "expert" ? -1 : 0, detail: "Expert operations resolve every procedure one harder." },
  ];
  return { parts, total: parts.reduce((sum, part) => sum + part.value, 0) };
}

export const stageOf = (id: string) => attacks.find(attack => attack.id === id)?.stage ?? -1;

// The stage a Crisis re-route changes: the first unconfirmed stage after the one
// under test, or none when only one is left. It follows from which stages are
// confirmed, so a read can tell which stage changed without the chain.
export function crisisRerouteTarget(confirmedStages: Set<number>) {
  return [0, 1, 2, 3].filter(index => !confirmedStages.has(index))[1] ?? null;
}

export const terminal = (status: GameStatus) => status === "won" || status === "lost" || status === "exercise";

// A terminated operation holds no blocking state. Every end-state check routes
// through here, so the interface can never be left asking for a decision the
// engine would refuse.
// Whether any meter has reached the limit that ends an operation. Every transition
// that moves a meter asks this, so none can leave one at its limit while play
// continues.
export function breached(g: Game) {
  return g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100;
}

// One narrative for every failed roll the grace did not absorb. A failed check
// settles nothing about the reading, and the words must not say otherwise.
export const FAILED_CHECK = "The action did not produce reliable evidence. A failed check settles nothing about the working hypothesis either way; the team reorients.";

export function settle(g: Game, status: GameStatus): Game {
  g.status = status;
  if (terminal(status)) {
    g.pendingDecision = null;
    g.pendingCommand = null;
    g.pendingSetPiece = null;
  }
  return g;
}
