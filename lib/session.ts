// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { scenarios, difficulties, infrastructureTopologies, adversaryProfiles, type Game } from "./advanced-game.ts";
import type { NodePosture } from "./advanced-game";

export const SESSION_KEY = "breach-command.session";
export const SESSION_VERSION = 10;

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

export function parseSession(raw: string): SavedSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    if (!parsed || typeof parsed !== "object" || !parsed.game) return null;
    const game = parsed.game as Game;
    if (!Number.isInteger(game.scenario) || !scenarios[game.scenario]) return null;
    if (!difficulties[game.difficulty]) return null;
    if (!Array.isArray(game.chain) || game.chain.length !== 4 || !Array.isArray(game.turns)) return null;
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
      hypothesisHistory: Array.isArray(game.hypothesisHistory) ? game.hypothesisHistory : [],
      adversaryMemory: game.adversaryMemory ?? { procedureCounts: {}, observeChoices: 0, actChoices: 0, hypothesisChanges: 0 },
      pendingCommand: game.pendingCommand ?? null,
      commandHistory: Array.isArray(game.commandHistory) ? game.commandHistory : [],
      mode: game.mode ?? "campaign",
      turnLimit: Number.isFinite(game.turnLimit) ? game.turnLimit : difficulties[game.difficulty].maxTurns,
      specialist: game.specialist ?? "hunter",
      specialistFatigue: Number.isFinite(game.specialistFatigue) ? game.specialistFatigue : 0,
      sectorHealth: Number.isFinite(game.sectorHealth) ? game.sectorHealth : 100,
      sectorHistory: Array.isArray(game.sectorHistory) ? game.sectorHistory : [],
      objective: game.objective ?? "espionage",
      objectiveProgress: Number.isFinite(game.objectiveProgress) ? game.objectiveProgress : 5,
      campaignTier: Number.isFinite(game.campaignTier) ? game.campaignTier : 0,
      focusedNode,
      evidence: Array.isArray(game.evidence) ? game.evidence : [],
      correlations: Array.isArray(game.correlations) ? game.correlations.map(record => ({
        ...record,
        assessment: record.assessment ?? (record.valid ? "causal" : "coincidental"),
        correct: record.correct ?? true,
      })) : [],
      pendingSetPiece: game.pendingSetPiece ?? null,
      setPieceHistory: Array.isArray(game.setPieceHistory) ? game.setPieceHistory : [],
      campaignDoctrine: game.campaignDoctrine ?? "balanced",
      campaignRoute: game.campaignRoute ?? "common-ground",
      variant: game.variant ?? { id: `${game.scenario}-0`, title: "Standard operating picture", briefing: "The incident opens without an additional campaign complication.", modifier: "No starting modifier.", impact: 0, continuity: 0, objective: 0 },
      caseTheory: game.caseTheory ?? null,
      caseTheoryHistory: Array.isArray(game.caseTheoryHistory) ? game.caseTheoryHistory : [],
      nodePosture: Object.fromEntries(nodeIds.length ? nodeIds.map(id => [id, knownPosture.includes(storedPosture[id]) ? storedPosture[id] : "normal"]) : [["boundary", storedPosture.boundary ?? "normal"]]),
      mapActionsRemaining: Number.isFinite(game.mapActionsRemaining) ? game.mapActionsRemaining : 3,
      mapHistory: Array.isArray(game.mapHistory) ? game.mapHistory : [],
      turns: game.turns.map(turn => ({
        ...turn,
        plan: turn.plan ?? { scope: "focused", intensity: "balanced" },
        specialistBonus: Number.isFinite(turn.specialistBonus) ? turn.specialistBonus : 0,
        sectorChange: Number.isFinite(turn.sectorChange) ? turn.sectorChange : 0,
        objectiveChange: Number.isFinite(turn.objectiveChange) ? turn.objectiveChange : 0,
      })),
      decisions: Array.isArray(game.decisions) ? game.decisions.map(decision => ({
        ...decision,
        adaptationReason: decision.adaptationReason ?? null,
        quality: Number.isFinite(decision.quality) ? decision.quality : 3,
        rationale: decision.rationale ?? "This decision was restored from an earlier saved session.",
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
