import { attacks, scenarios, difficulties, infrastructureTopologies, adversaryProfiles, adversaryObjectives, commandEvents, gameModes, specialists, type Game, type GameStatus } from "./advanced-game.ts";
import type { CarriedSource, NodePosture } from "./advanced-game";
import { injects } from "./engine/content.ts";
import { isMessage, legacy, msg, type Message } from "./i18n/message.ts";

export const SESSION_KEY = "breach-command.session";
// Where a save this build cannot read is moved before anything replaces it, so a
// newer build's operation outlives an older bundle served offline. A build that
// can read it moves it back and offers it for resume.
export const PARKED_SESSION_KEY = "breach-command.session.parked";
// 18: the Weekly operation mode, which an older build would read as damaged.
// 19: what the engine wrote for the player is stored as messages and content
// references (lib/i18n/message.ts), not English, so a save reads in any
// language; an older save's sentences are kept as they were, verbatim.
export const SESSION_VERSION = 19;

// A stored sentence: a message from version 19, or an older save's English,
// kept as the player read it.
const text = (value: unknown, fallback: Message): Message => isMessage(value) ? value : typeof value === "string" ? legacy(value.slice(0, 2000)) : fallback;
const optionalText = (value: unknown): Message | null => value === null || value === undefined ? null : text(value, legacy(""));
// Before version 19 the carried change to the next roll was one string, its
// sources joined: "Monitored Access boundary +2; Inject: Hard going −2,
// together". Each source, with its share, is read back out of it.
const JOINED = /(, together|: [+−]\d+, capped at)$/;
function carriedFrom(label: string, value: number): CarriedSource[] {
  if (!JOINED.test(label)) return [{ source: legacy(label), change: value }];
  return label.replace(JOINED, "").split("; ").map(entry => {
    const share = entry.match(/^(.*) ([+−])(\d+)$/);
    return share ? { source: legacy(share[1]), change: (share[2] === "−" ? -1 : 1) * Number(share[3]) } : { source: legacy(entry), change: 0 };
  });
}
function sourcesOf(game: { nextModifierSources?: unknown; nextModifierSource?: unknown; nextModifier?: unknown }): CarriedSource[] {
  if (Array.isArray(game.nextModifierSources)) return game.nextModifierSources.filter((item: unknown): item is CarriedSource => !!item && isMessage((item as CarriedSource).source) && Number.isFinite((item as CarriedSource).change)).slice(0, 8);
  return typeof game.nextModifierSource === "string" && game.nextModifierSource.length <= 400 ? carriedFrom(game.nextModifierSource, Number(game.nextModifier) || 0) : [];
}

export type SavedSession = {
  version: number;
  savedAt: string;
  game: Game;
  guided: boolean;
  fastResolve: boolean;
};

export function serialiseSession(game: Game, guided: boolean, fastResolve: boolean) {
  const session: SavedSession = {
    version: SESSION_VERSION,
    savedAt: new Date().toISOString(),
    game,
    guided,
    fastResolve,
  };
  return JSON.stringify(session);
}

// A save is only ever written by this device, but it is plain text in local
// storage: it can be hand-edited, truncated, or restored from a backup written
// by a newer build. Anything that would put the engine into a state its own
// transitions cannot produce is rejected outright; anything merely missing is
// defaulted.
const statuses: GameStatus[] = ["playing", "response", "won", "lost", "exercise"];
const bounded = (value: unknown, fallback: number, min = 0, max = 100) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, Number(value))) : fallback;

// A save written by a newer build may carry fields this version cannot migrate.
// It is not this build's to read, and not this build's to delete either: an
// older bundle served offline would otherwise destroy the newer save.
export function sessionFromNewerBuild(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedSession> | null;
    return !!parsed && typeof parsed === "object" && typeof parsed.version === "number" && parsed.version > SESSION_VERSION;
  } catch {
    return false;
  }
}

const isKnown = (table: object, key: unknown) => typeof key === "string" && Object.hasOwn(table, key);

