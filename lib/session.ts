// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { scenarios, difficulties, adversaryProfiles, type Game } from "./advanced-game.ts";

export const SESSION_KEY = "breach-command.session";
export const SESSION_VERSION = 2;

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
    const migrated: Game = {
      ...game,
      adversaryProfile: profile,
      hypothesisHistory: Array.isArray(game.hypothesisHistory) ? game.hypothesisHistory : [],
      decisions: Array.isArray(game.decisions) ? game.decisions.map(decision => ({
        ...decision,
        adaptationReason: decision.adaptationReason ?? null,
        quality: Number.isFinite(decision.quality) ? decision.quality : 3,
        rationale: decision.rationale ?? "This decision was restored from an earlier saved session.",
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
