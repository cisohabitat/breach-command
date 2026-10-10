// The glossary, which the game screen and every dialog show, loads once with
// the rest of the game (lib/game-loader.ts), never imported by a component: a
// module imported by several lazily loaded parts is copied into each of their
// scripts.
import { loadedGame } from "../game-loader.ts";

export function glossary() {
  return loadedGame().glossary;
}