function injectOf(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const card = value as { id?: unknown; reason?: unknown; effectLabel?: unknown };
  const content = injects.find(item => item.id === card.id);
  if (!content) return null;
  const label = typeof card.effectLabel === "string" && card.effectLabel !== content.effectLabel ? legacy(card.effectLabel) : isMessage(card.effectLabel) ? card.effectLabel : undefined;
  return { id: content.id, reason: text(card.reason, legacy("")), ...(label ? { effectLabel: label } : {}) };
}

export function parseSession(raw: string): SavedSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    if (!parsed || typeof parsed !== "object" || !parsed.game) return null;
    if (parsed.version !== undefined && (!Number.isInteger(parsed.version) || Number(parsed.version) < 1)) return null;
    if (Number(parsed.version) > SESSION_VERSION) return null;
    const game = parsed.game as Game;
    if (!Number.isInteger(game.scenario) || !scenarios[game.scenario]) return null;
    if (!difficulties[game.difficulty]) return null;
    if (!Array.isArray(game.chain) || game.chain.length !== 4 || !Array.isArray(game.turns)) return null;
    if (!game.chain.every(id => attacks.some(attack => attack.id === id))) return null;
    if (!Array.isArray(game.revealed) || game.revealed.length > 4) return null;
    if (!game.revealed.every(id => game.chain.includes(id)) || new Set(game.revealed).size !== game.revealed.length) return null;
    if (!statuses.includes(game.status)) return null;
    // Missing fields are defaulted below, but a value that names something the
    // game does not have would crash the first screen that looks it up.
    if (game.objective !== undefined && !isKnown(adversaryObjectives, game.objective)) return null;
    if (game.mode !== undefined && !isKnown(gameModes, game.mode)) return null;
    if (game.specialist !== undefined && !isKnown(specialists, game.specialist)) return null;
    if (game.pendingDecision && !game.revealed.includes(game.pendingDecision)) return null;
    // The response phase only exists once every stage has been revealed, so a
    // save claiming otherwise did not come from a real playthrough.
    if (game.status === "response" && game.revealed.length < 4) return null;
    const responseChoices = Array.isArray(game.responseChoices) ? game.responseChoices : [];
    if (responseChoices.length > 3) return null;
    if (game.status === "playing" && responseChoices.length) return null;
    if (game.status === "response" && responseChoices.length >= 3) return null;
    // A win is a completed response to a fully confirmed chain.
    if (game.status === "won" && (game.revealed.length < 4 || responseChoices.length !== 3)) return null;
    // A finished operation holds no blocking state, so a save that claims both is
    // settled here rather than resumed into a choice nothing will accept.
    const finished = game.status === "won" || game.status === "lost" || game.status === "exercise";
    const profile = game.adversaryProfile && adversaryProfiles[game.adversaryProfile] ? game.adversaryProfile : "ghost";
    // Topologies vary per scenario, so a restored session is re-keyed to the
    // nodes that exist on this incident's map. Legacy or stale node ids become
    // normal posture rather than an invalid map.
    const topologyNodes = infrastructureTopologies[game.scenario]?.nodes ?? [];
    const nodeIds = topologyNodes.map(node => node.id);
    const knownPosture: NodePosture[] = ["normal", "monitored", "isolated", "restored"];
    const storedPosture = game.nodePosture && typeof game.nodePosture === "object" ? game.nodePosture as Record<string, NodePosture> : {};
    const focusedNode = typeof game.focusedNode === "string" && nodeIds.includes(game.focusedNode) ? game.focusedNode : topologyNodes[1]?.id ?? nodeIds[0] ?? "boundary";
    const migrated: Game = {
      ...game,
      adversaryProfile: profile,
      impact: bounded(game.impact, 0),
      continuity: bounded(game.continuity, 100),
      failures: bounded(game.failures, 0, 0, 3),
      nextModifier: bounded(game.nextModifier, 0, -5, 5),
      // Version 15 names what set the modifier; older saves carry none.
      nextModifierSources: sourcesOf(game),
      adversaryEvent: optionalText(game.adversaryEvent),
      adversaryTempo: bounded(game.adversaryTempo, 0, 0, 3),
      responseScore: bounded(game.responseScore, 0, 0, 100),
      established: Array.isArray(game.established) ? game.established : [],
      lastUsed: game.lastUsed && typeof game.lastUsed === "object" ? game.lastUsed : {},
      injectDeck: Array.isArray(game.injectDeck) ? game.injectDeck : [],
      // Version 17 remembers the campaign's recent command events; older saves met none.
      recentCommands: Array.isArray(game.recentCommands) ? game.recentCommands.filter((id: unknown) => typeof id === "string" && id in commandEvents) : [],
      recentCrises: Array.isArray(game.recentCrises) ? game.recentCrises.filter((id: unknown) => typeof id === "string" && /^sector-\d+(-b)?$/.test(id)) : [],
      responseChoices,
      seed: typeof game.seed === "number" && Number.isFinite(game.seed) ? game.seed : null,
      hypothesisHistory: Array.isArray(game.hypothesisHistory) ? game.hypothesisHistory : [],
      adversaryMemory: game.adversaryMemory ?? { procedureCounts: {}, observeChoices: 0, actChoices: 0, hypothesisChanges: 0 },
      pendingDecision: finished ? null : game.pendingDecision ?? null,
      pendingCommand: finished ? null : game.pendingCommand ?? null,
      commandHistory: Array.isArray(game.commandHistory) ? game.commandHistory.map(record => ({ ...record, title: text(record.title, legacy("")), effect: text(record.effect, legacy("")) })) : [],
      mode: game.mode ?? "campaign",
      turnLimit: Number.isFinite(game.turnLimit) ? game.turnLimit : difficulties[game.difficulty].maxTurns,
      specialist: game.specialist ?? "hunter",
      specialistFatigue: Number.isFinite(game.specialistFatigue) ? game.specialistFatigue : 0,
      sectorHealth: bounded(game.sectorHealth, 100),
      sectorHistory: Array.isArray(game.sectorHistory) ? game.sectorHistory : [],
      objective: game.objective ?? "espionage",
      objectiveProgress: bounded(game.objectiveProgress, 5),
      campaignTier: Number.isFinite(game.campaignTier) ? game.campaignTier : 0,
      focusedNode,
      evidence: Array.isArray(game.evidence) ? game.evidence.map(item => ({ ...item, title: text(item.title, legacy("")), source: text(item.source, legacy("")), system: text(item.system, legacy("")), detail: text(item.detail, legacy("")) })) : [],
      correlations: Array.isArray(game.correlations) ? game.correlations.map(record => ({
        ...record,
        assessment: record.assessment ?? (record.valid ? "causal" : "coincidental"),
        correct: record.correct ?? true,
        finding: text(record.finding, legacy("")),
      })) : [],
      pendingSetPiece: finished ? null : game.pendingSetPiece ?? null,
      setPieceHistory: Array.isArray(game.setPieceHistory) ? game.setPieceHistory.map(record => ({ ...record, title: text(record.title, legacy("")), effect: text(record.effect, legacy("")) })) : [],
      campaignDoctrine: game.campaignDoctrine ?? "balanced",
      campaignRoute: game.campaignRoute ?? "common-ground",
      variant: game.variant
        ? { ...game.variant, title: text(game.variant.title, msg("engine.variant.standardTitle")), briefing: text(game.variant.briefing, msg("engine.variant.standardBriefing")), modifier: text(game.variant.modifier, msg("engine.variant.standardModifier")) }
        : { id: `${game.scenario}-0`, title: msg("engine.variant.standardTitle"), briefing: msg("engine.variant.standardBriefing"), modifier: msg("engine.variant.standardModifier"), impact: 0, continuity: 0, objective: 0 },
      caseTheory: game.caseTheory ?? null,
      caseTheoryHistory: Array.isArray(game.caseTheoryHistory) ? game.caseTheoryHistory : [],
      nodePosture: Object.fromEntries(nodeIds.length ? nodeIds.map(id => [id, knownPosture.includes(storedPosture[id]) ? storedPosture[id] : "normal"]) : [["boundary", storedPosture.boundary ?? "normal"]]),
      mapActionsRemaining: Number.isFinite(game.mapActionsRemaining) ? game.mapActionsRemaining : 3,
      graceRemaining: Number.isFinite(game.graceRemaining) ? Math.max(0, Math.min(1, Number(game.graceRemaining))) : 0,
      mapHistory: Array.isArray(game.mapHistory) ? game.mapHistory.map(record => ({ ...record, effect: text(record.effect, legacy("")) })) : [],
      turns: game.turns.map(turn => ({
        ...turn,
        plan: turn.plan ?? { scope: "focused", intensity: "balanced" },
        specialistBonus: Number.isFinite(turn.specialistBonus) ? turn.specialistBonus : 0,
        // Version 16 names every part of the roll; an older turn has none and the
        // report falls back to its own-source and specialist summary.
        // Version 19 stores a part's label as a message, and a carried part its
        // sources; an older joined label is read back into them.
        parts: Array.isArray(turn.parts) ? turn.parts.filter((part: unknown) => !!part && (typeof (part as { label?: unknown }).label === "string" || isMessage((part as { label?: unknown }).label)) && Number.isFinite((part as { value?: unknown }).value)).slice(0, 12).map((part: { label: unknown; value: number; sources?: unknown }) => {
          if (typeof part.label !== "string") return { label: part.label as Message, value: part.value, ...(Array.isArray(part.sources) ? { sources: sourcesOf({ nextModifierSources: part.sources }) } : {}) };
          return JOINED.test(part.label) ? { label: legacy(part.label), value: part.value, sources: carriedFrom(part.label, part.value) } : { label: legacy(part.label), value: part.value };
        }) : [],
        narrative: text(turn.narrative, legacy("")),
        adversaryEvent: optionalText(turn.adversaryEvent),
        // Before version 19 a turn kept a copy of the inject card; now its id,
        // and what the card did when that depended on the game.
        inject: injectOf(turn.inject),
        hypothesisTarget: typeof turn.hypothesisTarget === "string" ? turn.hypothesisTarget : null,
        hypothesisMatched: turn.hypothesisMatched === true,
        discriminating: turn.discriminating === true,
        windfall: turn.windfall === true,
        sectorChange: Number.isFinite(turn.sectorChange) ? turn.sectorChange : 0,
        objectiveChange: Number.isFinite(turn.objectiveChange) ? turn.objectiveChange : 0,
      })),
      decisions: Array.isArray(game.decisions) ? game.decisions.map(decision => ({
        ...decision,
        title: text(decision.title, legacy("")),
        effect: text(decision.effect, legacy("")),
        counterfactual: text(decision.counterfactual, legacy("")),
        adaptationReason: optionalText(decision.adaptationReason),
        quality: Number.isFinite(decision.quality) ? decision.quality : 3,
        rationale: text(decision.rationale, legacy("This decision was restored from an earlier saved session.")),
        impactChange: Number.isFinite(decision.impactChange) ? decision.impactChange : 0,
        continuityChange: Number.isFinite(decision.continuityChange) ? decision.continuityChange : 0,
        tempoChange: Number.isFinite(decision.tempoChange) ? decision.tempoChange : 0,
        sectorChange: Number.isFinite(decision.sectorChange) ? decision.sectorChange : 0,
        objectiveChange: Number.isFinite(decision.objectiveChange) ? decision.objectiveChange : 0,
      })) : [],
    };
    return {
      version: SESSION_VERSION,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      game: migrated,
      guided: parsed.guided !== false,
      fastResolve: parsed.fastResolve === true,
    };
  } catch {
    return null;
  }
}
