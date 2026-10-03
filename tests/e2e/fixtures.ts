import { expect, type Page } from "@playwright/test";
import {
  attackVector, attacks, availableIn, newGame, nextEvidenceSource, playTurn, procedures,
  resolveCommand, resolveDecision, resolveSetPiece, setHypothesis, type Game,
} from "../../lib/advanced-game";
import { SESSION_KEY, serialiseSession } from "../../lib/session";

// Operations built from the engine with forced rolls, shared by the browser
// suites so that nothing in them depends on the dice, and the page opened on one
// of them as a saved session.

// A turn that confirmed the first stage, with its evidence decision still owed.
export function pendingDecisionGame(): Game {
  let game = newGame(0, "operational", () => 0);
  game = { ...game, injectDeck: [] };
  const stage = game.chain[0];
  game = setHypothesis(game, attackVector(stage));
  const source = attacks.find(item => item.id === stage)!.detect.find(id => procedures.some(item => item.id === id))!;
  game = playTurn(game, source, 20);
  if (game.pendingDecision !== stage) throw new Error("the fixture should owe a decision on the first stage");
  return game;
}

export function responsePhaseGame(): Game {
  for (let attempt = 0; attempt < 50; attempt++) {
    let game = newGame(0, "training");
    for (let guard = 0; guard < 60 && game.status === "playing"; guard++) {
      if (game.pendingDecision) { game = resolveDecision(game, "act"); continue; }
      if (game.pendingCommand) { game = resolveCommand(game, "a"); continue; }
      if (game.pendingSetPiece) { game = resolveSetPiece(game, "a"); continue; }
      const unrevealed = game.chain.find(id => !game.revealed.includes(id));
      if (unrevealed) game = setHypothesis(game, attackVector(unrevealed));
      const wanted = nextEvidenceSource(game)?.id;
      const procedure = wanted && availableIn(game, wanted) === 0
        ? wanted
        : procedures.find(item => availableIn(game, item.id) === 0)?.id;
      if (!procedure) break;
      game = playTurn(game, procedure, 20);
    }
    if (game.status === "response") return game;
  }
  throw new Error("could not build an operation that reaches the response phase");
}

// Two stages confirmed, no case theory and no comparison yet: the next-step
// note asks for a theory, then for the comparison.
export function twoStagesGame(): Game {
  let game = newGame(0, "operational", () => 0);
  game = { ...game, injectDeck: [] };
  for (let guard = 0; guard < 40 && game.status === "playing" && game.revealed.length < 2; guard++) {
    if (game.pendingDecision) { game = resolveDecision(game, "observe"); continue; }
    if (game.pendingCommand) { game = resolveCommand(game, "a"); continue; }
    if (game.pendingSetPiece) { game = resolveSetPiece(game, "a"); continue; }
    const stage = game.chain.find(id => !game.revealed.includes(id))!;
    game = setHypothesis(game, attackVector(stage));
    const source = nextEvidenceSource(game)!.id;
    game = playTurn(game, source, 20);
  }
  while (game.pendingDecision) game = resolveDecision(game, "observe");
  if (game.pendingCommand) game = resolveCommand(game, "a");
  if (game.pendingSetPiece) game = resolveSetPiece(game, "a");
  if (game.revealed.length < 2 || game.status !== "playing") throw new Error("the fixture should hold two confirmed stages");
  return game;
}

// Two turns played and no map action used: the map is offered beside the next step.
export function mapOfferGame(): Game {
  let game = setHypothesis({ ...newGame(0, "training", () => 0), injectDeck: [] }, "identity");
  for (let turn = 0; turn < 2; turn++) {
    const procedure = procedures.find(item => availableIn(game, item.id) === 0)!.id;
    game = playTurn(game, procedure, 2);
    if (game.pendingSetPiece) game = resolveSetPiece(game, "c");
    if (game.pendingCommand) game = resolveCommand(game, "a");
  }
  if (game.turns.length !== 2 || game.mapHistory.length) throw new Error("the fixture should be two turns in with the map unused");
  return game;
}

export async function openWithSave(page: Page, game: Game | null, guided = false) {
  await page.addInitScript(([key, value]) => {
    try {
      localStorage.clear();
      localStorage.setItem("breach-command.tutorial-complete", "true");
      if (value) localStorage.setItem(key, value);
    } catch {}
  }, [SESSION_KEY, game ? serialiseSession(game, guided, false) : ""] as const);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".briefing-screen")).toBeVisible();
  // The page is prerendered, so its key handlers exist only once it has hydrated.
  await page.waitForLoadState("networkidle");
}
