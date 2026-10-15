// The game's own script (components/game/game-bundle.ts), loaded once: when a
// part of the game first opens, when the browser is idle on the assignment
// screen, or when a saved operation has to be read. Until then the first load
// carries none of the engine.
import type * as Bundle from "../components/game/game-bundle.ts";
import { retryableLoad } from "./lazy-load.ts";

export type GameBundle = typeof Bundle;

let bundle: GameBundle | null = null;
const load = retryableLoad(() => import("../components/game/game-bundle.ts").then(module => (bundle = module)));

export function loadGame(): Promise<GameBundle> {
  return load();
}

// The loaded bundle, for code that only runs once an operation exists: there is
// no operation before loadGame() has resolved.
export function loadedGame(): GameBundle {
  if (!bundle) throw new Error("The game was used before it loaded; await loadGame() first.");
  return bundle;
}
