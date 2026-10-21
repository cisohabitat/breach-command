// How many times the working hypothesis changed, shared by review and telemetry.
import type { Game } from "./types.ts";

export function countRevisions(game: Pick<Game, "hypothesisHistory">) {
  return game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0);
}
